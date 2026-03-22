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
    testConnection(credentials: ChannelCredentials): Promise<boolean>;
    fetchOrders(credentials: ChannelCredentials, fromDate: Date, toDate: Date): Promise<ChannelOrderResult[]>;
    confirmShipment(credentials: ChannelCredentials, shipment: ShipmentInfo): Promise<boolean>;
    updateInventory(credentials: ChannelCredentials, items: InventoryUpdateInfo[]): Promise<{
        success: number;
        failed: number;
    }>;
    fetchProducts(credentials: ChannelCredentials, page?: number, limit?: number): Promise<ChannelProductInfo[]>;
}
