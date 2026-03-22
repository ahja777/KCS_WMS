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
exports.InventoryMovementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let InventoryMovementService = class InventoryMovementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        const allowedSortFields = ['createdAt', 'movementDate', 'status'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.inventoryMovement.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: { items: true },
            }),
            this.prisma.inventoryMovement.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.inventoryMovement.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!item)
            throw new common_1.NotFoundException('재고이동을 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const { items, ...movementData } = dto;
        return this.prisma.inventoryMovement.create({
            data: {
                ...movementData,
                items: {
                    create: items,
                },
            },
            include: { items: true },
        });
    }
    async start(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'DRAFT') {
            throw new common_1.BadRequestException('DRAFT 상태에서만 시작할 수 있습니다');
        }
        return this.prisma.inventoryMovement.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
        });
    }
    async complete(id) {
        const existing = await this.findById(id);
        if (existing.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('IN_PROGRESS 상태에서만 완료할 수 있습니다');
        }
        return this.prisma.inventoryMovement.update({
            where: { id },
            data: { status: 'COMPLETED' },
        });
    }
};
exports.InventoryMovementService = InventoryMovementService;
exports.InventoryMovementService = InventoryMovementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryMovementService);
//# sourceMappingURL=inventory-movement.service.js.map