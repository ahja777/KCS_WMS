import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
export declare class VehicleService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: PaginationDto): Promise<PaginatedResult<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string | null;
        plateNo: string;
        tonnage: number;
        driverName: string | null;
        driverPhone: string | null;
    }>>;
    findById(id: string): Promise<{
        warehouse: {
            id: string;
            name: string;
            code: string;
        } | null;
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string | null;
        plateNo: string;
        tonnage: number;
        driverName: string | null;
        driverPhone: string | null;
    }>;
    create(dto: CreateVehicleDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string | null;
        plateNo: string;
        tonnage: number;
        driverName: string | null;
        driverPhone: string | null;
    }>;
    update(id: string, dto: UpdateVehicleDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string | null;
        plateNo: string;
        tonnage: number;
        driverName: string | null;
        driverPhone: string | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        warehouseId: string | null;
        plateNo: string;
        tonnage: number;
        driverName: string | null;
        driverPhone: string | null;
    }>;
}
