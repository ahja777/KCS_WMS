import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInboundOrderDto,
  UpdateInboundOrderDto,
  ReceiveInboundDto,
} from './dto/inbound.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class InboundService {
  private readonly logger = new Logger(InboundService.name);

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

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const order = await this.prisma.inboundOrder.findUnique({
      where: { id },
      include: {
        partner: true,
        warehouse: true,
        items: { include: { item: true } },
        receipts: true,
      },
    });
    if (!order) throw new NotFoundException('입고 주문을 찾을 수 없습니다');
    return order;
  }

  private async generateOrderNumber(prefix: string): Promise<string> {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const todayPrefix = `${prefix}-${dateStr}`;

    const lastOrder = await this.prisma.inboundOrder.findFirst({
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

  async create(dto: CreateInboundOrderDto) {
    // H-12: Deadline check - reject if expectedDate is in the past
    const expectedDate = new Date(dto.expectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expectedDate < today) {
      throw new BadRequestException('입고 예정일이 과거입니다.');
    }

    // 주문번호 자동생성
    if (!dto.orderNumber) {
      dto.orderNumber = await this.generateOrderNumber('IB');
    }

    const existing = await this.prisma.inboundOrder.findUnique({
      where: { orderNumber: dto.orderNumber },
    });
    if (existing) throw new ConflictException('이미 존재하는 주문번호입니다');

    const { items, ...orderData } = dto;
    return this.prisma.inboundOrder.create({
      data: {
        ...orderData,
        orderNumber: dto.orderNumber!,
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

  async update(id: string, dto: UpdateInboundOrderDto) {
    const order = await this.findById(id);
    if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('현재 상태에서는 주문을 수정할 수 없습니다');
    }
    return this.prisma.inboundOrder.update({
      where: { id },
      data: {
        ...dto,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      },
    });
  }

  async delete(id: string) {
    const order = await this.findById(id);
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('임시저장 상태의 주문만 삭제할 수 있습니다');
    }
    return this.prisma.inboundOrder.delete({ where: { id } });
  }

  async confirm(id: string) {
    const order = await this.findById(id);
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('임시저장 상태의 주문만 확정할 수 있습니다');
    }
    return this.prisma.inboundOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { items: { include: { item: true } }, partner: true, warehouse: true },
    });
  }

  async markArrived(id: string) {
    const order = await this.findById(id);
    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException('확정된 주문만 도착 처리할 수 있습니다');
    }
    return this.prisma.inboundOrder.update({
      where: { id },
      data: { status: 'ARRIVED', arrivedDate: new Date() },
      include: { items: { include: { item: true } }, partner: true, warehouse: true },
    });
  }

  async cancel(id: string) {
    const order = await this.findById(id);
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('완료 또는 이미 취소된 주문은 취소할 수 없습니다');
    }
    if (order.status === 'RECEIVING') {
      throw new BadRequestException('입고 진행 중인 주문은 취소할 수 없습니다');
    }
    return this.prisma.inboundOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: { include: { item: true } }, partner: true, warehouse: true },
    });
  }

  async receive(id: string, dto: ReceiveInboundDto) {
    const order = await this.findById(id);
    if (!['ARRIVED', 'RECEIVING'].includes(order.status)) {
      throw new BadRequestException('도착 또는 입고 중 상태의 주문만 입고 처리할 수 있습니다');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update order status to RECEIVING
      await tx.inboundOrder.update({
        where: { id },
        data: { status: 'RECEIVING' },
      });

      // H-13: Expiry date validation
      // NOTE: expiryDate is tracked at the Inventory level, not on InboundOrderItem.
      // When receiving FOOD-category items, expiry date should be validated here.
      // Currently the ReceiveInboundDto does not carry expiryDate per item.
      // TODO: Add expiryDate to the receive DTO and, for FOOD-category items,
      //       log a warning if expiryDate is missing and attach a note to the receipt.
      //       For expiryControl-enabled items, validate that expiryDate is in the future.

      // Process each received item
      for (const receiveItem of dto.items) {
        const orderItem = await tx.inboundOrderItem.findUnique({
          where: { id: receiveItem.inboundOrderItemId },
          include: { item: true },
        });
        if (!orderItem) {
          throw new NotFoundException(`주문 항목 ${receiveItem.inboundOrderItemId}을(를) 찾을 수 없습니다`);
        }

        // Warn if over-receiving (receive more than expected)
        const totalReceived = orderItem.receivedQty + receiveItem.receivedQty;
        if (totalReceived > orderItem.expectedQty) {
          this.logger.warn(
            `Over-receiving item ${orderItem.item.code}: ` +
            `expected=${orderItem.expectedQty}, will have received=${totalReceived}`,
          );
        }

        // Update received qty on order item
        await tx.inboundOrderItem.update({
          where: { id: receiveItem.inboundOrderItemId },
          data: {
            receivedQty: { increment: receiveItem.receivedQty },
            damagedQty: { increment: receiveItem.damagedQty || 0 },
          },
        });

        // Resolve locationId from locationCode
        let locationId: string | null = null;
        if (receiveItem.locationCode) {
          const location = await tx.location.findFirst({
            where: {
              code: receiveItem.locationCode,
              zone: { warehouseId: order.warehouseId },
            },
          });
          if (!location) {
            throw new BadRequestException(
              `Location code '${receiveItem.locationCode}' not found in the warehouse`,
            );
          }
          locationId = location.id;
        }

        // Update or create inventory
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
        } else {
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

        // Create inventory transaction
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

      // Create receipt record
      await tx.inboundReceipt.create({
        data: {
          inboundOrderId: id,
          receivedBy: dto.receivedBy,
          notes: `Received ${dto.items.length} line items`,
        },
      });

      // Check if all items are fully received
      const updatedItems = await tx.inboundOrderItem.findMany({
        where: { inboundOrderId: id },
      });
      const allReceived = updatedItems.every(
        (item) => item.receivedQty >= item.expectedQty,
      );

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
}
