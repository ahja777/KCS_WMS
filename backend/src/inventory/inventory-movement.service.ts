import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementDto } from './dto/inventory-movement.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class InventoryMovementService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { status?: string; warehouseId?: string }) {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    const allowedSortFields = ['createdAt', 'movementDate', 'status'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        include: { items: true },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.inventoryMovement.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!item) throw new NotFoundException('재고이동을 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateInventoryMovementDto) {
    const { items, ...movementData } = dto;

    return this.prisma.inventoryMovement.create({
      data: {
        ...movementData,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
  }

  async start(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('DRAFT 상태에서만 시작할 수 있습니다');
    }

    return this.prisma.inventoryMovement.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async complete(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'IN_PROGRESS') {
      throw new BadRequestException('IN_PROGRESS 상태에서만 완료할 수 있습니다');
    }

    return this.prisma.inventoryMovement.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }
}
