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
var InboundService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboundService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let InboundService = InboundService_1 = class InboundService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InboundService_1.name);
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
        const allowedSortFields = ['createdAt', 'orderNumber', 'status', 'expectedDate'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.inboundOrder.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
                include: {
                    partner: { select: { id: true, code: true, name: true } },
                    warehouse: { select: { id: true, code: true, name: true } },
                    items: { include: { item: { select: { id: true, code: true, name: true } } } },
                    _count: { select: { receipts: true } },
                },
            }),
            this.prisma.inboundOrder.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const order = await this.prisma.inboundOrder.findUnique({
            where: { id },
            include: {
                partner: true,
                warehouse: true,
                items: { include: { item: true } },
                receipts: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException('입고 주문을 찾을 수 없습니다');
        return order;
    }
    async create(dto) {
        const expectedDate = new Date(dto.expectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expectedDate < today) {
            throw new common_1.BadRequestException('입고 예정일이 과거입니다.');
        }
        const existing = await this.prisma.inboundOrder.findUnique({
            where: { orderNumber: dto.orderNumber },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 주문번호입니다');
        const { items, ...orderData } = dto;
        return this.prisma.inboundOrder.create({
            data: {
                ...orderData,
                expectedDate: new Date(dto.expectedDate),
                items: {
                    create: items.map((item) => ({
                        itemId: item.itemId,
                        expectedQty: item.expectedQty,
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
        return this.prisma.inboundOrder.update({
            where: { id },
            data: {
                ...dto,
                expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
            },
        });
    }
    async delete(id) {
        const order = await this.findById(id);
        if (order.status !== 'DRAFT') {
            throw new common_1.BadRequestException('임시저장 상태의 주문만 삭제할 수 있습니다');
        }
        return this.prisma.inboundOrder.delete({ where: { id } });
    }
    async confirm(id) {
        const order = await this.findById(id);
        if (order.status !== 'DRAFT') {
            throw new common_1.BadRequestException('임시저장 상태의 주문만 확정할 수 있습니다');
        }
        return this.prisma.inboundOrder.update({
            where: { id },
            data: { status: 'CONFIRMED' },
            include: { items: { include: { item: true } }, partner: true, warehouse: true },
        });
    }
    async markArrived(id) {
        const order = await this.findById(id);
        if (order.status !== 'CONFIRMED') {
            throw new common_1.BadRequestException('확정된 주문만 도착 처리할 수 있습니다');
        }
        return this.prisma.inboundOrder.update({
            where: { id },
            data: { status: 'ARRIVED', arrivedDate: new Date() },
            include: { items: { include: { item: true } }, partner: true, warehouse: true },
        });
    }
    async cancel(id) {
        const order = await this.findById(id);
        if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
            throw new common_1.BadRequestException('완료 또는 이미 취소된 주문은 취소할 수 없습니다');
        }
        if (order.status === 'RECEIVING') {
            throw new common_1.BadRequestException('입고 진행 중인 주문은 취소할 수 없습니다');
        }
        return this.prisma.inboundOrder.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: { items: { include: { item: true } }, partner: true, warehouse: true },
        });
    }
    async receive(id, dto) {
        const order = await this.findById(id);
        if (!['ARRIVED', 'RECEIVING'].includes(order.status)) {
            throw new common_1.BadRequestException('도착 또는 입고 중 상태의 주문만 입고 처리할 수 있습니다');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.inboundOrder.update({
                where: { id },
                data: { status: 'RECEIVING' },
            });
            for (const receiveItem of dto.items) {
                const orderItem = await tx.inboundOrderItem.findUnique({
                    where: { id: receiveItem.inboundOrderItemId },
                    include: { item: true },
                });
                if (!orderItem) {
                    throw new common_1.NotFoundException(`주문 항목 ${receiveItem.inboundOrderItemId}을(를) 찾을 수 없습니다`);
                }
                const totalReceived = orderItem.receivedQty + receiveItem.receivedQty;
                if (totalReceived > orderItem.expectedQty) {
                    this.logger.warn(`Over-receiving item ${orderItem.item.code}: ` +
                        `expected=${orderItem.expectedQty}, will have received=${totalReceived}`);
                }
                await tx.inboundOrderItem.update({
                    where: { id: receiveItem.inboundOrderItemId },
                    data: {
                        receivedQty: { increment: receiveItem.receivedQty },
                        damagedQty: { increment: receiveItem.damagedQty || 0 },
                    },
                });
                let locationId = null;
                if (receiveItem.locationCode) {
                    const location = await tx.location.findFirst({
                        where: {
                            code: receiveItem.locationCode,
                            zone: { warehouseId: order.warehouseId },
                        },
                    });
                    if (!location) {
                        throw new common_1.BadRequestException(`Location code '${receiveItem.locationCode}' not found in the warehouse`);
                    }
                    locationId = location.id;
                }
                const existingInventory = await tx.inventory.findFirst({
                    where: {
                        itemId: orderItem.itemId,
                        warehouseId: order.warehouseId,
                        locationId,
                        lotNo: receiveItem.lotNo || null,
                    },
                });
                if (existingInventory) {
                    await tx.inventory.update({
                        where: { id: existingInventory.id },
                        data: {
                            quantity: { increment: receiveItem.receivedQty },
                            availableQty: { increment: receiveItem.receivedQty },
                        },
                    });
                }
                else {
                    await tx.inventory.create({
                        data: {
                            itemId: orderItem.itemId,
                            warehouseId: order.warehouseId,
                            locationId,
                            lotNo: receiveItem.lotNo || null,
                            quantity: receiveItem.receivedQty,
                            availableQty: receiveItem.receivedQty,
                            reservedQty: 0,
                        },
                    });
                }
                await tx.inventoryTransaction.create({
                    data: {
                        itemId: orderItem.itemId,
                        warehouseId: order.warehouseId,
                        locationCode: receiveItem.locationCode,
                        lotNo: receiveItem.lotNo,
                        txType: 'INBOUND',
                        quantity: receiveItem.receivedQty,
                        referenceType: 'INBOUND_ORDER',
                        referenceId: order.id,
                        performedBy: dto.receivedBy,
                        notes: receiveItem.notes,
                    },
                });
            }
            await tx.inboundReceipt.create({
                data: {
                    inboundOrderId: id,
                    receivedBy: dto.receivedBy,
                    notes: `Received ${dto.items.length} line items`,
                },
            });
            const updatedItems = await tx.inboundOrderItem.findMany({
                where: { inboundOrderId: id },
            });
            const allReceived = updatedItems.every((item) => item.receivedQty >= item.expectedQty);
            if (allReceived) {
                await tx.inboundOrder.update({
                    where: { id },
                    data: { status: 'COMPLETED', completedDate: new Date() },
                });
            }
            return tx.inboundOrder.findUnique({
                where: { id },
                include: {
                    items: { include: { item: true } },
                    partner: true,
                    warehouse: true,
                    receipts: true,
                },
            });
        });
    }
};
exports.InboundService = InboundService;
exports.InboundService = InboundService = InboundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InboundService);
//# sourceMappingURL=inbound.service.js.map