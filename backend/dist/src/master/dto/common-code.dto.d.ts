export declare class CreateCommonCodeDto {
    codeType: string;
    typeNm: string;
    code: string;
    codeNm: string;
    value?: string;
    sortOrder?: number;
    isActive?: boolean;
}
declare const UpdateCommonCodeDto_base: import("@nestjs/common").Type<Partial<CreateCommonCodeDto>>;
export declare class UpdateCommonCodeDto extends UpdateCommonCodeDto_base {
}
export {};
