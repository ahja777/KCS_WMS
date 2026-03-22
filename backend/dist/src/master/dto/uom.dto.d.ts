export declare class CreateUomMasterDto {
    code: string;
    name: string;
}
declare const UpdateUomMasterDto_base: import("@nestjs/common").Type<Partial<CreateUomMasterDto>>;
export declare class UpdateUomMasterDto extends UpdateUomMasterDto_base {
}
export declare class CreateUomConversionDto {
    itemId?: string;
    toUomId: string;
    convQty: number;
    startDate?: Date;
    endDate?: Date;
}
export {};
