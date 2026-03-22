import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOutboundOrderDto,
  UpdateOutboundOrderDto,
  PickOutboundDto,
  ShipOutboundDto,
} from './dto/outbound.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class OutboundService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { status?: string; warehouseId?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

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

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const order = await this.prisma.outboundOrder.findUnique({
      where: { id },
      include: {
        partner: true,
        warehouse: true,
        items: { include: { item: true } },
        shipments: true,
      },
    });
    if (!order) throw new NotFoundException('출고 주문을 찾을 수 없습니다');
    return order;
  }

  private async generateOrderNumber(prefix: string): Promise<string> {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const todayPrefix = `${prefix}-${dateStr}`;

    const lastOrder = await this.prisma.outboundOrder.findFirst({
      where: { orderNumber: { startsWith: todayPrefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let nextSeq = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${todayPrefix}-${String(nextSeq).padStart(4, '0')}`;
  }

  async create(dto: CreateOutboundOrderDto) {
    // H-12: Deadline check - reject if shipDate is in the past
    if (dto.shipDate) {
      const shipDate = new Date(dto.shipDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (shipDate < today) {
        throw new BadRequestException('출하 예정일이 과거입니다.');
      }
    }

    // 주문번호 자동생성
    if (!dto.orderNumber) {
      dto.orderNumber = await this.generateOrderNumber('OB');
    }

    const existing = await this.prisma.outboundOrder.findUnique({
      where: { orderNumber: dto.orderNumber },
    });
    if (existing) throw new ConflictException('이미 존재하는 주문번호입니다');

    const { items, orderNumber, shipDate, ...orderData } = dto;
    return this.prisma.outboundOrder.create({
      data: {
        ...orderData,
        orderNumber: orderNumber!,
        shipDate: shipDate ? new Date(shipDate) : null,
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

  async update(id: string, dto: UpdateOutboundOrderDto) {
    const order = await this.findById(id);
    if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('현재 상태에서는 주문을 수정할 수 없습니다');
    }
    return this.prisma.outboundOrder.update({
      where: { id },
      data: {
        ...dto,
        shipDate: dto.shipDate ? new Date(dto.shipDate) : undefined,
      },
    });
  }

  async delete(id: string) {
    const order = await this.findById(id);
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('임시저장 상태의 주문만 삭제할 수 있습니다');
    }
    return this.prisma.outboundOrder.delete({ where: { id } });
  }

  async confirm(id: string) {
    const order = await this.findById(id);
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('임시저장 상태의 주문만 확정할 수 있습니다');
    }

    // Stock check + reservation inside a single transaction to prevent race conditions
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

      const stockMap = new Map(
        stockSummary.map((s) => [s.itemId, s._sum.availableQty || 0]),
      );

      for (const orderItem of order.items) {
        const available = stockMap.get(orderItem.itemId) || 0;
        if (available < orderItem.orderedQty) {
          throw new BadRequestException(
            `품목 ${orderItem.item.code}의 재고가 부족합니다. 가용: ${available}, 필요: ${orderItem.orderedQty}`,
          );
        }
      }

      for (const orderItem of order.items) {
        // Find inventory records and reserve
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
          if (remaining <= 0) break;
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

  async pick(id: string, dto: PickOutboundDto) {
    const order = await this.findById(id);
    if (!['CONFIRMED', 'PICKING'].includes(order.status)) {
      throw new BadRequestException('확정 또는 피킹 중 상태의 주문만 피킹 처리할 수 있습니다');
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
          throw new NotFoundException(`주문 항목 ${pickItem.outboundOrderItemId}을(를) 찾을 수 없습니다`);
        }

        const newPickedQty = orderItem.pickedQty + pickItem.pickedQty;
        if (newPickedQty > orderItem.orderedQty) {
          throw new BadRequestException(
            `항목 ${pickItem.outboundOrderItemId}의 피킹 수량이 주문 수량을 초과합니다. ` +
            `주문: ${orderItem.orderedQty}, 기피킹: ${orderItem.pickedQty}, 요청: ${pickItem.pickedQty}`,
          );
        }

        await tx.outboundOrderItem.update({
          where: { id: pickItem.outboundOrderItemId },
          data: { pickedQty: { increment: pickItem.pickedQty } },
        });
      }

      // Check if all items are picked
      const updatedItems = await tx.outboundOrderItem.findMany({
        where: { outboundOrderId: id },
      });
      const allPicked = updatedItems.every(
        (item) => item.pickedQty >= item.orderedQty,
      );

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

  async ship(id: string, dto: ShipOutboundDto) {
    const order = await this.findById(id);
    if (order.status !== 'PACKING') {
      throw new BadRequestException('포장 완료 상태의 주문만 출하 처리할 수 있습니다');
    }

    return this.prisma.$transaction(async (tx) => {
      // Deduct inventory
      for (const orderItem of order.items) {
        await tx.outboundOrderItem.update({
          where: { id: orderItem.id },
          data: { shippedQty: orderItem.pickedQty, packedQty: orderItem.pickedQty },
        });

        // Deduct from inventory
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
          if (remaining <= 0) break;
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

        // Create inventory transaction
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

      // Create shipment record
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

  async markDelivered(id: string) {
    const order = await this.findById(id);
    if (order.status !== 'SHIPPED') {
      throw new BadRequestException('출하 완료된 주문만 배송 완료 처리할 수 있습니다');
    }
    return this.prisma.outboundOrder.update({
      where: { id },
      data: { status: 'DELIVERED', deliveryDate: new Date(), completedDate: new Date() },
      include: { items: { include: { item: true } }, partner: true, warehouse: true },
    });
  }

  async cancel(id: string) {
    const order = await this.findById(id);
    if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('현재 상태에서는 주문을 취소할 수 없습니다');
    }

    // If confirmed or picking/packing, release reserved inventory
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
            if (remaining <= 0) break;
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
}
