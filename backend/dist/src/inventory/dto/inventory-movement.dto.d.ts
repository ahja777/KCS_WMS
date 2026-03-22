export declare class MovementItemDto {
    itemCode: string;
    itemName: string;
    fromLocation?: string;
    toLocation?: string;
    lotNo?: string;
    stockQty?: number;
    moveQty: number;
    uom?: string;
}
export declare class CreateInventoryMovementDto {
    warehouseId: string;
    fromWarehouseId?: string;
    toWarehouseId?: string;
    notes?: string;
    performedBy?: string;
    items: MovementItemDto[];
}
