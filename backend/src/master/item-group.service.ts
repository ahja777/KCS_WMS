import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemGroupDto, UpdateItemGroupDto } from './dto/item-group.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ItemGroupService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
      ];
    }

    const allowedSortFields = ['createdAt', 'code', 'name'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.itemGroup.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.itemGroup.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.itemGroup.findUnique({
      where: { id },
      include: { items: { select: { id: true, code: true, name: true } } },
    });
    if (!item) throw new NotFoundException('상품군을 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateItemGroupDto) {
    const existing = await this.prisma.itemGroup.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('이미 존재하는 상품군 코드입니다');

    return this.prisma.itemGroup.create({ data: dto });
  }

  async update(id: string, dto: UpdateItemGroupDto) {
    await this.findById(id);
    return this.prisma.itemGroup.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);

    const itemCount = await this.prisma.item.count({ where: { itemGroupId: id } });
    if (itemCount > 0) {
      throw new BadRequestException('해당 상품군에 연결된 품목이 있어 삭제할 수 없습니다');
    }

    return this.prisma.itemGroup.delete({ where: { id } });
  }
}
