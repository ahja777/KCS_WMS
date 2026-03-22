export declare class CreateDockDto {
    warehouseId: string;
    code: string;
    name: string;
    sortOrder?: number;
    maxTonnage?: number;
    vehiclePlate?: string;
    notes?: string;
}
declare const UpdateDockDto_base: import("@nestjs/common").Type<Partial<CreateDockDto>>;
export declare class UpdateDockDto extends UpdateDockDto_base {
}
export {};
