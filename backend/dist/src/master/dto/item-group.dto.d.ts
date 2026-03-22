export declare class CreateItemGroupDto {
    code: string;
    name: string;
    groupType?: string;
    inboundZone?: string;
}
declare const UpdateItemGroupDto_base: import("@nestjs/common").Type<Partial<CreateItemGroupDto>>;
export declare class UpdateItemGroupDto extends UpdateItemGroupDto_base {
}
export {};
