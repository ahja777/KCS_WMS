export declare enum WorkOrderType {
    RECEIVING = "RECEIVING",
    PUTAWAY = "PUTAWAY",
    PICKING = "PICKING",
    PACKING = "PACKING",
    LOADING = "LOADING",
    MOVEMENT = "MOVEMENT",
    COUNT = "COUNT"
}
export declare class WorkOrderItemDto {
    itemCode: string;
    itemName: string;
    fromLocation?: string;
    toLocation?: string;
    lotNo?: string;
    plannedQty: number;
    actualQty?: number;
}
export declare class CreateWorkOrderDto {
    warehouseId: string;
    workType: WorkOrderType;
    referenceType?: string;
    referenceId?: string;
    assignedTo?: string;
    notes?: string;
    createdBy?: string;
    items?: WorkOrderItemDto[];
}
declare const UpdateWorkOrderDto_base: import("@nestjs/common").Type<Partial<CreateWorkOrderDto>>;
export declare class UpdateWorkOrderDto extends UpdateWorkOrderDto_base {
}
export {};
