import { PrismaService } from '../prisma/prisma.service';
import { StockAdjustmentDto, CreateCycleCountDto, CompleteCycleCountDto, InventoryQueryDto, TransactionQueryDto, TransferDto } from './dto/inventory.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getCurrentStock(query: InventoryQueryDto): Promise<PaginatedResult<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
        location: {
            id: string;
            code: string;
        } | null;
        item: {
            id: string;
            name: string;
            code: string;
            category: import(".prisma/client").$Enums.ItemCategory;
            uom: import(".prisma/client").$Enums.UnitOfMeasure;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        lotNo: string | null;
        expiryDate: Date | null;
        itemId: string;
        quantity: number;
        reservedQty: number;
        availableQty: number;
        inboundDate: Date | null;
        locationId: string | null;
    }>>;
    getStockByItem(itemId: string): Promise<({
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
        location: {
            id: string;
            code: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string;
        lotNo: string | null;
        expiryDate: Date | null;
        itemId: string;
        quantity: number;
        reservedQty: number;
        availableQty: number;
        inboundDate: Date | null;
        locationId: string | null;
    })[]>;
    getStockSummary(warehouseId: string): Promise<{
        item: {
            id: string;
            name: string;
            code: string;
            uom: import(".prisma/client").$Enums.UnitOfMeasure;
            minStock: number;
        } | undefined;
        totalQty: number;
        reservedQty: number;
        availableQty: number;
        belowMinStock: boolean;
    }[]>;
    createAdjustment(dto: StockAdjustmentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        warehouseId: string;
        lotNo: string | null;
        locationCode: string | null;
        performedBy: string;
        itemCode: string;
        adjustQty: number;
        reason: import(".prisma/client").$Enums.AdjustmentReason;
        approvedBy: string | null;
    }>;
    getAdjustments(warehouseId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        warehouseId: string;
        lotNo: string | null;
        locationCode: string | null;
        performedBy: string;
        itemCode: string;
        adjustQty: number;
        reason: import(".prisma/client").$Enums.AdjustmentReason;
        approvedBy: string | null;
    }[]>;
    createCycleCount(dto: CreateCycleCountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CycleCountStatus;
        notes: string | null;
        warehouseId: string;
        locationCode: string | null;
        itemCode: string | null;
        systemQty: number;
        countedQty: number | null;
        countedBy: string | null;
        variance: number | null;
        countedDate: Date | null;
    }>;
    getCycleCounts(warehouseId?: string, status?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CycleCountStatus;
        notes: string | null;
        warehouseId: string;
        locationCode: string | null;
        itemCode: string | null;
        systemQty: number;
        countedQty: number | null;
        countedBy: string | null;
        variance: number | null;
        countedDate: Date | null;
    }[]>;
    completeCycleCount(id: string, dto: CompleteCycleCountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.CycleCountStatus;
        notes: string | null;
        warehouseId: string;
        locationCode: string | null;
        itemCode: string | null;
        systemQty: number;
        countedQty: number | null;
        countedBy: string | null;
        variance: number | null;
        countedDate: Date | null;
    }>;
    transferStock(dto: TransferDto): Promise<{
        success: boolean;
        itemCode: string;
        fromLocationCode: string;
        toLocationCode: string;
        quantity: number;
        lotNo: string | null;
    }>;
    getTransactions(query: TransactionQueryDto): Promise<PaginatedResult<{
        item: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        warehouseId: string;
        lotNo: string | null;
        itemId: string;
        locationCode: string | null;
        quantity: number;
        referenceId: string | null;
        txType: import(".prisma/client").$Enums.TransactionType;
        referenceType: string | null;
        performedBy: string | null;
    }>>;
}
