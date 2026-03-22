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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStatistics(warehouseId) {
        const warehouseFilter = warehouseId ? { warehouseId } : {};
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const [inventorySummary, uniqueItems, inboundByStatus, outboundByStatus, recentInbound, recentOutbound, pendingInbound, pendingOutbound, warehouseCount, recentTransactions,] = await Promise.all([
            this.prisma.inventory.aggregate({
                where: warehouseFilter,
                _sum: {
                    quantity: true,
                    reservedQty: true,
                    availableQty: true,
                },
                _count: true,
            }),
            this.prisma.inventory.groupBy({
                by: ['itemId'],
                where: { ...warehouseFilter, quantity: { gt: 0 } },
            }),
            this.prisma.inboundOrder.groupBy({
                by: ['status'],
                where: warehouseFilter,
                _count: true,
            }),
            this.prisma.outboundOrder.groupBy({
                by: ['status'],
                where: warehouseFilter,
                _count: true,
            }),
            this.prisma.inboundOrder.count({
                where: { ...warehouseFilter, createdAt: { gte: sevenDaysAgo } },
            }),
            this.prisma.outboundOrder.count({
                where: { ...warehouseFilter, createdAt: { gte: sevenDaysAgo } },
            }),
            this.prisma.inboundOrder.count({
                where: { ...warehouseFilter, status: { in: ['CONFIRMED', 'ARRIVED'] } },
            }),
            this.prisma.outboundOrder.count({
                where: { ...warehouseFilter, status: { in: ['CONFIRMED', 'PICKING'] } },
            }),
            this.prisma.warehouse.count({ where: { status: 'ACTIVE' } }),
            this.prisma.inventoryTransaction.count({
                where: {
                    createdAt: { gte: oneDayAgo },
                    ...(warehouseId ? { warehouseId } : {}),
                },
            }),
        ]);
        const lowStockItems = await this.getLowStockItems(warehouseId);
        return {
            inventory: {
                totalQuantity: inventorySummary._sum.quantity || 0,
                reservedQuantity: inventorySummary._sum.reservedQty || 0,
                availableQuantity: inventorySummary._sum.availableQty || 0,
                inventoryRecords: inventorySummary._count,
                uniqueItemsInStock: uniqueItems.length,
            },
            inbound: {
                byStatus: inboundByStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
                recentCount: recentInbound,
                pendingCount: pendingInbound,
            },
            outbound: {
                byStatus: outboundByStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
                recentCount: recentOutbound,
                pendingCount: pendingOutbound,
            },
            alerts: {
                lowStockItems,
                recentTransactions,
            },
            warehouses: {
                activeCount: warehouseCount,
            },
        };
    }
    async getLowStockItems(warehouseId) {
        const activeItems = await this.prisma.item.findMany({
            where: { isActive: true, minStock: { gt: 0 } },
            select: { id: true, code: true, name: true, minStock: true },
        });
        if (activeItems.length === 0)
            return [];
        const itemIds = activeItems.map((i) => i.id);
        const stockByItem = await this.prisma.inventory.groupBy({
            by: ['itemId'],
            where: {
                itemId: { in: itemIds },
                ...(warehouseId ? { warehouseId } : {}),
            },
            _sum: { quantity: true },
        });
        const stockMap = new Map(stockByItem.map((s) => [s.itemId, s._sum.quantity || 0]));
        return activeItems
            .filter((item) => (stockMap.get(item.id) || 0) < item.minStock)
            .slice(0, 10)
            .map((item) => ({
            ...item,
            totalQty: stockMap.get(item.id) || 0,
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map