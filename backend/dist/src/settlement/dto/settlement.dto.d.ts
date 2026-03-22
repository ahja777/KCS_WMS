export declare class SettlementDetailDto {
    workDate: string;
    itemCode?: string;
    itemName?: string;
    inboundQty?: number;
    outboundQty?: number;
    stockQty?: number;
    inboundFee?: number;
    outboundFee?: number;
    storageFee?: number;
}
export declare class CreateSettlementDto {
    warehouseId: string;
    partnerId?: string;
    periodStart: string;
    periodEnd: string;
    inboundFee?: number;
    outboundFee?: number;
    storageFee?: number;
    handlingFee?: number;
    totalAmount?: number;
    notes?: string;
    createdBy?: string;
    details?: SettlementDetailDto[];
}
declare const UpdateSettlementDto_base: import("@nestjs/common").Type<Partial<CreateSettlementDto>>;
export declare class UpdateSettlementDto extends UpdateSettlementDto_base {
}
export {};
