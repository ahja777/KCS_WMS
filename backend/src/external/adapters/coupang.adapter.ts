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
 * 쿠팡 Wing API 어댑터
 *
 * 인증: HMAC-SHA256 서명
 * 필요 credentials: { vendorId, accessKey, secretKey }
 * Base URL: https://api-gateway.coupang.com
 */
@Injectable()
export class CoupangAdapter implements IChannelAdapter {
  private readonly logger = new Logger(CoupangAdapter.name);
  private readonly baseUrl = 'https://api-gateway.coupang.com';

  constructor(private readonly httpService: HttpService) {}

  /**
   * HMAC-SHA256 서명 생성
   */
  private generateSignature(
    method: string,
    path: string,
    secretKey: string,
    accessKey: string,
  ): { authorization: string; timestamp: string } {
    const datetime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const message = `${datetime}${method}${path}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('hex');

    const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;

    return { authorization, timestamp: datetime };
  }

  private getHeaders(
    method: string,
    path: string,
    credentials: ChannelCredentials,
  ) {
    const { authorization, timestamp } = this.generateSignature(
      method,
      path,
      credentials.secretKey,
      credentials.accessKey,
    );

    return {
      Authorization: authorization,
      'Content-Type': 'application/json;charset=UTF-8',
      'X-Reqeust-ID': crypto.randomUUID(),
      'X-Timestamp': timestamp,
    };
  }

  async testConnection(credentials: ChannelCredentials): Promise<boolean> {
    try {
      const path = `/v2/providers/openapi/apis/api/v4/vendors/${credentials.vendorId}/ordersheets`;
      const headers = this.getHeaders('GET', path, credentials);

      const { data } = await this.httpService.axiosRef.get(
        `${this.baseUrl}${path}`,
        {
          headers,
          params: {
            createdAtFrom: new Date(Date.now() - 3600000).toISOString(),
            createdAtTo: new Date().toISOString(),
            status: 'ACCEPT',
          },
          timeout: 10000,
        },
      );

      this.logger.log(`쿠팡 연결 테스트 성공: vendorId=${credentials.vendorId}`);
      return data.code === '200' || data.code === 200;
    } catch (error) {
      this.logger.error(`쿠팡 연결 테스트 실패: ${error.message}`);
      return false;
    }
  }

  async fetchOrders(
    credentials: ChannelCredentials,
    fromDate: Date,
    toDate: Date,
  ): Promise<ChannelOrderResult[]> {
    try {
      const path = `/v2/providers/openapi/apis/api/v4/vendors/${credentials.vendorId}/ordersheets`;
      const headers = this.getHeaders('GET', path, credentials);

      const { data } = await this.httpService.axiosRef.get(
        `${this.baseUrl}${path}`,
        {
          headers,
          params: {
            createdAtFrom: fromDate.toISOString(),
            createdAtTo: toDate.toISOString(),
            status: 'ACCEPT',
            maxPerPage: 50,
          },
          timeout: 30000,
        },
      );

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((order: any) => this.mapOrder(order));
    } catch (error) {
      this.logger.error(`쿠팡 주문 조회 실패: ${error.message}`);
      throw new Error(`쿠팡 주문 조회 실패: ${error.message}`);
    }
  }

  private mapOrder(order: any): ChannelOrderResult {
    return {
      platformOrderId: String(order.shipmentBoxId || order.orderId),
      platformOrderNo: String(order.orderId),
      orderDate: new Date(order.orderedAt || order.createdAt),
      customerName: order.receiver?.name,
      customerPhone: order.receiver?.safeNumber || order.receiver?.phone,
      shippingAddress: [
        order.receiver?.addr1,
        order.receiver?.addr2,
      ]
        .filter(Boolean)
        .join(' '),
      shippingZipCode: order.receiver?.postCode,
      shippingMethod: order.deliveryCompanyName,
      totalAmount: order.orderItems?.reduce(
        (sum: number, item: any) => sum + (item.orderPrice || 0),
        0,
      ),
      currency: 'KRW',
      items: (order.orderItems || []).map((item: any) => ({
        platformItemId: String(item.sellerProductItemId || ''),
        platformSku: item.externalVendorSkuCode || item.sellerProductItemId?.toString(),
        itemName: item.sellerProductName || item.productName || '',
        quantity: item.shippingCount || 1,
        unitPrice: item.orderPrice,
      })),
      rawData: order,
    };
  }

  async confirmShipment(
    credentials: ChannelCredentials,
    shipment: ShipmentInfo,
  ): Promise<boolean> {
    try {
      const path = `/v2/providers/openapi/apis/api/v4/vendors/${credentials.vendorId}/ordersheets/${shipment.platformOrderId}/invoices`;
      const headers = this.getHeaders('PUT', path, credentials);

      const { data } = await this.httpService.axiosRef.put(
        `${this.baseUrl}${path}`,
        {
          vendorId: credentials.vendorId,
          shipmentBoxId: shipment.platformOrderId,
          deliveryCompanyCode: shipment.carrier,
          invoiceNumber: shipment.trackingNumber,
        },
        { headers, timeout: 10000 },
      );

      const success = data.code === '200' || data.code === 200;
      this.logger.log(
        `쿠팡 배송확인 ${success ? '성공' : '실패'}: orderId=${shipment.platformOrderId}`,
      );
      return success;
    } catch (error) {
      this.logger.error(`쿠팡 배송확인 실패: ${error.message}`);
      return false;
    }
  }

  async updateInventory(
    credentials: ChannelCredentials,
    items: InventoryUpdateInfo[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const path = `/v2/providers/seller_api/apis/api/v1/vendor/products/inventories`;
        const headers = this.getHeaders('PUT', path, credentials);

        await this.httpService.axiosRef.put(
          `${this.baseUrl}${path}`,
          {
            sellerProductItemId: item.platformSku,
            quantity: item.quantity,
          },
          { headers, timeout: 10000 },
        );

        success++;
      } catch (error) {
        this.logger.warn(
          `쿠팡 재고 업데이트 실패 (SKU: ${item.platformSku}): ${error.message}`,
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
      const path = `/v2/providers/seller_api/apis/api/v1/vendor/products`;
      const headers = this.getHeaders('GET', path, credentials);

      const { data } = await this.httpService.axiosRef.get(
        `${this.baseUrl}${path}`,
        {
          headers,
          params: {
            vendorId: credentials.vendorId,
            nextToken: page > 1 ? String(page) : undefined,
            maxPerPage: limit,
          },
          timeout: 30000,
        },
      );

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((product: any) => ({
        platformProductId: String(product.sellerProductId),
        platformSku: product.externalVendorSku || String(product.sellerProductId),
        name: product.sellerProductName || '',
        price: product.salePrice,
        quantity: product.maximumBuyCount,
      }));
    } catch (error) {
      this.logger.error(`쿠팡 상품 조회 실패: ${error.message}`);
      throw new Error(`쿠팡 상품 조회 실패: ${error.message}`);
    }
  }
}
