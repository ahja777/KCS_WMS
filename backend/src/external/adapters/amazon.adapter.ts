import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import {
  IChannelAdapter,
  ChannelCredentials,
  ChannelOrderResult,
  ShipmentInfo,
  InventoryUpdateInfo,
  ChannelProductInfo,
} from './channel-adapter.interface';

/**
 * Amazon SP-API (Selling Partner API) 어댑터
 *
 * 인증: OAuth 2.0 (LWA) + AWS Signature v4
 * 필요 credentials: {
 *   clientId, clientSecret, refreshToken,
 *   accessKeyId, secretAccessKey, region, marketplaceId
 * }
 */
@Injectable()
export class AmazonAdapter implements IChannelAdapter {
  private readonly logger = new Logger(AmazonAdapter.name);
  private readonly tokenUrl = 'https://api.amazon.com/auth/o2/token';

  private readonly regionEndpoints: Record<string, string> = {
    na: 'https://sellingpartnerapi-na.amazon.com',
    eu: 'https://sellingpartnerapi-eu.amazon.com',
    fe: 'https://sellingpartnerapi-fe.amazon.com',
  };

  constructor(private readonly httpService: HttpService) {}

  private getBaseUrl(credentials: ChannelCredentials): string {
    const region = (credentials.region || 'na').toLowerCase();
    return this.regionEndpoints[region] || this.regionEndpoints.na;
  }

  /**
   * LWA 토큰 발급 (refresh_token → access_token)
   */
  private async getAccessToken(credentials: ChannelCredentials): Promise<string> {
    const { data } = await this.httpService.axiosRef.post(
      this.tokenUrl,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      },
    );
    return data.access_token;
  }

  /**
   * AWS Signature v4 서명
   */
  private signRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body: string,
    credentials: ChannelCredentials,
  ): Record<string, string> {
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const shortDate = dateStamp.slice(0, 8);
    const region = credentials.awsRegion || 'us-east-1';
    const service = 'execute-api';

    const parsedUrl = new URL(url);
    const canonicalUri = parsedUrl.pathname;
    const canonicalQuerystring = parsedUrl.searchParams.toString();

    headers['x-amz-date'] = dateStamp;
    headers['host'] = parsedUrl.host;

    const signedHeaders = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort()
      .join(';');

    const canonicalHeaders = Object.keys(headers)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
      .join('\n') + '\n';

    const payloadHash = crypto
      .createHash('sha256')
      .update(body || '')
      .digest('hex');

    const canonicalRequest = [
      method.toUpperCase(),
      canonicalUri,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      dateStamp,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this.getSignatureKey(
      credentials.secretAccessKey,
      shortDate,
      region,
      service,
    );

    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    headers[
      'Authorization'
    ] = `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return headers;
  }

  private getSignatureKey(
    key: string,
    dateStamp: string,
    region: string,
    service: string,
  ): Buffer {
    const kDate = crypto
      .createHmac('sha256', `AWS4${key}`)
      .update(dateStamp)
      .digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto
      .createHmac('sha256', kRegion)
      .update(service)
      .digest();
    return crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest();
  }

  private async getAuthHeaders(
    method: string,
    url: string,
    credentials: ChannelCredentials,
    body = '',
  ): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken(credentials);
    let headers: Record<string, string> = {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
    };
    headers = this.signRequest(method, url, headers, body, credentials);
    return headers;
  }

  async testConnection(credentials: ChannelCredentials): Promise<boolean> {
    try {
      await this.getAccessToken(credentials);
      this.logger.log('아마존 연결 테스트 성공');
      return true;
    } catch (error) {
      this.logger.error(`아마존 연결 테스트 실패: ${error.message}`);
      return false;
    }
  }

  async fetchOrders(
    credentials: ChannelCredentials,
    fromDate: Date,
    toDate: Date,
  ): Promise<ChannelOrderResult[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials);
      const marketplaceIds = credentials.marketplaceId || 'ATVPDKIKX0DER';
      const path = `/orders/v0/orders`;
      const params = new URLSearchParams({
        MarketplaceIds: marketplaceIds,
        CreatedAfter: fromDate.toISOString(),
        CreatedBefore: toDate.toISOString(),
        OrderStatuses: 'Unshipped',
      });
      const url = `${baseUrl}${path}?${params}`;
      const headers = await this.getAuthHeaders('GET', url, credentials);

      const { data } = await this.httpService.axiosRef.get(url, {
        headers,
        timeout: 30000,
      });

      const orders = data.payload?.Orders || [];
      const results: ChannelOrderResult[] = [];

      for (const order of orders) {
        // 주문 상품 조회
        const itemsUrl = `${baseUrl}/orders/v0/orders/${order.AmazonOrderId}/orderItems`;
        const itemHeaders = await this.getAuthHeaders(
          'GET',
          itemsUrl,
          credentials,
        );
        const { data: itemsData } = await this.httpService.axiosRef.get(
          itemsUrl,
          { headers: itemHeaders, timeout: 15000 },
        );
        const orderItems = itemsData.payload?.OrderItems || [];

        results.push(this.mapOrder(order, orderItems));
      }

      return results;
    } catch (error) {
      this.logger.error(`아마존 주문 조회 실패: ${error.message}`);
      throw new Error(`아마존 주문 조회 실패: ${error.message}`);
    }
  }

  private mapOrder(order: any, orderItems: any[]): ChannelOrderResult {
    const shipping = order.ShippingAddress || {};
    return {
      platformOrderId: order.AmazonOrderId,
      platformOrderNo: order.AmazonOrderId,
      orderDate: new Date(order.PurchaseDate),
      customerName: shipping.Name,
      customerPhone: shipping.Phone,
      shippingAddress: [
        shipping.AddressLine1,
        shipping.AddressLine2,
        shipping.City,
        shipping.StateOrRegion,
        shipping.CountryCode,
      ]
        .filter(Boolean)
        .join(', '),
      shippingZipCode: shipping.PostalCode,
      shippingMethod: order.ShipmentServiceLevelCategory,
      totalAmount: parseFloat(
        order.OrderTotal?.Amount || '0',
      ),
      currency: order.OrderTotal?.CurrencyCode || 'USD',
      items: orderItems.map((item: any) => ({
        platformItemId: item.ASIN,
        platformSku: item.SellerSKU,
        itemName: item.Title || '',
        quantity: item.QuantityOrdered || 1,
        unitPrice: parseFloat(item.ItemPrice?.Amount || '0'),
      })),
      rawData: { order, orderItems },
    };
  }

  async confirmShipment(
    credentials: ChannelCredentials,
    shipment: ShipmentInfo,
  ): Promise<boolean> {
    try {
      const baseUrl = this.getBaseUrl(credentials);
      const url = `${baseUrl}/orders/v0/orders/${shipment.platformOrderId}/shipmentConfirmation`;
      const body = JSON.stringify({
        marketplaceId: credentials.marketplaceId || 'ATVPDKIKX0DER',
        shipmentStatus: 'ReadyForPickup',
        shippingSettings: {
          carrierName: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
        },
      });

      const headers = await this.getAuthHeaders(
        'POST',
        url,
        credentials,
        body,
      );

      await this.httpService.axiosRef.post(url, body, {
        headers,
        timeout: 10000,
      });

      this.logger.log(
        `아마존 배송확인 성공: orderId=${shipment.platformOrderId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`아마존 배송확인 실패: ${error.message}`);
      return false;
    }
  }

  async updateInventory(
    credentials: ChannelCredentials,
    items: InventoryUpdateInfo[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const baseUrl = this.getBaseUrl(credentials);

    for (const item of items) {
      try {
        const sellerId = credentials.sellerId || '';
        const url = `${baseUrl}/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(item.platformSku)}`;
        const body = JSON.stringify({
          productType: 'PRODUCT',
          patches: [
            {
              op: 'replace',
              path: '/attributes/fulfillment_availability',
              value: [
                {
                  fulfillment_channel_code: 'DEFAULT',
                  quantity: item.quantity,
                },
              ],
            },
          ],
        });

        const headers = await this.getAuthHeaders(
          'PATCH',
          url,
          credentials,
          body,
        );

        await this.httpService.axiosRef.patch(url, body, {
          headers,
          params: {
            marketplaceIds: credentials.marketplaceId || 'ATVPDKIKX0DER',
          },
          timeout: 10000,
        });

        success++;
      } catch (error) {
        this.logger.warn(
          `아마존 재고 업데이트 실패 (SKU: ${item.platformSku}): ${error.message}`,
        );
        failed++;
      }
    }

    return { success, failed };
  }

  async fetchProducts(
    credentials: ChannelCredentials,
    page = 1,
    limit = 50,
  ): Promise<ChannelProductInfo[]> {
    try {
      const baseUrl = this.getBaseUrl(credentials);
      const sellerId = credentials.sellerId || '';
      const url = `${baseUrl}/listings/2021-08-01/items/${sellerId}`;
      const headers = await this.getAuthHeaders('GET', url, credentials);

      const { data } = await this.httpService.axiosRef.get(url, {
        headers,
        params: {
          marketplaceIds: credentials.marketplaceId || 'ATVPDKIKX0DER',
          pageSize: limit,
          pageToken: page > 1 ? String(page) : undefined,
        },
        timeout: 30000,
      });

      const items = data.items || [];
      return items.map((item: any) => ({
        platformProductId: item.asin || '',
        platformSku: item.sku,
        name: item.summaries?.[0]?.itemName || '',
        price: item.summaries?.[0]?.mainImage?.price?.amount,
        quantity: item.fulfillmentAvailability?.[0]?.quantity,
      }));
    } catch (error) {
      this.logger.error(`아마존 상품 조회 실패: ${error.message}`);
      throw new Error(`아마존 상품 조회 실패: ${error.message}`);
    }
  }
}
