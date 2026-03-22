import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  IChannelAdapter,
  ChannelCredentials,
  ChannelOrderResult,
  ShipmentInfo,
  InventoryUpdateInfo,
  ChannelProductInfo,
} from './channel-adapter.interface';

/**
 * 네이버 스마트스토어 Commerce API 어댑터
 *
 * 인증: OAuth 2.0 (client_id, client_secret → Bearer token)
 * 필요 credentials: { clientId, clientSecret }
 * Base URL: https://api.commerce.naver.com/external
 */
@Injectable()
export class NaverAdapter implements IChannelAdapter {
  private readonly logger = new Logger(NaverAdapter.name);
  private readonly baseUrl = 'https://api.commerce.naver.com/external';
  private readonly tokenUrl = 'https://api.commerce.naver.com/external/v1/oauth2/token';

  constructor(private readonly httpService: HttpService) {}

  /**
   * OAuth2 토큰 발급
   */
  private async getAccessToken(credentials: ChannelCredentials): Promise<string> {
    const timestamp = Date.now();
    // client_secret_sign = Base64(HMAC-SHA256(clientId + '_' + timestamp, clientSecret))
    const { createHmac } = await import('crypto');
    const clientSecretSign = createHmac('sha256', credentials.clientSecret)
      .update(`${credentials.clientId}_${timestamp}`)
      .digest('base64');

    const params = new URLSearchParams();
    params.append('client_id', credentials.clientId);
    params.append('timestamp', String(timestamp));
    params.append('client_secret_sign', clientSecretSign);
    params.append('grant_type', 'client_credentials');
    params.append('type', 'SELF');

    const { data } = await this.httpService.axiosRef.post(
      this.tokenUrl,
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      },
    );

    return data.access_token;
  }

  private async getHeaders(credentials: ChannelCredentials) {
    const token = await this.getAccessToken(credentials);
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async testConnection(credentials: ChannelCredentials): Promise<boolean> {
    try {
      await this.getAccessToken(credentials);
      this.logger.log('네이버 연결 테스트 성공');
      return true;
    } catch (error) {
      this.logger.error(`네이버 연결 테스트 실패: ${error.message}`);
      return false;
    }
  }

  async fetchOrders(
    credentials: ChannelCredentials,
    fromDate: Date,
    toDate: Date,
  ): Promise<ChannelOrderResult[]> {
    try {
      const headers = await this.getHeaders(credentials);

      // 1. 변경된 주문 목록 조회
      const { data: statusData } = await this.httpService.axiosRef.get(
        `${this.baseUrl}/v1/pay-order/seller/product-orders/last-changed-statuses`,
        {
          headers,
          params: {
            lastChangedFrom: fromDate.toISOString(),
            lastChangedTo: toDate.toISOString(),
            lastChangedType: 'PAYED',
          },
          timeout: 30000,
        },
      );

      const productOrderIds =
        statusData.data?.lastChangeStatuses?.map(
          (s: any) => s.productOrderId,
        ) || [];

      if (productOrderIds.length === 0) return [];

      // 2. 주문 상세 조회 (50건씩)
      const results: ChannelOrderResult[] = [];
      const chunks = this.chunkArray(productOrderIds, 50);

      for (const chunk of chunks) {
        const { data: detailData } = await this.httpService.axiosRef.post(
          `${this.baseUrl}/v1/pay-order/seller/product-orders/query`,
          { productOrderIds: chunk },
          { headers, timeout: 30000 },
        );

        const orders = detailData.data?.productOrders || [];
        for (const order of orders) {
          results.push(this.mapOrder(order));
        }
      }

      return this.groupOrdersByOrderNo(results);
    } catch (error) {
      this.logger.error(`네이버 주문 조회 실패: ${error.message}`);
      throw new Error(`네이버 주문 조회 실패: ${error.message}`);
    }
  }

  private mapOrder(order: any): ChannelOrderResult {
    const shipping = order.shippingAddress || {};
    return {
      platformOrderId: order.productOrderId,
      platformOrderNo: order.orderId,
      orderDate: new Date(order.paymentDate || order.orderDate),
      customerName: shipping.name || order.ordererName,
      customerPhone: shipping.tel1 || shipping.tel2,
      shippingAddress: [shipping.baseAddress, shipping.detailAddress]
        .filter(Boolean)
        .join(' '),
      shippingZipCode: shipping.zipCode,
      shippingMethod: order.deliveryMethod,
      totalAmount: order.totalPaymentAmount || order.unitPrice * order.quantity,
      currency: 'KRW',
      items: [
        {
          platformItemId: String(order.productId || ''),
          platformSku: order.sellerProductCode || String(order.productId),
          itemName: order.productName || '',
          quantity: order.quantity || 1,
          unitPrice: order.unitPrice,
        },
      ],
      rawData: order,
    };
  }

  /**
   * 네이버는 productOrder 단위이므로, orderId 기준으로 그룹핑
   */
  private groupOrdersByOrderNo(
    orders: ChannelOrderResult[],
  ): ChannelOrderResult[] {
    const grouped = new Map<string, ChannelOrderResult>();

    for (const order of orders) {
      const key = order.platformOrderNo || order.platformOrderId;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.items.push(...order.items);
        existing.totalAmount =
          (existing.totalAmount || 0) + (order.totalAmount || 0);
      } else {
        grouped.set(key, { ...order });
      }
    }

    return Array.from(grouped.values());
  }

  async confirmShipment(
    credentials: ChannelCredentials,
    shipment: ShipmentInfo,
  ): Promise<boolean> {
    try {
      const headers = await this.getHeaders(credentials);

      const { data } = await this.httpService.axiosRef.post(
        `${this.baseUrl}/v1/pay-order/seller/product-orders/dispatch`,
        {
          dispatchProductOrders: [
            {
              productOrderId: shipment.platformOrderId,
              deliveryMethod: 'DELIVERY',
              deliveryCompanyCode: shipment.carrier,
              trackingNumber: shipment.trackingNumber,
              dispatchDate: new Date().toISOString(),
            },
          ],
        },
        { headers, timeout: 10000 },
      );

      const success = data.data?.successProductOrderIds?.length > 0;
      this.logger.log(
        `네이버 배송확인 ${success ? '성공' : '실패'}: orderId=${shipment.platformOrderId}`,
      );
      return success;
    } catch (error) {
      this.logger.error(`네이버 배송확인 실패: ${error.message}`);
      return false;
    }
  }

  async updateInventory(
    credentials: ChannelCredentials,
    items: InventoryUpdateInfo[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const headers = await this.getHeaders(credentials);

    for (const item of items) {
      try {
        // 네이버는 상품 수정 API로 재고 업데이트
        await this.httpService.axiosRef.put(
          `${this.baseUrl}/v2/products/channel-products/origin-products/${item.platformSku}`,
          {
            stockQuantity: item.quantity,
          },
          { headers, timeout: 10000 },
        );
        success++;
      } catch (error) {
        this.logger.warn(
          `네이버 재고 업데이트 실패 (SKU: ${item.platformSku}): ${error.message}`,
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
      const headers = await this.getHeaders(credentials);

      const { data } = await this.httpService.axiosRef.get(
        `${this.baseUrl}/v2/products`,
        {
          headers,
          params: {
            page,
            size: limit,
          },
          timeout: 30000,
        },
      );

      const products = data.data?.contents || [];
      return products.map((p: any) => ({
        platformProductId: String(p.originProductNo),
        platformSku: p.sellerManagementCode || String(p.originProductNo),
        name: p.name || '',
        price: p.salePrice,
        quantity: p.stockQuantity,
      }));
    } catch (error) {
      this.logger.error(`네이버 상품 조회 실패: ${error.message}`);
      throw new Error(`네이버 상품 조회 실패: ${error.message}`);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
