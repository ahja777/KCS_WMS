export declare class CreateOutboundOrderItemDto {
    itemId: string;
    orderedQty: number;
    notes?: string;
}
export declare class CreateOutboundOrderDto {
    orderNumber: string;
    partnerId: string;
    warehouseId: string;
    shipDate?: string;
    shippingMethod?: string;
    notes?: string;
    items: CreateOutboundOrderItemDto[];
}
export declare class UpdateOutboundOrderDto {
    shipDate?: string;
    shippingMethod?: string;
    notes?: string;
}
export declare class PickItemDto {
    outboundOrderItemId: string;
    pickedQty: number;
}
export declare class PickOutboundDto {
    pickedBy: string;
    items: PickItemDto[];
}
export declare class ShipOutboundDto {
    shippedBy: string;
    carrier?: string;
    trackingNumber?: string;
    weight?: number;
    notes?: string;
}
