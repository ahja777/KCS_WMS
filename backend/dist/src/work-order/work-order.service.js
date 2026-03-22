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
exports.WorkOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let WorkOrderService = class WorkOrderService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.type)
            where.workType = query.type;
        if (query.status)
            where.status = query.status;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        const allowedSortFields = ['createdAt', 'workType', 'status', 'startedAt'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.workOrder.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: {
                    warehouse: { select: { id: true, name: true, code: true } },
                    items: true,
                },
            }),
            this.prisma.workOrder.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.workOrder.findUnique({
            where: { id },
            include: {
                warehouse: { select: { id: true, name: true, code: true } },
                items: true,
            },
        });
        if (!item)
            throw new common_1.NotFoundException('작업지시서를 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const { items, ...workOrderData } = dto;
        return this.prisma.workOrder.create({
            data: {
                ...workOrderData,
                items: items?.length
                    ? { create: items }
                    : undefined,
            },
            include: { items: true },
        });
    }
    async assign(id, assignedTo) {
        const existing = await this.findById(id);
        if (existing.status !== 'CREATED') {
            throw new common_1.BadRequestException('CREATED 상태에서만 배정할 수 있습니다');
        }
        return this.prisma.workOrder.update({
            where: { id },
            data: {
                status: 'ASSIGNED',
                assignedTo: assignedTo || existing.assignedTo,
            },
        });
    }
    async start(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'CREATED' && existing.status !== 'ASSIGNED') {
            throw new common_1.BadRequestException('CREATED 또는 ASSIGNED 상태에서만 시작할 수 있습니다');
        }
        return this.prisma.workOrder.update({
            where: { id },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
    }
    async complete(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('IN_PROGRESS 상태에서만 완료할 수 있습니다');
        }
        return this.prisma.workOrder.update({
            where: { id },
            data: { status: 'COMPLETED', completedAt: new Date() },
        });
    }
};
exports.WorkOrderService = WorkOrderService;
exports.WorkOrderService = WorkOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkOrderService);
//# sourceMappingURL=work-order.service.js.map