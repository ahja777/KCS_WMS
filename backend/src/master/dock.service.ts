import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDockDto, UpdateDockDto } from './dto/dock.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class DockService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { warehouseId?: string }) {
    const where: any = {};

    if (query.warehouseId) {
      where.warehouseId = query.warehouseId;
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
      ];
    }

    const allowedSortFields = ['createdAt', 'code', 'name', 'sortOrder'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'sortOrder';

    const [data, total] = await Promise.all([
      this.prisma.dock.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'asc' },
        include: { warehouse: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.dock.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.dock.findUnique({
      where: { id },
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
    if (!item) throw new NotFoundException('도크를 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateDockDto) {
    const existing = await this.prisma.dock.findUnique({
      where: { warehouseId_code: { warehouseId: dto.warehouseId, code: dto.code } },
    });
    if (existing) throw new ConflictException('해당 창고에 이미 존재하는 도크 코드입니다');

    return this.prisma.dock.create({ data: dto });
  }

  async update(id: string, dto: UpdateDockDto) {
    await this.findById(id);
    return this.prisma.dock.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.dock.delete({ where: { id } });
  }
}
