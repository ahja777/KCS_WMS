import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelService } from './channel.service';
import { SyncType, SyncDirection, ChannelOrderStatus } from '@prisma/client';

@Injectable()
export class ChannelSyncService {
  private readonly logger = new Logger(ChannelSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelService: ChannelService,
  ) {}

  /**
   * 주문 수동 동기화
   */
  async syncOrders(channelId: string, fromDate?: string, toDate?: string) {
    const channel = await this.prisma.salesChannel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    const adapter = this.channelService.getAdapter(channel.platform);
    const credentials = channel.credentials as Record<string, string>;

    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 24 * 3600000);
    const to = toDate ? new Date(toDate) : new Date();

    // 동기화 로그 시작
    const syncLog = await this.prisma.channelSyncLog.create({
      data: {
        channelId,
        syncType: SyncType.ORDER_PULL,
        direction: SyncDirection.INBOUND,
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
          // 중복 체크
          const existing = await this.prisma.channelOrder.findUnique({
            where: {
              channelId_platformOrderId: {
                channelId,
                platformOrderId: order.platformOrderId,
              },
            },
          });

          if (existing) {
            this.logger.debug(
              `주문 이미 존재: ${order.platformOrderId}`,
            );
            continue;
          }

          // SKU 매핑으로 WMS 품목 연결
          const itemMappings = await this.resolveItemMappings(
            channelId,
            order.items,
          );

          await this.prisma.channelOrder.create({
            data: {
              channelId,
              platformOrderId: order.platformOrderId,
              platformOrderNo: order.platformOrderNo,
              status: ChannelOrderStatus.NEW,
              orderDate: order.orderDate,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              shippingAddress: order.shippingAddress,
              shippingZipCode: order.shippingZipCode,
              shippingMethod: order.shippingMethod,
              totalAmount: order.totalAmount,
              currency: order.currency,
              rawData: order.rawData as any,
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
        } catch (err) {
          errorCount++;
          errorDetail += `주문 ${order.platformOrderId}: ${err.message}\n`;
          this.logger.warn(
            `주문 저장 실패 (${order.platformOrderId}): ${err.message}`,
          );
        }
      }

      // 채널 마지막 동기화 시각 업데이트
      await this.prisma.salesChannel.update({
        where: { id: channelId },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: errorCount > 0 ? `${errorCount}건 오류` : null,
          status: 'ACTIVE',
        },
      });
    } catch (err) {
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

    // 동기화 로그 완료
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

  /**
   * 배송 확인 전송
   */
  async confirmShipment(
    channelOrderId: string,
    carrier: string,
    trackingNumber: string,
  ) {
    const channelOrder = await this.prisma.channelOrder.findUnique({
      where: { id: channelOrderId },
      include: { channel: true },
    });
    if (!channelOrder) throw new NotFoundException('채널 주문을 찾을 수 없습니다.');

    const adapter = this.channelService.getAdapter(channelOrder.channel.platform);
    const credentials = channelOrder.channel.credentials as Record<string, string>;

    const success = await adapter.confirmShipment(credentials, {
      platformOrderId: channelOrder.platformOrderId,
      carrier,
      trackingNumber,
    });

    if (success) {
      await this.prisma.channelOrder.update({
        where: { id: channelOrderId },
        data: {
          status: ChannelOrderStatus.SHIPPED,
          carrier,
          trackingNumber,
          shippedAt: new Date(),
        },
      });
    }

    return { success, channelOrderId };
  }

  /**
   * 재고 동기화 (WMS → 채널)
   */
  async syncInventory(channelId: string) {
    const channel = await this.prisma.salesChannel.findUnique({
      where: { id: channelId },
      include: {
        channelProducts: {
          where: { isLinked: true },
          include: { item: true },
        },
      },
    });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    const adapter = this.channelService.getAdapter(channel.platform);
    const credentials = channel.credentials as Record<string, string>;

    // WMS 재고 조회
    const itemIds = channel.channelProducts.map((cp) => cp.itemId);
    const inventories = await this.prisma.inventory.groupBy({
      by: ['itemId'],
      where: {
        itemId: { in: itemIds },
        warehouseId: channel.warehouseId,
      },
      _sum: { availableQty: true },
    });

    const inventoryMap = new Map(
      inventories.map((inv) => [inv.itemId, inv._sum.availableQty || 0]),
    );

    const updateItems = channel.channelProducts
      .filter((cp) => cp.platformSku)
      .map((cp) => ({
        platformSku: cp.platformSku!,
        quantity: inventoryMap.get(cp.itemId) || 0,
      }));

    if (updateItems.length === 0) {
      return { success: 0, failed: 0, total: 0 };
    }

    // 동기화 로그
    const syncLog = await this.prisma.channelSyncLog.create({
      data: {
        channelId,
        syncType: SyncType.INVENTORY_PUSH,
        direction: SyncDirection.OUTBOUND,
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

    // 상품별 lastSyncAt 업데이트
    await this.prisma.channelProduct.updateMany({
      where: { channelId, isLinked: true },
      data: { lastSyncAt: new Date() },
    });

    return { ...result, total: updateItems.length };
  }

  /**
   * 채널 주문 목록 조회
   */
  async getChannelOrders(
    channelId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: ChannelOrderStatus;
    },
  ) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { channelId };
    if (params?.status) where.status = params.status;

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

  /**
   * 모든 채널 주문 조회 (채널 무관)
   */
  async getAllChannelOrders(params?: {
    page?: number;
    limit?: number;
    status?: ChannelOrderStatus;
    platform?: string;
    search?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.status) where.status = params.status;
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

  /**
   * 채널 상품 매핑
   */
  async linkProduct(
    channelId: string,
    itemId: string,
    platformProductId?: string,
    platformSku?: string,
  ) {
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

  async unlinkProduct(channelId: string, itemId: string) {
    return this.prisma.channelProduct.update({
      where: { channelId_itemId: { channelId, itemId } },
      data: { isLinked: false },
    });
  }

  async getLinkedProducts(channelId: string) {
    return this.prisma.channelProduct.findMany({
      where: { channelId },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 채널 상품 동기화 (플랫폼에서 가져오기)
   */
  async fetchChannelProducts(channelId: string) {
    const channel = await this.prisma.salesChannel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    const adapter = this.channelService.getAdapter(channel.platform);
    const credentials = channel.credentials as Record<string, string>;

    const products = await adapter.fetchProducts(credentials);
    return products;
  }

  /**
   * 자동 주문 동기화 (스케줄)
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async autoSyncOrders() {
    const channels = await this.prisma.salesChannel.findMany({
      where: {
        syncEnabled: true,
        status: 'ACTIVE',
      },
    });

    for (const channel of channels) {
      // syncInterval 체크
      if (channel.lastSyncAt) {
        const elapsed = Date.now() - channel.lastSyncAt.getTime();
        if (elapsed < channel.syncInterval * 60000) continue;
      }

      try {
        this.logger.log(
          `자동 주문 동기화 시작: ${channel.name} (${channel.platform})`,
        );
        await this.syncOrders(channel.id);
      } catch (err) {
        this.logger.error(
          `자동 주문 동기화 실패 (${channel.name}): ${err.message}`,
        );
      }
    }
  }

  /**
   * SKU 기반 WMS 품목 매핑
   */
  private async resolveItemMappings(
    channelId: string,
    items: Array<{ platformSku?: string }>,
  ): Promise<(string | null)[]> {
    const mappings: (string | null)[] = [];

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
}
