import { UomService } from './uom.service';
import { CreateUomMasterDto, UpdateUomMasterDto, CreateUomConversionDto } from './dto/uom.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class UomController {
    private readonly uomService;
    constructor(uomService: UomService);
    findAll(query: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>>;
    findOne(id: string): Promise<{
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
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
    }>;
    findConversions(id: string): Promise<({
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
    createConversion(id: string, dto: CreateUomConversionDto): Promise<{
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
