import { ItemGroupService } from './item-group.service';
import { CreateItemGroupDto, UpdateItemGroupDto } from './dto/item-group.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class ItemGroupController {
    private readonly itemGroupService;
    constructor(itemGroupService: ItemGroupService);
    findAll(query: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
        _count: {
            items: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        inboundZone: string | null;
        groupType: string | null;
    }>>;
    findOne(id: string): Promise<{
        items: {
            id: string;
            name: string;
            code: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        inboundZone: string | null;
        groupType: string | null;
    }>;
    create(dto: CreateItemGroupDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        inboundZone: string | null;
        groupType: string | null;
    }>;
    update(id: string, dto: UpdateItemGroupDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        inboundZone: string | null;
        groupType: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        inboundZone: string | null;
        groupType: string | null;
    }>;
}
