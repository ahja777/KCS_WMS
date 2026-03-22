import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
export declare class VehicleController {
    private readonly vehicleService;
    constructor(vehicleService: VehicleService);
    findAll(query: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<{
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
    findOne(id: string): Promise<{
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
    remove(id: string): Promise<{
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
