/**
 * 외부 이커머스 채널 어댑터 인터페이스
 * 모든 플랫폼(쿠팡, 네이버, 아마존 등) 어댑터는 이 인터페이스를 구현해야 합니다.
 */

export interface ChannelCredentials {
  [key: string]: string;
}

export interface ChannelOrderResult {
  platformOrderId: string;
  platformOrderNo?: string;
  orderDate: Date;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingZipCode?: string;
  shippingMethod?: string;
  totalAmount?: number;
  currency?: string;
  items: ChannelOrderItemResult[];
  rawData?: any;
}

export interface ChannelOrderItemResult {
  platformItemId?: string;
  platformSku?: string;
  itemName: string;
  quantity: number;
  unitPrice?: number;
}

export interface ShipmentInfo {
  platformOrderId: string;
  carrier: string;
  trackingNumber: string;
}

export interface InventoryUpdateInfo {
  platformSku: string;
  quantity: number;
}

export interface ChannelProductInfo {
  platformProductId: string;
  platformSku: string;
  name: string;
  price?: number;
  quantity?: number;
}

export interface IChannelAdapter {
  /**
   * 인증 테스트
   */
  testConnection(credentials: ChannelCredentials): Promise<boolean>;

  /**
   * 신규 주문 조회
   */
  fetchOrders(
    credentials: ChannelCredentials,
    fromDate: Date,
    toDate: Date,
  ): Promise<ChannelOrderResult[]>;

  /**
   * 배송 정보 전송
   */
  confirmShipment(
    credentials: ChannelCredentials,
    shipment: ShipmentInfo,
  ): Promise<boolean>;

  /**
   * 재고 수량 업데이트
   */
  updateInventory(
    credentials: ChannelCredentials,
    items: InventoryUpdateInfo[],
  ): Promise<{ success: number; failed: number }>;

  /**
   * 상품 목록 조회
   */
  fetchProducts(
    credentials: ChannelCredentials,
    page?: number,
    limit?: number,
  ): Promise<ChannelProductInfo[]>;
}
