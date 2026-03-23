import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStatistics(warehouseId?: string) {
    const warehouseFilter = warehouseId ? { warehouseId } : {};

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // [최적화] 독립 쿼리 8개를 Promise.all로 병렬 실행
    const [
      inventorySummary,
      uniqueItems,
      inboundByStatus,
      outboundByStatus,
      recentInbound,
      recentOutbound,
      pendingInbound,
      pendingOutbound,
      warehouseCount,
      recentTransactions,
    ] = await Promise.all([
      // 1. Inventory summary
      this.prisma.inventory.aggregate({
        where: warehouseFilter,
        _sum: {
          quantity: true,
          reservedQty: true,
          availableQty: true,
        },
        _count: true,
      }),

      // 2. Unique items in stock
      this.prisma.inventory.groupBy({
        by: ['itemId'],
        where: { ...warehouseFilter, quantity: { gt: 0 } },
      }),

      // 3. Inbound by status
      this.prisma.inboundOrder.groupBy({
        by: ['status'],
        where: warehouseFilter,
        _count: true,
      }),

      // 4. Outbound by status
      this.prisma.outboundOrder.groupBy({
        by: ['status'],
        where: warehouseFilter,
        _count: true,
      }),

      // 5. Recent inbound (7 days)
      this.prisma.inboundOrder.count({
        where: { ...warehouseFilter, createdAt: { gte: sevenDaysAgo } },
      }),

      // 6. Recent outbound (7 days)
      this.prisma.outboundOrder.count({
        where: { ...warehouseFilter, createdAt: { gte: sevenDaysAgo } },
      }),

      // 7. Pending inbound
      this.prisma.inboundOrder.count({
        where: { ...warehouseFilter, status: { in: ['CONFIRMED', 'ARRIVED'] } },
      }),

      // 8. Pending outbound
      this.prisma.outboundOrder.count({
        where: { ...warehouseFilter, status: { in: ['CONFIRMED', 'PICKING'] } },
      }),

      // 9. Warehouse count
      this.prisma.warehouse.count({ where: { status: 'ACTIVE' } }),

      // 10. Recent transactions (24h)
      this.prisma.inventoryTransaction.count({
        where: {
          createdAt: { gte: oneDayAgo },
          ...(warehouseId ? { warehouseId } : {}),
        },
      }),
    ]);

    // [최적화] Low stock alerts - N+1 → 2 쿼리로 해결
    const lowStockItems = await this.getLowStockItems(warehouseId);

    // 배차 요약
    const dispatchSummary = await this.getDispatchSummary(warehouseId);

    return {
      inventory: {
        totalQuantity: inventorySummary._sum.quantity || 0,
        reservedQuantity: inventorySummary._sum.reservedQty || 0,
        availableQuantity: inventorySummary._sum.availableQty || 0,
        inventoryRecords: inventorySummary._count,
        uniqueItemsInStock: uniqueItems.length,
      },
      inbound: {
        byStatus: inboundByStatus.reduce(
          (acc, item) => ({ ...acc, [item.status]: item._count }),
          {},
        ),
        recentCount: recentInbound,
        pendingCount: pendingInbound,
      },
      outbound: {
        byStatus: outboundByStatus.reduce(
          (acc, item) => ({ ...acc, [item.status]: item._count }),
          {},
        ),
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
      dispatch: dispatchSummary,
    };
  }

  private async getDispatchSummary(warehouseId?: string) {
    const warehouseFilter = warehouseId ? { warehouseId } : {};
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const [byStatus, todayDispatches] = await Promise.all([
      this.prisma.dispatch.groupBy({
        by: ['status'],
        where: warehouseFilter,
        _count: true,
      }),
      this.prisma.dispatch.findMany({
        where: {
          ...warehouseFilter,
          dispatchDate: { gte: oneMonthAgo, lt: tomorrow },
        },
        orderBy: { dispatchDate: 'asc' },
        take: 10,
        include: {
          warehouse: { select: { name: true, code: true } },
          vehicle: { select: { plateNo: true, driverName: true } },
          items: { select: { itemName: true, orderedQty: true, dispatchedQty: true } },
        },
      }),
    ]);

    const statusCounts = byStatus.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count }),
      {} as Record<string, number>,
    );

    const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      statusCounts,
      totalCount,
      todayDispatches,
    };
  }

  /**
   * [최적화] N+1 쿼리 제거
   * Before: activeItems 수만큼 개별 aggregate 쿼리 (최대 수백 건)
   * After: 2 쿼리로 해결 (items + groupBy inventory)
   */
  private async getLowStockItems(warehouseId?: string) {
    const activeItems = await this.prisma.item.findMany({
      where: { isActive: true, minStock: { gt: 0 } },
      select: { id: true, code: true, name: true, minStock: true },
    });

    if (activeItems.length === 0) return [];

    const itemIds = activeItems.map((i) => i.id);

    const stockByItem = await this.prisma.inventory.groupBy({
      by: ['itemId'],
      where: {
        itemId: { in: itemIds },
        ...(warehouseId ? { warehouseId } : {}),
      },
      _sum: { quantity: true },
    });

    const stockMap = new Map(
      stockByItem.map((s) => [s.itemId, s._sum.quantity || 0]),
    );

    return activeItems
      .filter((item) => (stockMap.get(item.id) || 0) < item.minStock)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        totalQty: stockMap.get(item.id) || 0,
      }));
  }
}
