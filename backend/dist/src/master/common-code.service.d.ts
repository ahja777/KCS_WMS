import { PrismaService } from '../prisma/prisma.service';
import { CreateCommonCodeDto, UpdateCommonCodeDto } from './dto/common-code.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class CommonCodeService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto & {
        groupCode?: string;
    }): Promise<PaginatedResult<{
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
    findById(id: string): Promise<{
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
    delete(id: string): Promise<{
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
