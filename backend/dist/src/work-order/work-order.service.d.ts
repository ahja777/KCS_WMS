import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/work-order.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class WorkOrderService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto & {
        type?: string;
        status?: string;
        warehouseId?: string;
    }): Promise<PaginatedResult<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lotNo: string | null;
            itemCode: string;
            itemName: string;
            fromLocation: string | null;
            toLocation: string | null;
            plannedQty: number;
            actualQty: number;
            workOrderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        referenceId: string | null;
        referenceType: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        workType: import(".prisma/client").$Enums.WorkOrderType;
        assignedTo: string | null;
    }>>;
    findById(id: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lotNo: string | null;
            itemCode: string;
            itemName: string;
            fromLocation: string | null;
            toLocation: string | null;
            plannedQty: number;
            actualQty: number;
            workOrderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        referenceId: string | null;
        referenceType: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        workType: import(".prisma/client").$Enums.WorkOrderType;
        assignedTo: string | null;
    }>;
    create(dto: CreateWorkOrderDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lotNo: string | null;
            itemCode: string;
            itemName: string;
            fromLocation: string | null;
            toLocation: string | null;
            plannedQty: number;
            actualQty: number;
            workOrderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        referenceId: string | null;
        referenceType: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        workType: import(".prisma/client").$Enums.WorkOrderType;
        assignedTo: string | null;
    }>;
    assign(id: string, assignedTo?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        referenceId: string | null;
        referenceType: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        workType: import(".prisma/client").$Enums.WorkOrderType;
        assignedTo: string | null;
    }>;
    start(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        referenceId: string | null;
        referenceType: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        workType: import(".prisma/client").$Enums.WorkOrderType;
        assignedTo: string | null;
    }>;
    complete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.WorkOrderStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        referenceId: string | null;
        referenceType: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        workType: import(".prisma/client").$Enums.WorkOrderType;
        assignedTo: string | null;
    }>;
}
