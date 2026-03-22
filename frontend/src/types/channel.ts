// ===== 외부 채널 연동 타입 =====

export type ChannelPlatform =
  | 'COUPANG'
  | 'NAVER'
  | 'AMAZON'
  | 'SHOPIFY'
  | 'EBAY'
  | 'RAKUTEN'
  | 'LAZADA'
  | 'SHOPEE'
  | 'ELEVENTH_ST';

export type ChannelStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING';

export type ChannelOrderStatus =
  | 'NEW'
  | 'SYNCED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'ERROR';

export type SyncType =
  | 'ORDER_PULL'
  | 'INVENTORY_PUSH'
  | 'PRODUCT_SYNC'
  | 'SHIPMENT_PUSH'
  | 'RETURN_PULL';

export interface SalesChannel {
  id: string;
  name: string;
  platform: ChannelPlatform;
  sellerId?: string;
  warehouseId: string;
  warehouse?: { id: string; name: string };
  status: ChannelStatus;
  credentials: Record<string, string>;
  syncEnabled: boolean;
  syncInterval: number;
  lastSyncAt?: string;
  lastSyncError?: string;
  notes?: string;
  _count?: {
    channelOrders: number;
    channelProducts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChannelOrder {
  id: string;
  channelId: string;
  channel?: SalesChannel;
  platformOrderId: string;
  platformOrderNo?: string;
  status: ChannelOrderStatus;
  orderDate: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingZipCode?: string;
  shippingMethod?: string;
  totalAmount?: number;
  currency?: string;
  outboundOrderId?: string;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  items: ChannelOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChannelOrderItem {
  id: string;
  channelOrderId: string;
  platformItemId?: string;
  platformSku?: string;
  itemName: string;
  quantity: number;
  unitPrice?: number;
  itemId?: string;
  item?: { id: string; code: string; name: string };
}

export interface ChannelProduct {
  id: string;
  channelId: string;
  itemId: string;
  item?: { id: string; code: string; name: string };
  platformProductId?: string;
  platformSku?: string;
  isLinked: boolean;
  lastSyncAt?: string;
  createdAt: string;
}

export interface ChannelSyncLog {
  id: string;
  channelId: string;
  syncType: SyncType;
  direction: string;
  status: string;
  recordCount: number;
  errorCount: number;
  errorDetail?: string;
  startedAt: string;
  completedAt?: string;
}

export const PLATFORM_LABELS: Record<ChannelPlatform, string> = {
  COUPANG: '쿠팡',
  NAVER: '네이버 스마트스토어',
  AMAZON: '아마존',
  SHOPIFY: 'Shopify',
  EBAY: 'eBay',
  RAKUTEN: '라쿠텐',
  LAZADA: 'Lazada',
  SHOPEE: 'Shopee',
  ELEVENTH_ST: '11번가',
};

export const PLATFORM_COLORS: Record<ChannelPlatform, string> = {
  COUPANG: '#C73E3A',
  NAVER: '#03C75A',
  AMAZON: '#FF9900',
  SHOPIFY: '#96BF48',
  EBAY: '#E53238',
  RAKUTEN: '#BF0000',
  LAZADA: '#0F146D',
  SHOPEE: '#EE4D2D',
  ELEVENTH_ST: '#FF0038',
};

export const CHANNEL_ORDER_STATUS_LABELS: Record<ChannelOrderStatus, string> = {
  NEW: '신규',
  SYNCED: '동기화됨',
  PROCESSING: '처리중',
  SHIPPED: '출하완료',
  DELIVERED: '배송완료',
  CANCELLED: '취소',
  RETURN_REQUESTED: '반품요청',
  RETURNED: '반품완료',
  ERROR: '오류',
};

export const CREDENTIAL_FIELDS: Record<
  string,
  { key: string; label: string; type?: string }[]
> = {
  COUPANG: [
    { key: 'vendorId', label: 'Vendor ID' },
    { key: 'accessKey', label: 'Access Key' },
    { key: 'secretKey', label: 'Secret Key', type: 'password' },
  ],
  NAVER: [
    { key: 'clientId', label: 'Client ID' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password' },
  ],
  AMAZON: [
    { key: 'clientId', label: 'Client ID (LWA)' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    { key: 'refreshToken', label: 'Refresh Token', type: 'password' },
    { key: 'accessKeyId', label: 'AWS Access Key ID' },
    { key: 'secretAccessKey', label: 'AWS Secret Access Key', type: 'password' },
    { key: 'region', label: 'Region (na/eu/fe)' },
    { key: 'marketplaceId', label: 'Marketplace ID' },
    { key: 'sellerId', label: 'Seller ID' },
  ],
  SHOPIFY: [
    { key: 'shopDomain', label: 'Shop Domain' },
    { key: 'accessToken', label: 'Access Token', type: 'password' },
  ],
  EBAY: [
    { key: 'clientId', label: 'Client ID' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    { key: 'refreshToken', label: 'Refresh Token', type: 'password' },
  ],
  RAKUTEN: [
    { key: 'serviceSecret', label: 'Service Secret', type: 'password' },
    { key: 'licenseKey', label: 'License Key', type: 'password' },
  ],
  LAZADA: [
    { key: 'appKey', label: 'App Key' },
    { key: 'appSecret', label: 'App Secret', type: 'password' },
    { key: 'accessToken', label: 'Access Token', type: 'password' },
  ],
  SHOPEE: [
    { key: 'partnerId', label: 'Partner ID' },
    { key: 'partnerKey', label: 'Partner Key', type: 'password' },
    { key: 'shopId', label: 'Shop ID' },
    { key: 'accessToken', label: 'Access Token', type: 'password' },
  ],
  ELEVENTH_ST: [
    { key: 'openapikey', label: 'OpenAPI Key', type: 'password' },
  ],
};
