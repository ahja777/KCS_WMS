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
exports.SettlementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let SettlementService = class SettlementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.partnerId)
            where.partnerId = query.partnerId;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.search) {
            where.OR = [
                { warehouse: { name: { contains: query.search } } },
                { notes: { contains: query.search } },
            ];
        }
        const allowedSortFields = ['createdAt', 'periodStart', 'periodEnd', 'totalAmount', 'status'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.settlement.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: {
                    warehouse: { select: { id: true, name: true, code: true } },
                },
            }),
            this.prisma.settlement.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.settlement.findUnique({
            where: { id },
            include: {
                warehouse: { select: { id: true, name: true, code: true } },
                details: { orderBy: { workDate: 'asc' } },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('정산을 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const { details, ...settlementData } = dto;
        return this.prisma.settlement.create({
            data: {
                ...settlementData,
                periodStart: new Date(dto.periodStart),
                periodEnd: new Date(dto.periodEnd),
                details: details?.length
                    ? {
                        create: details.map((d) => ({
                            ...d,
                            workDate: new Date(d.workDate),
                        })),
                    }
                    : undefined,
            },
            include: { details: true },
        });
    }
    async update(id, dto) {
        const existing = await this.findById(id);
        if (existing.status === 'CONFIRMED' || existing.status === 'INVOICED') {
            throw new common_1.BadRequestException('확정/청구 상태의 정산은 수정할 수 없습니다');
        }
        const { details, ...settlementData } = dto;
        const updateData = { ...settlementData };
        if (dto.periodStart)
            updateData.periodStart = new Date(dto.periodStart);
        if (dto.periodEnd)
            updateData.periodEnd = new Date(dto.periodEnd);
        if (details) {
            await this.prisma.settlementDetail.deleteMany({ where: { settlementId: id } });
            updateData.details = {
                create: details.map((d) => ({
                    ...d,
                    workDate: new Date(d.workDate),
                })),
            };
        }
        return this.prisma.settlement.update({
            where: { id },
            data: updateData,
            include: { details: true },
        });
    }
    async confirm(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'DRAFT' && existing.status !== 'CALCULATED') {
            throw new common_1.BadRequestException('DRAFT 또는 CALCULATED 상태에서만 확정할 수 있습니다');
        }
        return this.prisma.settlement.update({
            where: { id },
            data: { status: 'CONFIRMED' },
        });
    }
    async delete(id) {
        const existing = await this.findById(id);
        if (existing.status === 'CONFIRMED' || existing.status === 'INVOICED') {
            throw new common_1.BadRequestException('확정/청구 상태의 정산은 삭제할 수 없습니다');
        }
        return this.prisma.settlement.delete({ where: { id } });
    }
};
exports.SettlementService = SettlementService;
exports.SettlementService = SettlementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettlementService);
//# sourceMappingURL=settlement.service.js.map