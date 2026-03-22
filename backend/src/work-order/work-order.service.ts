import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { type?: string; status?: string; warehouseId?: string }) {
    const where: any = {};

    if (query.type) where.workType = query.type;
    if (query.status) where.status = query.status;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    const allowedSortFields = ['createdAt', 'workType', 'status', 'startedAt'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          items: true,
        },
      }),
      this.prisma.workOrder.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        items: true,
      },
    });
    if (!item) throw new NotFoundException('작업지시서를 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateWorkOrderDto) {
    const { items, ...workOrderData } = dto;

    return this.prisma.workOrder.create({
      data: {
        ...workOrderData,
        items: items?.length
          ? { create: items }
          : undefined,
      },
      include: { items: true },
    });
  }

  async assign(id: string, assignedTo?: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'CREATED') {
      throw new BadRequestException('CREATED 상태에서만 배정할 수 있습니다');
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        assignedTo: assignedTo || existing.assignedTo,
      },
    });
  }

  async start(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'CREATED' && existing.status !== 'ASSIGNED') {
      throw new BadRequestException('CREATED 또는 ASSIGNED 상태에서만 시작할 수 있습니다');
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  async complete(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'IN_PROGRESS') {
      throw new BadRequestException('IN_PROGRESS 상태에서만 완료할 수 있습니다');
    }

    return this.prisma.workOrder.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
}
