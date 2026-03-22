import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDispatchDto, UpdateDispatchDto } from './dto/dispatch.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { status?: string; warehouseId?: string; date?: string }) {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.date) {
      const d = new Date(query.date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.dispatchDate = { gte: d, lt: nextDay };
    }

    const allowedSortFields = ['createdAt', 'dispatchDate', 'status', 'dispatchSeq'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.dispatch.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          vehicle: { select: { id: true, plateNo: true, driverName: true } },
          items: true,
        },
      }),
      this.prisma.dispatch.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.dispatch.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        vehicle: true,
        inboundOrder: { select: { id: true, orderNumber: true, status: true } },
        items: true,
      },
    });
    if (!item) throw new NotFoundException('배차를 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateDispatchDto) {
    const { items, ...dispatchData } = dto;

    return this.prisma.dispatch.create({
      data: {
        ...dispatchData,
        dispatchDate: new Date(dto.dispatchDate),
        items: items?.length
          ? { create: items }
          : undefined,
      },
      include: { items: true },
    });
  }

  async update(id: string, dto: UpdateDispatchDto) {
    const existing = await this.findById(id);
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestException('완료/취소 상태의 배차는 수정할 수 없습니다');
    }

    const { items, ...dispatchData } = dto;
    const updateData: any = { ...dispatchData };
    if (dto.dispatchDate) updateData.dispatchDate = new Date(dto.dispatchDate);

    if (items) {
      await this.prisma.dispatchItem.deleteMany({ where: { dispatchId: id } });
      updateData.items = { create: items };
    }

    return this.prisma.dispatch.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  async start(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'PLANNED' && existing.status !== 'ASSIGNED') {
      throw new BadRequestException('PLANNED 또는 ASSIGNED 상태에서만 시작할 수 있습니다');
    }

    return this.prisma.dispatch.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async complete(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'IN_PROGRESS') {
      throw new BadRequestException('IN_PROGRESS 상태에서만 완료할 수 있습니다');
    }

    return this.prisma.dispatch.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'PLANNED') {
      throw new BadRequestException('PLANNED 상태에서만 삭제할 수 있습니다');
    }

    return this.prisma.dispatch.delete({ where: { id } });
  }
}
