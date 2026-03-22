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
exports.DispatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let DispatchService = class DispatchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.date) {
            const d = new Date(query.date);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);
            where.dispatchDate = { gte: d, lt: nextDay };
        }
        const allowedSortFields = ['createdAt', 'dispatchDate', 'status', 'dispatchSeq'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.dispatch.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: {
                    warehouse: { select: { id: true, name: true, code: true } },
                    vehicle: { select: { id: true, plateNo: true, driverName: true } },
                    items: true,
                },
            }),
            this.prisma.dispatch.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.dispatch.findUnique({
            where: { id },
            include: {
                warehouse: { select: { id: true, name: true, code: true } },
                vehicle: true,
                inboundOrder: { select: { id: true, orderNumber: true, status: true } },
                items: true,
            },
        });
        if (!item)
            throw new common_1.NotFoundException('배차를 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const { items, ...dispatchData } = dto;
        return this.prisma.dispatch.create({
            data: {
                ...dispatchData,
                dispatchDate: new Date(dto.dispatchDate),
                items: items?.length
                    ? { create: items }
                    : undefined,
            },
            include: { items: true },
        });
    }
    async update(id, dto) {
        const existing = await this.findById(id);
        if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
            throw new common_1.BadRequestException('완료/취소 상태의 배차는 수정할 수 없습니다');
        }
        const { items, ...dispatchData } = dto;
        const updateData = { ...dispatchData };
        if (dto.dispatchDate)
            updateData.dispatchDate = new Date(dto.dispatchDate);
        if (items) {
            await this.prisma.dispatchItem.deleteMany({ where: { dispatchId: id } });
            updateData.items = { create: items };
        }
        return this.prisma.dispatch.update({
            where: { id },
            data: updateData,
            include: { items: true },
        });
    }
    async start(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'PLANNED' && existing.status !== 'ASSIGNED') {
            throw new common_1.BadRequestException('PLANNED 또는 ASSIGNED 상태에서만 시작할 수 있습니다');
        }
        return this.prisma.dispatch.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
        });
    }
    async complete(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('IN_PROGRESS 상태에서만 완료할 수 있습니다');
        }
        return this.prisma.dispatch.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });
    }
    async delete(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'PLANNED') {
            throw new common_1.BadRequestException('PLANNED 상태에서만 삭제할 수 있습니다');
        }
        return this.prisma.dispatch.delete({ where: { id } });
    }
};
exports.DispatchService = DispatchService;
exports.DispatchService = DispatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DispatchService);
//# sourceMappingURL=dispatch.service.js.map