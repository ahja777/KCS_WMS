import { PrismaService } from '../prisma/prisma.service';
import { CreateDockDto, UpdateDockDto } from './dto/dock.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class DockService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto & {
        warehouseId?: string;
    }): Promise<PaginatedResult<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        notes: string | null;
        warehouseId: string;
        sortOrder: number;
        maxTonnage: number | null;
        vehiclePlate: string | null;
    }>>;
    findById(id: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        notes: string | null;
        warehouseId: string;
        sortOrder: number;
        maxTonnage: number | null;
        vehiclePlate: string | null;
    }>;
    create(dto: CreateDockDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        notes: string | null;
        warehouseId: string;
        sortOrder: number;
        maxTonnage: number | null;
        vehiclePlate: string | null;
    }>;
    update(id: string, dto: UpdateDockDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        notes: string | null;
        warehouseId: string;
        sortOrder: number;
        maxTonnage: number | null;
        vehiclePlate: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        notes: string | null;
        warehouseId: string;
        sortOrder: number;
        maxTonnage: number | null;
        vehiclePlate: string | null;
    }>;
}
