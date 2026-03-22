export declare class CreateVehicleDto {
    plateNo: string;
    tonnage: number;
    driverName?: string;
    driverPhone?: string;
    warehouseId?: string;
    isActive?: boolean;
}
declare const UpdateVehicleDto_base: import("@nestjs/common").Type<Partial<CreateVehicleDto>>;
export declare class UpdateVehicleDto extends UpdateVehicleDto_base {
}
export {};
