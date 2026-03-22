export declare class CreateInboundOrderItemDto {
    itemId: string;
    expectedQty: number;
    notes?: string;
}
export declare class CreateInboundOrderDto {
    orderNumber: string;
    partnerId: string;
    warehouseId: string;
    expectedDate: string;
    notes?: string;
    items: CreateInboundOrderItemDto[];
}
export declare class UpdateInboundOrderDto {
    expectedDate?: string;
    notes?: string;
}
export declare class ReceiveItemDto {
    inboundOrderItemId: string;
    receivedQty: number;
    damagedQty?: number;
    lotNo?: string;
    locationCode?: string;
    notes?: string;
}
export declare class ReceiveInboundDto {
    receivedBy: string;
    items: ReceiveItemDto[];
}
