export declare class DispatchItemDto {
    itemCode: string;
    itemName: string;
    orderedQty: number;
    dispatchedQty?: number;
    notes?: string;
}
export declare class CreateDispatchDto {
    warehouseId: string;
    vehicleId?: string;
    inboundOrderId?: string;
    outboundOrderId?: string;
    dispatchDate: string;
    dispatchSeq?: number;
    notes?: string;
    createdBy?: string;
    items?: DispatchItemDto[];
}
declare const UpdateDispatchDto_base: import("@nestjs/common").Type<Partial<CreateDispatchDto>>;
export declare class UpdateDispatchDto extends UpdateDispatchDto_base {
}
export {};
