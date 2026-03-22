import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementDto } from './dto/inventory-movement.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class InventoryMovementService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto & {
        status?: string;
        warehouseId?: string;
    }): Promise<PaginatedResult<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            uom: string | null;
            lotNo: string | null;
            itemCode: string;
            itemName: string;
            fromLocation: string | null;
            toLocation: string | null;
            stockQty: number;
            moveQty: number;
            movementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MovementStatus;
        notes: string | null;
        warehouseId: string;
        performedBy: string | null;
        fromWarehouseId: string | null;
        toWarehouseId: string | null;
        movementDate: Date;
    }>>;
    findById(id: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            uom: string | null;
            lotNo: string | null;
            itemCode: string;
            itemName: string;
            fromLocation: string | null;
            toLocation: string | null;
            stockQty: number;
            moveQty: number;
            movementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MovementStatus;
        notes: string | null;
        warehouseId: string;
        performedBy: string | null;
        fromWarehouseId: string | null;
        toWarehouseId: string | null;
        movementDate: Date;
    }>;
    create(dto: CreateInventoryMovementDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            uom: string | null;
            lotNo: string | null;
            itemCode: string;
            itemName: string;
            fromLocation: string | null;
            toLocation: string | null;
            stockQty: number;
            moveQty: number;
            movementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MovementStatus;
        notes: string | null;
        warehouseId: string;
        performedBy: string | null;
        fromWarehouseId: string | null;
        toWarehouseId: string | null;
        movementDate: Date;
    }>;
    start(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MovementStatus;
        notes: string | null;
        warehouseId: string;
        performedBy: string | null;
        fromWarehouseId: string | null;
        toWarehouseId: string | null;
        movementDate: Date;
    }>;
    complete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MovementStatus;
        notes: string | null;
        warehouseId: string;
        performedBy: string | null;
        fromWarehouseId: string | null;
        toWarehouseId: string | null;
        movementDate: Date;
    }>;
}
