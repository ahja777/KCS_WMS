import { CommonCodeService } from './common-code.service';
import { CreateCommonCodeDto, UpdateCommonCodeDto } from './dto/common-code.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class CommonCodeController {
    private readonly commonCodeService;
    constructor(commonCodeService: CommonCodeService);
    findAll(query: PaginationDto, groupCode?: string): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        codeType: string;
        typeNm: string;
        codeNm: string;
        value: string | null;
        sortOrder: number;
    }>>;
    findOne(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        codeType: string;
        typeNm: string;
        codeNm: string;
        value: string | null;
        sortOrder: number;
    }>;
    create(dto: CreateCommonCodeDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        codeType: string;
        typeNm: string;
        codeNm: string;
        value: string | null;
        sortOrder: number;
    }>;
    update(id: string, dto: UpdateCommonCodeDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        codeType: string;
        typeNm: string;
        codeNm: string;
        value: string | null;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        codeType: string;
        typeNm: string;
        codeNm: string;
        value: string | null;
        sortOrder: number;
    }>;
}
