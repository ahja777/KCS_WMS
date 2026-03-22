import { HttpService } from '@nestjs/axios';
import { IChannelAdapter, ChannelCredentials, ChannelOrderResult, ShipmentInfo, InventoryUpdateInfo, ChannelProductInfo } from './channel-adapter.interface';
export declare class NaverAdapter implements IChannelAdapter {
    private readonly httpService;
    private readonly logger;
    private readonly baseUrl;
    private readonly tokenUrl;
    constructor(httpService: HttpService);
    private getAccessToken;
    private getHeaders;
    testConnection(credentials: ChannelCredentials): Promise<boolean>;
    fetchOrders(credentials: ChannelCredentials, fromDate: Date, toDate: Date): Promise<ChannelOrderResult[]>;
    private mapOrder;
    private groupOrdersByOrderNo;
    confirmShipment(credentials: ChannelCredentials, shipment: ShipmentInfo): Promise<boolean>;
    updateInventory(credentials: ChannelCredentials, items: InventoryUpdateInfo[]): Promise<{
        success: number;
        failed: number;
    }>;
    fetchProducts(credentials: ChannelCredentials, page?: number, limit?: number): Promise<ChannelProductInfo[]>;
    private chunkArray;
}
