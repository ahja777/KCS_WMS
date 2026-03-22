import { ChannelPlatform } from '@prisma/client';
export declare class CreateChannelDto {
    name: string;
    platform: ChannelPlatform;
    sellerId?: string;
    warehouseId: string;
    credentials: Record<string, string>;
    syncEnabled?: boolean;
    syncInterval?: number;
    notes?: string;
}
export declare class UpdateChannelDto {
    name?: string;
    sellerId?: string;
    credentials?: Record<string, string>;
    syncEnabled?: boolean;
    syncInterval?: number;
    notes?: string;
}
export declare class LinkProductDto {
    channelId: string;
    itemId: string;
    platformProductId?: string;
    platformSku?: string;
}
export declare class SyncOrdersDto {
    fromDate?: string;
    toDate?: string;
}
export declare class ConfirmShipmentDto {
    channelOrderId: string;
    carrier: string;
    trackingNumber: string;
}
