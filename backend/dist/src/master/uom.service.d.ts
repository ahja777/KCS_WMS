import { PrismaService } from '../prisma/prisma.service';
import { CreateUomMasterDto, UpdateUomMasterDto, CreateUomConversionDto } from './dto/uom.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class UomService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto): Promise<PaginatedResult<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>>;
    findById(id: string): Promise<{
        conversionsFrom: ({
            item: {
                id: string;
                name: string;
                code: string;
            } | null;
            toUom: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            itemId: string | null;
            convQty: number;
            startDate: Date | null;
            endDate: Date | null;
            fromUomId: string;
            toUomId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    create(dto: CreateUomMasterDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    update(id: string, dto: UpdateUomMasterDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    findConversions(uomId: string): Promise<({
        item: {
            id: string;
            name: string;
            code: string;
        } | null;
        toUom: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        itemId: string | null;
        convQty: number;
        startDate: Date | null;
        endDate: Date | null;
        fromUomId: string;
        toUomId: string;
    })[]>;
    createConversion(uomId: string, dto: CreateUomConversionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        itemId: string | null;
        convQty: number;
        startDate: Date | null;
        endDate: Date | null;
        fromUomId: string;
        toUomId: string;
    }>;
}
