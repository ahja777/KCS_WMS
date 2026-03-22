"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let WarehouseService = class WarehouseService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllWarehouses(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { code: { contains: query.search } },
                { name: { contains: query.search } },
                { country: { contains: query.search } },
            ];
        }
        const allowedSortFields = ['createdAt', 'code', 'name', 'country', 'status'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.warehouse.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: { _count: { select: { zones: true } } },
            }),
            this.prisma.warehouse.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findWarehouseById(id) {
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id },
            include: {
                zones: { include: { _count: { select: { locations: true } } } },
            },
        });
        if (!warehouse)
            throw new common_1.NotFoundException('창고를 찾을 수 없습니다');
        return warehouse;
    }
    async createWarehouse(dto) {
        const existing = await this.prisma.warehouse.findUnique({
            where: { code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 창고 코드입니다');
        return this.prisma.warehouse.create({ data: dto });
    }
    async updateWarehouse(id, dto) {
        await this.findWarehouseById(id);
        return this.prisma.warehouse.update({ where: { id }, data: dto });
    }
    async deleteWarehouse(id) {
        await this.findWarehouseById(id);
        const inboundCount = await this.prisma.inboundOrder.count({ where: { warehouseId: id } });
        if (inboundCount > 0) {
            throw new common_1.BadRequestException('해당 창고에 연결된 입고 주문이 있어 삭제할 수 없습니다.');
        }
        const outboundCount = await this.prisma.outboundOrder.count({ where: { warehouseId: id } });
        if (outboundCount > 0) {
            throw new common_1.BadRequestException('해당 창고에 연결된 출고 주문이 있어 삭제할 수 없습니다.');
        }
        const inventoryCount = await this.prisma.inventory.count({ where: { warehouseId: id } });
        if (inventoryCount > 0) {
            throw new common_1.BadRequestException('해당 창고에 연결된 재고가 있어 삭제할 수 없습니다.');
        }
        return this.prisma.warehouse.delete({ where: { id } });
    }
    async findZonesByWarehouse(warehouseId) {
        await this.findWarehouseById(warehouseId);
        return this.prisma.zone.findMany({
            where: { warehouseId },
            include: { _count: { select: { locations: true } } },
            orderBy: { code: 'asc' },
        });
    }
    async findZoneById(warehouseId, zoneId) {
        const zone = await this.prisma.zone.findFirst({
            where: { id: zoneId, warehouseId },
            include: { locations: true },
        });
        if (!zone)
            throw new common_1.NotFoundException('구역을 찾을 수 없습니다');
        return zone;
    }
    async createZone(warehouseId, dto) {
        await this.findWarehouseById(warehouseId);
        const existing = await this.prisma.zone.findUnique({
            where: { warehouseId_code: { warehouseId, code: dto.code } },
        });
        if (existing)
            throw new common_1.ConflictException('해당 창고에 이미 존재하는 구역 코드입니다');
        return this.prisma.zone.create({
            data: { ...dto, warehouseId },
        });
    }
    async updateZone(warehouseId, zoneId, dto) {
        await this.findZoneById(warehouseId, zoneId);
        return this.prisma.zone.update({ where: { id: zoneId }, data: dto });
    }
    async deleteZone(warehouseId, zoneId) {
        await this.findZoneById(warehouseId, zoneId);
        return this.prisma.zone.delete({ where: { id: zoneId } });
    }
    async findLocationsByZone(warehouseId, zoneId) {
        await this.findZoneById(warehouseId, zoneId);
        return this.prisma.location.findMany({
            where: { zoneId },
            orderBy: { code: 'asc' },
        });
    }
    async createLocation(warehouseId, zoneId, dto) {
        await this.findZoneById(warehouseId, zoneId);
        const existing = await this.prisma.location.findUnique({
            where: { zoneId_code: { zoneId, code: dto.code } },
        });
        if (existing)
            throw new common_1.ConflictException('해당 구역에 이미 존재하는 로케이션 코드입니다');
        return this.prisma.location.create({
            data: { ...dto, zoneId },
        });
    }
    async updateLocation(warehouseId, zoneId, locationId, dto) {
        const zone = await this.findZoneById(warehouseId, zoneId);
        const location = zone.locations?.find((l) => l.id === locationId);
        if (!location)
            throw new common_1.NotFoundException('로케이션을 찾을 수 없습니다');
        return this.prisma.location.update({ where: { id: locationId }, data: dto });
    }
    async deleteLocation(warehouseId, zoneId, locationId) {
        const zone = await this.findZoneById(warehouseId, zoneId);
        const location = zone.locations?.find((l) => l.id === locationId);
        if (!location)
            throw new common_1.NotFoundException('로케이션을 찾을 수 없습니다');
        return this.prisma.location.delete({ where: { id: locationId } });
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehouseService);
//# sourceMappingURL=warehouse.service.js.map