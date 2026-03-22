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
exports.OutboundService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let OutboundService = class OutboundService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { orderNumber: { contains: query.search } },
            ];
        }
        if (query.status)
            where.status = query.status;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        const allowedSortFields = ['createdAt', 'orderNumber', 'status', 'shipDate'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.outboundOrder.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: {
                    partner: { select: { id: true, code: true, name: true } },
                    warehouse: { select: { id: true, code: true, name: true } },
                    items: { include: { item: { select: { id: true, code: true, name: true } } } },
                    _count: { select: { shipments: true } },
                },
            }),
            this.prisma.outboundOrder.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const order = await this.prisma.outboundOrder.findUnique({
            where: { id },
            include: {
                partner: true,
                warehouse: true,
                items: { include: { item: true } },
                shipments: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException('출고 주문을 찾을 수 없습니다');
        return order;
    }
    async create(dto) {
        if (dto.shipDate) {
            const shipDate = new Date(dto.shipDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (shipDate < today) {
                throw new common_1.BadRequestException('출하 예정일이 과거입니다.');
            }
        }
        const existing = await this.prisma.outboundOrder.findUnique({
            where: { orderNumber: dto.orderNumber },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 주문번호입니다');
        const { items, ...orderData } = dto;
        return this.prisma.outboundOrder.create({
            data: {
                ...orderData,
                shipDate: dto.shipDate ? new Date(dto.shipDate) : null,
                items: {
                    create: items.map((item) => ({
                        itemId: item.itemId,
                        orderedQty: item.orderedQty,
                        notes: item.notes,
                    })),
                },
            },
            include: {
                items: { include: { item: true } },
                partner: true,
                warehouse: true,
            },
        });
    }
    async update(id, dto) {
        const order = await this.findById(id);
        if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
            throw new common_1.BadRequestException('현재 상태에서는 주문을 수정할 수 없습니다');
        }
        return this.prisma.outboundOrder.update({
            where: { id },
            data: {
                ...dto,
                shipDate: dto.shipDate ? new Date(dto.shipDate) : undefined,
            },
        });
    }
    async delete(id) {
        const order = await this.findById(id);
        if (order.status !== 'DRAFT') {
            throw new common_1.BadRequestException('임시저장 상태의 주문만 삭제할 수 있습니다');
        }
        return this.prisma.outboundOrder.delete({ where: { id } });
    }
    async confirm(id) {
        const order = await this.findById(id);
        if (order.status !== 'DRAFT') {
            throw new common_1.BadRequestException('임시저장 상태의 주문만 확정할 수 있습니다');
        }
        return this.prisma.$transaction(async (tx) => {
            const itemIds = order.items.map((i) => i.itemId);
            const stockSummary = await tx.inventory.groupBy({
                by: ['itemId'],
                where: {
                    itemId: { in: itemIds },
                    warehouseId: order.warehouseId,
                },
                _sum: { availableQty: true },
            });
            const stockMap = new Map(stockSummary.map((s) => [s.itemId, s._sum.availableQty || 0]));
            for (const orderItem of order.items) {
                const available = stockMap.get(orderItem.itemId) || 0;
                if (available < orderItem.orderedQty) {
                    throw new common_1.BadRequestException(`품목 ${orderItem.item.code}의 재고가 부족합니다. 가용: ${available}, 필요: ${orderItem.orderedQty}`);
                }
            }
            for (const orderItem of order.items) {
                const inventories = await tx.inventory.findMany({
                    where: {
                        itemId: orderItem.itemId,
                        warehouseId: order.warehouseId,
                        availableQty: { gt: 0 },
                    },
                    orderBy: { createdAt: 'asc' },
                });
                let remaining = orderItem.orderedQty;
                for (const inv of inventories) {
                    if (remaining <= 0)
                        break;
                    const reserveQty = Math.min(remaining, inv.availableQty);
                    await tx.inventory.update({
                        where: { id: inv.id },
                        data: {
                            reservedQty: { increment: reserveQty },
                            availableQty: { decrement: reserveQty },
                        },
                    });
                    remaining -= reserveQty;
                }
            }
            return tx.outboundOrder.update({
                where: { id },
                data: { status: 'CONFIRMED' },
                include: { items: { include: { item: true } }, partner: true, warehouse: true },
            });
        });
    }
    async pick(id, dto) {
        const order = await this.findById(id);
        if (!['CONFIRMED', 'PICKING'].includes(order.status)) {
            throw new common_1.BadRequestException('확정 또는 피킹 중 상태의 주문만 피킹 처리할 수 있습니다');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.outboundOrder.update({
                where: { id },
                data: { status: 'PICKING' },
            });
            for (const pickItem of dto.items) {
                const orderItem = await tx.outboundOrderItem.findUnique({
                    where: { id: pickItem.outboundOrderItemId },
                });
                if (!orderItem) {
                    throw new common_1.NotFoundException(`주문 항목 ${pickItem.outboundOrderItemId}을(를) 찾을 수 없습니다`);
                }
                const newPickedQty = orderItem.pickedQty + pickItem.pickedQty;
                if (newPickedQty > orderItem.orderedQty) {
                    throw new common_1.BadRequestException(`항목 ${pickItem.outboundOrderItemId}의 피킹 수량이 주문 수량을 초과합니다. ` +
                        `주문: ${orderItem.orderedQty}, 기피킹: ${orderItem.pickedQty}, 요청: ${pickItem.pickedQty}`);
                }
                await tx.outboundOrderItem.update({
                    where: { id: pickItem.outboundOrderItemId },
                    data: { pickedQty: { increment: pickItem.pickedQty } },
                });
            }
            const updatedItems = await tx.outboundOrderItem.findMany({
                where: { outboundOrderId: id },
            });
            const allPicked = updatedItems.every((item) => item.pickedQty >= item.orderedQty);
            if (allPicked) {
                await tx.outboundOrder.update({
                    where: { id },
                    data: { status: 'PACKING' },
                });
            }
            return tx.outboundOrder.findUnique({
                where: { id },
                include: { items: { include: { item: true } } },
            });
        });
    }
    async ship(id, dto) {
        const order = await this.findById(id);
        if (order.status !== 'PACKING') {
            throw new common_1.BadRequestException('포장 완료 상태의 주문만 출하 처리할 수 있습니다');
        }
        return this.prisma.$transaction(async (tx) => {
            for (const orderItem of order.items) {
                await tx.outboundOrderItem.update({
                    where: { id: orderItem.id },
                    data: { shippedQty: orderItem.pickedQty, packedQty: orderItem.pickedQty },
                });
                const inventories = await tx.inventory.findMany({
                    where: {
                        itemId: orderItem.itemId,
                        warehouseId: order.warehouseId,
                        reservedQty: { gt: 0 },
                    },
                    orderBy: { createdAt: 'asc' },
                });
                let remaining = orderItem.pickedQty;
                for (const inv of inventories) {
                    if (remaining <= 0)
                        break;
                    const deductQty = Math.min(remaining, inv.reservedQty);
                    await tx.inventory.update({
                        where: { id: inv.id },
                        data: {
                            quantity: { decrement: deductQty },
                            reservedQty: { decrement: deductQty },
                        },
                    });
                    remaining -= deductQty;
                }
                await tx.inventoryTransaction.create({
                    data: {
                        itemId: orderItem.itemId,
                        warehouseId: order.warehouseId,
                        txType: 'OUTBOUND',
                        quantity: -orderItem.pickedQty,
                        referenceType: 'OUTBOUND_ORDER',
                        referenceId: order.id,
                        performedBy: dto.shippedBy,
                    },
                });
            }
            await tx.outboundShipment.create({
                data: {
                    outboundOrderId: id,
                    shippedBy: dto.shippedBy,
                    carrier: dto.carrier,
                    trackingNumber: dto.trackingNumber,
                    weight: dto.weight,
                    notes: dto.notes,
                },
            });
            return tx.outboundOrder.update({
                where: { id },
                data: {
                    status: 'SHIPPED',
                    shipDate: new Date(),
                    trackingNumber: dto.trackingNumber,
                },
                include: {
                    items: { include: { item: true } },
                    shipments: true,
                },
            });
        });
    }
    async markDelivered(id) {
        const order = await this.findById(id);
        if (order.status !== 'SHIPPED') {
            throw new common_1.BadRequestException('출하 완료된 주문만 배송 완료 처리할 수 있습니다');
        }
        return this.prisma.outboundOrder.update({
            where: { id },
            data: { status: 'DELIVERED', deliveryDate: new Date(), completedDate: new Date() },
            include: { items: { include: { item: true } }, partner: true, warehouse: true },
        });
    }
    async cancel(id) {
        const order = await this.findById(id);
        if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
            throw new common_1.BadRequestException('현재 상태에서는 주문을 취소할 수 없습니다');
        }
        if (['CONFIRMED', 'PICKING', 'PACKING'].includes(order.status)) {
            return this.prisma.$transaction(async (tx) => {
                for (const orderItem of order.items) {
                    const inventories = await tx.inventory.findMany({
                        where: {
                            itemId: orderItem.itemId,
                            warehouseId: order.warehouseId,
                            reservedQty: { gt: 0 },
                        },
                        orderBy: { createdAt: 'asc' },
                    });
                    let remaining = orderItem.orderedQty - orderItem.shippedQty;
                    for (const inv of inventories) {
                        if (remaining <= 0)
                            break;
                        const releaseQty = Math.min(remaining, inv.reservedQty);
                        await tx.inventory.update({
                            where: { id: inv.id },
                            data: {
                                reservedQty: { decrement: releaseQty },
                                availableQty: { increment: releaseQty },
                            },
                        });
                        remaining -= releaseQty;
                    }
                }
                return tx.outboundOrder.update({
                    where: { id },
                    data: { status: 'CANCELLED' },
                    include: { items: { include: { item: true } }, partner: true, warehouse: true },
                });
            });
        }
        return this.prisma.outboundOrder.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: { items: { include: { item: true } }, partner: true, warehouse: true },
        });
    }
};
exports.OutboundService = OutboundService;
exports.OutboundService = OutboundService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OutboundService);
//# sourceMappingURL=outbound.service.js.map