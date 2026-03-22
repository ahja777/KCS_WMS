import { PaginationDto } from '../../common/dto/pagination.dto';
export declare enum AdjustmentReason {
    DAMAGE = "DAMAGE",
    EXPIRY = "EXPIRY",
    LOST = "LOST",
    FOUND = "FOUND",
    CORRECTION = "CORRECTION",
    OTHER = "OTHER"
}
export declare class StockAdjustmentDto {
    warehouseId: string;
    itemCode: string;
    locationCode?: string;
    lotNo?: string;
    adjustQty: number;
    reason: AdjustmentReason;
    notes?: string;
    performedBy: string;
}
export declare class CreateCycleCountDto {
    warehouseId: string;
    locationCode?: string;
    itemCode?: string;
    systemQty: number;
}
export declare class CompleteCycleCountDto {
    countedQty: number;
    countedBy: string;
    notes?: string;
}
export declare class InventoryQueryDto extends PaginationDto {
    warehouseId?: string;
    itemCode?: string;
}
export declare class TransferDto {
    warehouseId: string;
    itemCode: string;
    fromLocationCode: string;
    toLocationCode: string;
    quantity: number;
    lotNo?: string;
    performedBy: string;
    notes?: string;
}
export declare class TransactionQueryDto extends PaginationDto {
    warehouseId?: string;
    itemId?: string;
    txType?: string;
    startDate?: string;
    endDate?: string;
}
