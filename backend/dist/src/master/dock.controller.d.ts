import { DockService } from './dock.service';
import { CreateDockDto, UpdateDockDto } from './dto/dock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class DockController {
    private readonly dockService;
    constructor(dockService: DockService);
    findAll(query: PaginationDto, warehouseId?: string): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
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
    findOne(id: string): Promise<{
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
    remove(id: string): Promise<{
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
