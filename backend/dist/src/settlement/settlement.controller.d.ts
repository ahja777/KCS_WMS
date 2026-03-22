import { SettlementService } from './settlement.service';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class SettlementController {
    private readonly settlementService;
    constructor(settlementService: SettlementService);
    findAll(query: PaginationDto, status?: string, partnerId?: string, warehouseId?: string): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
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
    findOne(id: string): Promise<{
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
    remove(id: string): Promise<{
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
