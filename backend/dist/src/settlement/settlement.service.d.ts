import { PrismaService } from '../prisma/prisma.service';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class SettlementService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto & {
        status?: string;
        partnerId?: string;
        warehouseId?: string;
    }): Promise<PaginatedResult<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SettlementStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        partnerId: string | null;
        totalAmount: number;
        inboundFee: number;
        outboundFee: number;
        storageFee: number;
        periodStart: Date;
        periodEnd: Date;
        handlingFee: number;
    }>>;
    findById(id: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        };
        details: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            itemCode: string | null;
            itemName: string | null;
            stockQty: number;
            workDate: Date;
            inboundQty: number;
            outboundQty: number;
            inboundFee: number;
            outboundFee: number;
            storageFee: number;
            settlementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SettlementStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        partnerId: string | null;
        totalAmount: number;
        inboundFee: number;
        outboundFee: number;
        storageFee: number;
        periodStart: Date;
        periodEnd: Date;
        handlingFee: number;
    }>;
    create(dto: CreateSettlementDto): Promise<{
        details: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            itemCode: string | null;
            itemName: string | null;
            stockQty: number;
            workDate: Date;
            inboundQty: number;
            outboundQty: number;
            inboundFee: number;
            outboundFee: number;
            storageFee: number;
            settlementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SettlementStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        partnerId: string | null;
        totalAmount: number;
        inboundFee: number;
        outboundFee: number;
        storageFee: number;
        periodStart: Date;
        periodEnd: Date;
        handlingFee: number;
    }>;
    update(id: string, dto: UpdateSettlementDto): Promise<{
        details: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            itemCode: string | null;
            itemName: string | null;
            stockQty: number;
            workDate: Date;
            inboundQty: number;
            outboundQty: number;
            inboundFee: number;
            outboundFee: number;
            storageFee: number;
            settlementId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SettlementStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        partnerId: string | null;
        totalAmount: number;
        inboundFee: number;
        outboundFee: number;
        storageFee: number;
        periodStart: Date;
        periodEnd: Date;
        handlingFee: number;
    }>;
    confirm(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SettlementStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        partnerId: string | null;
        totalAmount: number;
        inboundFee: number;
        outboundFee: number;
        storageFee: number;
        periodStart: Date;
        periodEnd: Date;
        handlingFee: number;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.SettlementStatus;
        notes: string | null;
        warehouseId: string;
        createdBy: string | null;
        partnerId: string | null;
        totalAmount: number;
        inboundFee: number;
        outboundFee: number;
        storageFee: number;
        periodStart: Date;
        periodEnd: Date;
        handlingFee: number;
    }>;
}
