export declare enum WarehouseStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE"
}
export declare class CreateWarehouseDto {
    code: string;
    name: string;
    country: string;
    city: string;
    address: string;
    zipCode?: string;
    timezone?: string;
    status?: WarehouseStatus;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    notes?: string;
}
declare const UpdateWarehouseDto_base: import("@nestjs/common").Type<Partial<CreateWarehouseDto>>;
export declare class UpdateWarehouseDto extends UpdateWarehouseDto_base {
}
export declare enum ZoneType {
    RECEIVING = "RECEIVING",
    STORAGE = "STORAGE",
    PICKING = "PICKING",
    PACKING = "PACKING",
    SHIPPING = "SHIPPING",
    QUARANTINE = "QUARANTINE",
    RETURN = "RETURN"
}
export declare class CreateZoneDto {
    code: string;
    name: string;
    type?: ZoneType;
    description?: string;
}
declare const UpdateZoneDto_base: import("@nestjs/common").Type<Partial<CreateZoneDto>>;
export declare class UpdateZoneDto extends UpdateZoneDto_base {
}
export declare enum LocationStatus {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED",
    RESERVED = "RESERVED",
    BLOCKED = "BLOCKED"
}
export declare class CreateLocationDto {
    code: string;
    aisle: string;
    rack: string;
    level: string;
    bin: string;
    status?: LocationStatus;
    maxWeight?: number;
    maxVolume?: number;
}
declare const UpdateLocationDto_base: import("@nestjs/common").Type<Partial<CreateLocationDto>>;
export declare class UpdateLocationDto extends UpdateLocationDto_base {
}
export {};
