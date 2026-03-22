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
var ChannelSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const channel_service_1 = require("./channel.service");
const client_1 = require("@prisma/client");
let ChannelSyncService = ChannelSyncService_1 = class ChannelSyncService {
    constructor(prisma, channelService) {
        this.prisma = prisma;
        this.channelService = channelService;
        this.logger = new common_1.Logger(ChannelSyncService_1.name);
    }
    async syncOrders(channelId, fromDate, toDate) {
        const channel = await this.prisma.salesChannel.findUnique({
            where: { id: channelId },
        });
        if (!channel)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        const adapter = this.channelService.getAdapter(channel.platform);
        const credentials = channel.credentials;
        const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 24 * 3600000);
        const to = toDate ? new Date(toDate) : new Date();
        const syncLog = await this.prisma.channelSyncLog.create({
            data: {
                channelId,
                syncType: client_1.SyncType.ORDER_PULL,
                direction: client_1.SyncDirection.INBOUND,
                status: 'RUNNING',
            },
        });
        let recordCount = 0;
        let errorCount = 0;
        let errorDetail = '';
        try {
            const orders = await adapter.fetchOrders(credentials, from, to);
            for (const order of orders) {
                try {
                    const existing = await this.prisma.channelOrder.findUnique({
                        where: {
                            channelId_platformOrderId: {
                                channelId,
                                platformOrderId: order.platformOrderId,
                            },
                        },
                    });
                    if (existing) {
                        this.logger.debug(`주문 이미 존재: ${order.platformOrderId}`);
                        continue;
                    }
                    const itemMappings = await this.resolveItemMappings(channelId, order.items);
                    await this.prisma.channelOrder.create({
                        data: {
                            channelId,
                            platformOrderId: order.platformOrderId,
                            platformOrderNo: order.platformOrderNo,
                            status: client_1.ChannelOrderStatus.NEW,
                            orderDate: order.orderDate,
                            customerName: order.customerName,
                            customerPhone: order.customerPhone,
                            shippingAddress: order.shippingAddress,
                            shippingZipCode: order.shippingZipCode,
                            shippingMethod: order.shippingMethod,
                            totalAmount: order.totalAmount,
                            currency: order.currency,
                            rawData: order.rawData,
                            items: {
                                create: order.items.map((item, idx) => ({
                                    platformItemId: item.platformItemId,
                                    platformSku: item.platformSku,
                                    itemName: item.itemName,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    itemId: itemMappings[idx] || null,
                                })),
                            },
                        },
                    });
                    recordCount++;
                }
                catch (err) {
                    errorCount++;
                    errorDetail += `주문 ${order.platformOrderId}: ${err.message}\n`;
                    this.logger.warn(`주문 저장 실패 (${order.platformOrderId}): ${err.message}`);
                }
            }
            await this.prisma.salesChannel.update({
                where: { id: channelId },
                data: {
                    lastSyncAt: new Date(),
                    lastSyncError: errorCount > 0 ? `${errorCount}건 오류` : null,
                    status: 'ACTIVE',
                },
            });
        }
        catch (err) {
            errorCount++;
            errorDetail = err.message;
            this.logger.error(`주문 동기화 실패: ${err.message}`);
            await this.prisma.salesChannel.update({
                where: { id: channelId },
                data: {
                    lastSyncError: err.message,
                    status: 'ERROR',
                },
            });
        }
        await this.prisma.channelSyncLog.update({
            where: { id: syncLog.id },
            data: {
                status: errorCount > 0 ? 'PARTIAL' : 'SUCCESS',
                recordCount,
                errorCount,
                errorDetail: errorDetail || null,
                completedAt: new Date(),
            },
        });
        return {
            syncLogId: syncLog.id,
            recordCount,
            errorCount,
            platform: channel.platform,
        };
    }
    async confirmShipment(channelOrderId, carrier, trackingNumber) {
        const channelOrder = await this.prisma.channelOrder.findUnique({
            where: { id: channelOrderId },
            include: { channel: true },
        });
        if (!channelOrder)
            throw new common_1.NotFoundException('채널 주문을 찾을 수 없습니다.');
        const adapter = this.channelService.getAdapter(channelOrder.channel.platform);
        const credentials = channelOrder.channel.credentials;
        const success = await adapter.confirmShipment(credentials, {
            platformOrderId: channelOrder.platformOrderId,
            carrier,
            trackingNumber,
        });
        if (success) {
            await this.prisma.channelOrder.update({
                where: { id: channelOrderId },
                data: {
                    status: client_1.ChannelOrderStatus.SHIPPED,
                    carrier,
                    trackingNumber,
                    shippedAt: new Date(),
                },
            });
        }
        return { success, channelOrderId };
    }
    async syncInventory(channelId) {
        const channel = await this.prisma.salesChannel.findUnique({
            where: { id: channelId },
            include: {
                channelProducts: {
                    where: { isLinked: true },
                    include: { item: true },
                },
            },
        });
        if (!channel)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        const adapter = this.channelService.getAdapter(channel.platform);
        const credentials = channel.credentials;
        const itemIds = channel.channelProducts.map((cp) => cp.itemId);
        const inventories = await this.prisma.inventory.groupBy({
            by: ['itemId'],
            where: {
                itemId: { in: itemIds },
                warehouseId: channel.warehouseId,
            },
            _sum: { availableQty: true },
        });
        const inventoryMap = new Map(inventories.map((inv) => [inv.itemId, inv._sum.availableQty || 0]));
        const updateItems = channel.channelProducts
            .filter((cp) => cp.platformSku)
            .map((cp) => ({
            platformSku: cp.platformSku,
            quantity: inventoryMap.get(cp.itemId) || 0,
        }));
        if (updateItems.length === 0) {
            return { success: 0, failed: 0, total: 0 };
        }
        const syncLog = await this.prisma.channelSyncLog.create({
            data: {
                channelId,
                syncType: client_1.SyncType.INVENTORY_PUSH,
                direction: client_1.SyncDirection.OUTBOUND,
                status: 'RUNNING',
            },
        });
        const result = await adapter.updateInventory(credentials, updateItems);
        await this.prisma.channelSyncLog.update({
            where: { id: syncLog.id },
            data: {
                status: result.failed > 0 ? 'PARTIAL' : 'SUCCESS',
                recordCount: result.success,
                errorCount: result.failed,
                completedAt: new Date(),
            },
        });
        await this.prisma.channelProduct.updateMany({
            where: { channelId, isLinked: true },
            data: { lastSyncAt: new Date() },
        });
        return { ...result, total: updateItems.length };
    }
    async getChannelOrders(channelId, params) {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;
        const where = { channelId };
        if (params?.status)
            where.status = params.status;
        const [data, total] = await Promise.all([
            this.prisma.channelOrder.findMany({
                where,
                include: {
                    items: { include: { item: true } },
                    channel: true,
                },
                orderBy: { orderDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.channelOrder.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getAllChannelOrders(params) {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params?.status)
            where.status = params.status;
        if (params?.platform) {
            where.channel = { platform: params.platform };
        }
        if (params?.search) {
            where.OR = [
                { platformOrderNo: { contains: params.search } },
                { customerName: { contains: params.search } },
                { trackingNumber: { contains: params.search } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.channelOrder.findMany({
                where,
                include: {
                    items: { include: { item: true } },
                    channel: true,
                },
                orderBy: { orderDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.channelOrder.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async linkProduct(channelId, itemId, platformProductId, platformSku) {
        return this.prisma.channelProduct.upsert({
            where: { channelId_itemId: { channelId, itemId } },
            create: {
                channelId,
                itemId,
                platformProductId,
                platformSku,
                isLinked: true,
            },
            update: {
                platformProductId,
                platformSku,
                isLinked: true,
            },
        });
    }
    async unlinkProduct(channelId, itemId) {
        return this.prisma.channelProduct.update({
            where: { channelId_itemId: { channelId, itemId } },
            data: { isLinked: false },
        });
    }
    async getLinkedProducts(channelId) {
        return this.prisma.channelProduct.findMany({
            where: { channelId },
            include: { item: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async fetchChannelProducts(channelId) {
        const channel = await this.prisma.salesChannel.findUnique({
            where: { id: channelId },
        });
        if (!channel)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        const adapter = this.channelService.getAdapter(channel.platform);
        const credentials = channel.credentials;
        const products = await adapter.fetchProducts(credentials);
        return products;
    }
    async autoSyncOrders() {
        const channels = await this.prisma.salesChannel.findMany({
            where: {
                syncEnabled: true,
                status: 'ACTIVE',
            },
        });
        for (const channel of channels) {
            if (channel.lastSyncAt) {
                const elapsed = Date.now() - channel.lastSyncAt.getTime();
                if (elapsed < channel.syncInterval * 60000)
                    continue;
            }
            try {
                this.logger.log(`자동 주문 동기화 시작: ${channel.name} (${channel.platform})`);
                await this.syncOrders(channel.id);
            }
            catch (err) {
                this.logger.error(`자동 주문 동기화 실패 (${channel.name}): ${err.message}`);
            }
        }
    }
    async resolveItemMappings(channelId, items) {
        const mappings = [];
        for (const item of items) {
            if (!item.platformSku) {
                mappings.push(null);
                continue;
            }
            const linked = await this.prisma.channelProduct.findFirst({
                where: {
                    channelId,
                    platformSku: item.platformSku,
                    isLinked: true,
                },
            });
            mappings.push(linked?.itemId || null);
        }
        return mappings;
    }
};
exports.ChannelSyncService = ChannelSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelSyncService.prototype, "autoSyncOrders", null);
exports.ChannelSyncService = ChannelSyncService = ChannelSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        channel_service_1.ChannelService])
], ChannelSyncService);
//# sourceMappingURL=channel-sync.service.js.map