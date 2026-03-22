import { PrismaService } from '../prisma/prisma.service';
import { CreateItemGroupDto, UpdateItemGroupDto } from './dto/item-group.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class ItemGroupService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto): Promise<PaginatedResult<{
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
    findById(id: string): Promise<{
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
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        inboundZone: string | null;
        groupType: string | null;
    }>;
}
