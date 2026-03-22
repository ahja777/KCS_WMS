export declare enum PartnerType {
    SUPPLIER = "SUPPLIER",
    CUSTOMER = "CUSTOMER",
    CARRIER = "CARRIER"
}
export declare class CreatePartnerDto {
    code: string;
    name: string;
    type: PartnerType;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    country?: string;
    city?: string;
    address?: string;
    notes?: string;
    isActive?: boolean;
}
declare const UpdatePartnerDto_base: import("@nestjs/common").Type<Partial<CreatePartnerDto>>;
export declare class UpdatePartnerDto extends UpdatePartnerDto_base {
}
export {};
