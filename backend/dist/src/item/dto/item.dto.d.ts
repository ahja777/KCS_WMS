export declare enum ItemCategory {
    GENERAL = "GENERAL",
    ELECTRONICS = "ELECTRONICS",
    CLOTHING = "CLOTHING",
    FOOD = "FOOD",
    FRAGILE = "FRAGILE",
    HAZARDOUS = "HAZARDOUS",
    OVERSIZED = "OVERSIZED"
}
export declare enum UnitOfMeasure {
    EA = "EA",
    BOX = "BOX",
    PALLET = "PALLET",
    CASE = "CASE",
    KG = "KG",
    LB = "LB"
}
export declare class CreateItemDto {
    code: string;
    name: string;
    description?: string;
    barcode?: string;
    category?: ItemCategory;
    uom?: UnitOfMeasure;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    minStock?: number;
    maxStock?: number;
    imageUrl?: string;
    isActive?: boolean;
    unitPrice?: number;
    storageType?: string;
    inboundZone?: string;
    lotControl?: boolean;
    expiryControl?: boolean;
    expiryDays?: number;
}
declare const UpdateItemDto_base: import("@nestjs/common").Type<Partial<CreateItemDto>>;
export declare class UpdateItemDto extends UpdateItemDto_base {
}
export {};
