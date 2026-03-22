import { PrismaService } from '../prisma/prisma.service';
import { CreateDispatchDto, UpdateDispatchDto } from './dto/dispatch.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class DispatchService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto & {
        status?: string;
        warehouseId?: string;
        date?: string;
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
            notes: string | null;
            orderedQty: number;
            itemCode: string;
            itemName: string;
            dispatchedQty: number;
            dispatchId: string;
        }[];
        vehicle: {
            id: string;
            plateNo: string;
            driverName: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DispatchStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        inboundOrderId: string | null;
        outboundOrderId: string | null;
        vehicleId: string | null;
        dispatchDate: Date;
        dispatchSeq: number;
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
            notes: string | null;
            orderedQty: number;
            itemCode: string;
            itemName: string;
            dispatchedQty: number;
            dispatchId: string;
        }[];
        inboundOrder: {
            id: string;
            status: import(".prisma/client").$Enums.InboundStatus;
            orderNumber: string;
        } | null;
        vehicle: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            warehouseId: string | null;
            plateNo: string;
            tonnage: number;
            driverName: string | null;
            driverPhone: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DispatchStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        inboundOrderId: string | null;
        outboundOrderId: string | null;
        vehicleId: string | null;
        dispatchDate: Date;
        dispatchSeq: number;
    }>;
    create(dto: CreateDispatchDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            orderedQty: number;
            itemCode: string;
            itemName: string;
            dispatchedQty: number;
            dispatchId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DispatchStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        inboundOrderId: string | null;
        outboundOrderId: string | null;
        vehicleId: string | null;
        dispatchDate: Date;
        dispatchSeq: number;
    }>;
    update(id: string, dto: UpdateDispatchDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            orderedQty: number;
            itemCode: string;
            itemName: string;
            dispatchedQty: number;
            dispatchId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DispatchStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        inboundOrderId: string | null;
        outboundOrderId: string | null;
        vehicleId: string | null;
        dispatchDate: Date;
        dispatchSeq: number;
    }>;
    start(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DispatchStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        inboundOrderId: string | null;
        outboundOrderId: string | null;
        vehicleId: string | null;
        dispatchDate: Date;
        dispatchSeq: number;
    }>;
    complete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DispatchStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        inboundOrderId: string | null;
        outboundOrderId: string | null;
        vehicleId: string | null;
        dispatchDate: Date;
        dispatchSeq: number;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.DispatchStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        inboundOrderId: string | null;
        outboundOrderId: string | null;
        vehicleId: string | null;
        dispatchDate: Date;
        dispatchSeq: number;
    }>;
}
