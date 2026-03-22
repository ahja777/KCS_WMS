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
exports.VehicleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let VehicleService = class VehicleService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { plateNo: { contains: query.search } },
                { driverName: { contains: query.search } },
                { driverPhone: { contains: query.search } },
            ];
        }
        const allowedSortFields = ['createdAt', 'plateNo', 'tonnage', 'driverName'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: { warehouse: { select: { id: true, name: true, code: true } } },
            }),
            this.prisma.vehicle.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.vehicle.findUnique({
            where: { id },
            include: { warehouse: { select: { id: true, name: true, code: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException('차량을 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const existing = await this.prisma.vehicle.findUnique({
            where: { plateNo: dto.plateNo },
        });
        if (existing)
            throw new common_1.ConflictException('이미 등록된 차량번호입니다');
        return this.prisma.vehicle.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.vehicle.update({ where: { id }, data: dto });
    }
    async delete(id) {
        await this.findById(id);
        const dispatchCount = await this.prisma.dispatch.count({ where: { vehicleId: id } });
        if (dispatchCount > 0) {
            throw new common_1.BadRequestException('해당 차량에 연결된 배차가 있어 삭제할 수 없습니다');
        }
        return this.prisma.vehicle.delete({ where: { id } });
    }
};
exports.VehicleService = VehicleService;
exports.VehicleService = VehicleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehicleService);
//# sourceMappingURL=vehicle.service.js.map