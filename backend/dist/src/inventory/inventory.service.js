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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCurrentStock(query) {
        const where = {};
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.itemCode && query.search) {
            where.item = {
                AND: [
                    { code: { contains: query.itemCode } },
                    {
                        OR: [
                            { code: { contains: query.search } },
                            { name: { contains: query.search } },
                        ],
                    },
                ],
            };
        }
        else if (query.itemCode) {
            where.item = { code: { contains: query.itemCode } };
        }
        else if (query.search) {
            where.item = {
                OR: [
                    { code: { contains: query.search } },
                    { name: { contains: query.search } },
                ],
            };
        }
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.inventory.findMany({
                where,
                skip,
                take: limit,
                include: {
                    item: { select: { id: true, code: true, name: true, uom: true, category: true } },
                    warehouse: { select: { id: true, code: true, name: true } },
                    location: { select: { id: true, code: true } },
                },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.inventory.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, page, limit);
    }
    async getStockByItem(itemId) {
        return this.prisma.inventory.findMany({
            where: { itemId },
            include: {
                warehouse: { select: { id: true, code: true, name: true } },
                location: { select: { id: true, code: true } },
            },
        });
    }
    async getStockSummary(warehouseId) {
        const inventory = await this.prisma.inventory.groupBy({
            by: ['itemId'],
            where: { warehouseId },
            _sum: {
                quantity: true,
                reservedQty: true,
                availableQty: true,
            },
        });
        const itemIds = inventory.map((i) => i.itemId);
        const items = await this.prisma.item.findMany({
            where: { id: { in: itemIds } },
            select: { id: true, code: true, name: true, uom: true, minStock: true },
        });
        const itemMap = new Map(items.map((i) => [i.id, i]));
        return inventory.map((inv) => ({
            item: itemMap.get(inv.itemId),
            totalQty: inv._sum.quantity || 0,
            reservedQty: inv._sum.reservedQty || 0,
            availableQty: inv._sum.availableQty || 0,
            belowMinStock: (inv._sum.quantity || 0) < (itemMap.get(inv.itemId)?.minStock || 0),
        }));
    }
    async createAdjustment(dto) {
        const item = await this.prisma.item.findUnique({
            where: { code: dto.itemCode },
        });
        if (!item)
            throw new common_1.NotFoundException(`품목 ${dto.itemCode}을(를) 찾을 수 없습니다`);
        return this.prisma.$transaction(async (tx) => {
            const adjustment = await tx.stockAdjustment.create({
                data: {
                    warehouseId: dto.warehouseId,
                    itemCode: dto.itemCode,
                    locationCode: dto.locationCode,
                    lotNo: dto.lotNo,
                    adjustQty: dto.adjustQty,
                    reason: dto.reason,
                    notes: dto.notes,
                    performedBy: dto.performedBy,
                },
            });
            const existingInventory = await tx.inventory.findFirst({
                where: {
                    itemId: item.id,
                    warehouseId: dto.warehouseId,
                    lotNo: dto.lotNo || null,
                },
            });
            if (existingInventory) {
                const newQty = existingInventory.quantity + dto.adjustQty;
                const newAvailableQty = existingInventory.availableQty + dto.adjustQty;
                if (newQty < 0) {
                    throw new common_1.BadRequestException('조정 결과 재고가 음수가 됩니다');
                }
                if (newAvailableQty < 0) {
                    throw new common_1.BadRequestException(`조정 결과 가용 수량이 음수가 됩니다. ` +
                        `현재 가용: ${existingInventory.availableQty}, 예약: ${existingInventory.reservedQty}`);
                }
                await tx.inventory.update({
                    where: { id: existingInventory.id },
                    data: {
                        quantity: newQty,
                        availableQty: newAvailableQty,
                    },
                });
            }
            else if (dto.adjustQty > 0) {
                await tx.inventory.create({
                    data: {
                        itemId: item.id,
                        warehouseId: dto.warehouseId,
                        lotNo: dto.lotNo || null,
                        quantity: dto.adjustQty,
                        availableQty: dto.adjustQty,
                        reservedQty: 0,
                    },
                });
            }
            else {
                throw new common_1.BadRequestException('존재하지 않는 재고에 음수 수량을 조정할 수 없습니다');
            }
            await tx.inventoryTransaction.create({
                data: {
                    itemId: item.id,
                    warehouseId: dto.warehouseId,
                    locationCode: dto.locationCode,
                    lotNo: dto.lotNo,
                    txType: dto.adjustQty > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
                    quantity: dto.adjustQty,
                    referenceType: 'STOCK_ADJUSTMENT',
                    referenceId: adjustment.id,
                    performedBy: dto.performedBy,
                    notes: `${dto.reason}: ${dto.notes || ''}`,
                },
            });
            return adjustment;
        });
    }
    async getAdjustments(warehouseId) {
        const where = {};
        if (warehouseId)
            where.warehouseId = warehouseId;
        return this.prisma.stockAdjustment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async createCycleCount(dto) {
        return this.prisma.cycleCount.create({ data: dto });
    }
    async getCycleCounts(warehouseId, status) {
        const where = {};
        if (warehouseId)
            where.warehouseId = warehouseId;
        if (status)
            where.status = status;
        return this.prisma.cycleCount.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async completeCycleCount(id, dto) {
        const cycleCount = await this.prisma.cycleCount.findUnique({
            where: { id },
        });
        if (!cycleCount)
            throw new common_1.NotFoundException('순환 실사를 찾을 수 없습니다');
        if (cycleCount.status === 'COMPLETED') {
            throw new common_1.BadRequestException('이미 완료된 순환 실사입니다');
        }
        const variance = dto.countedQty - cycleCount.systemQty;
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.cycleCount.update({
                where: { id },
                data: {
                    countedQty: dto.countedQty,
                    variance,
                    status: 'COMPLETED',
                    countedBy: dto.countedBy,
                    countedDate: new Date(),
                    notes: dto.notes,
                },
            });
            if (variance !== 0 && cycleCount.itemCode) {
                const item = await tx.item.findUnique({
                    where: { code: cycleCount.itemCode },
                });
                if (item) {
                    const inventory = await tx.inventory.findFirst({
                        where: {
                            itemId: item.id,
                            warehouseId: cycleCount.warehouseId,
                        },
                    });
                    if (inventory) {
                        const newQty = inventory.quantity + variance;
                        if (newQty >= 0) {
                            const newAvailable = Math.max(inventory.availableQty + variance, 0);
                            await tx.inventory.update({
                                where: { id: inventory.id },
                                data: {
                                    quantity: newQty,
                                    availableQty: newAvailable,
                                },
                            });
                            await tx.inventoryTransaction.create({
                                data: {
                                    itemId: item.id,
                                    warehouseId: cycleCount.warehouseId,
                                    locationCode: cycleCount.locationCode,
                                    txType: 'CYCLE_COUNT',
                                    quantity: variance,
                                    referenceType: 'CYCLE_COUNT',
                                    referenceId: id,
                                    performedBy: dto.countedBy,
                                    notes: `Cycle count variance: ${variance > 0 ? '+' : ''}${variance}`,
                                },
                            });
                        }
                    }
                }
            }
            return updated;
        });
    }
    async transferStock(dto) {
        if (dto.quantity <= 0) {
            throw new common_1.BadRequestException('이동 수량은 양수여야 합니다');
        }
        if (dto.fromLocationCode === dto.toLocationCode) {
            throw new common_1.BadRequestException('출발지와 목적지 로케이션이 동일합니다');
        }
        const item = await this.prisma.item.findUnique({
            where: { code: dto.itemCode },
        });
        if (!item)
            throw new common_1.NotFoundException(`품목 ${dto.itemCode}을(를) 찾을 수 없습니다`);
        return this.prisma.$transaction(async (tx) => {
            const sourceLocation = await tx.location.findFirst({
                where: {
                    code: dto.fromLocationCode,
                    zone: { warehouseId: dto.warehouseId },
                },
            });
            if (!sourceLocation) {
                throw new common_1.NotFoundException(`출발지 로케이션 ${dto.fromLocationCode}을(를) 해당 창고에서 찾을 수 없습니다`);
            }
            const sourceInventory = await tx.inventory.findFirst({
                where: {
                    itemId: item.id,
                    warehouseId: dto.warehouseId,
                    locationId: sourceLocation.id,
                    lotNo: dto.lotNo || null,
                },
            });
            if (!sourceInventory) {
                throw new common_1.NotFoundException(`로케이션 ${dto.fromLocationCode}에서 품목 ${dto.itemCode}의 재고를 찾을 수 없습니다`);
            }
            if (sourceInventory.availableQty < dto.quantity) {
                throw new common_1.BadRequestException(`가용 재고가 부족합니다. 가용: ${sourceInventory.availableQty}, 요청: ${dto.quantity}`);
            }
            await tx.inventory.update({
                where: { id: sourceInventory.id },
                data: {
                    quantity: sourceInventory.quantity - dto.quantity,
                    availableQty: sourceInventory.availableQty - dto.quantity,
                },
            });
            const destLocation = await tx.location.findFirst({
                where: {
                    code: dto.toLocationCode,
                    zone: { warehouseId: dto.warehouseId },
                },
            });
            if (!destLocation) {
                throw new common_1.NotFoundException(`목적지 로케이션 ${dto.toLocationCode}을(를) 해당 창고에서 찾을 수 없습니다`);
            }
            const destInventory = await tx.inventory.findFirst({
                where: {
                    itemId: item.id,
                    warehouseId: dto.warehouseId,
                    locationId: destLocation.id,
                    lotNo: dto.lotNo || null,
                },
            });
            if (destInventory) {
                await tx.inventory.update({
                    where: { id: destInventory.id },
                    data: {
                        quantity: destInventory.quantity + dto.quantity,
                        availableQty: destInventory.availableQty + dto.quantity,
                    },
                });
            }
            else {
                await tx.inventory.create({
                    data: {
                        itemId: item.id,
                        warehouseId: dto.warehouseId,
                        locationId: destLocation.id,
                        lotNo: dto.lotNo || null,
                        quantity: dto.quantity,
                        availableQty: dto.quantity,
                        reservedQty: 0,
                    },
                });
            }
            const transferNote = dto.notes || 'Stock transfer';
            await tx.inventoryTransaction.create({
                data: {
                    itemId: item.id,
                    warehouseId: dto.warehouseId,
                    locationCode: dto.fromLocationCode,
                    lotNo: dto.lotNo,
                    txType: 'TRANSFER',
                    quantity: -dto.quantity,
                    referenceType: 'TRANSFER',
                    performedBy: dto.performedBy,
                    notes: `${transferNote} [FROM ${dto.fromLocationCode} TO ${dto.toLocationCode}]`,
                },
            });
            await tx.inventoryTransaction.create({
                data: {
                    itemId: item.id,
                    warehouseId: dto.warehouseId,
                    locationCode: dto.toLocationCode,
                    lotNo: dto.lotNo,
                    txType: 'TRANSFER',
                    quantity: dto.quantity,
                    referenceType: 'TRANSFER',
                    performedBy: dto.performedBy,
                    notes: `${transferNote} [FROM ${dto.fromLocationCode} TO ${dto.toLocationCode}]`,
                },
            });
            return {
                success: true,
                itemCode: dto.itemCode,
                fromLocationCode: dto.fromLocationCode,
                toLocationCode: dto.toLocationCode,
                quantity: dto.quantity,
                lotNo: dto.lotNo || null,
            };
        });
    }
    async getTransactions(query) {
        const where = {};
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.itemId)
            where.itemId = query.itemId;
        if (query.txType)
            where.txType = query.txType;
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate)
                where.createdAt.gte = new Date(query.startDate);
            if (query.endDate)
                where.createdAt.lte = new Date(query.endDate);
        }
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.inventoryTransaction.findMany({
                where,
                skip,
                take: limit,
                include: {
                    item: { select: { id: true, code: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.inventoryTransaction.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, page, limit);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map