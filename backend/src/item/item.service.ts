import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ItemService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { category?: string; isActive?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
        { barcode: { contains: query.search } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const allowedSortFields = ['createdAt', 'code', 'name', 'barcode', 'category', 'status'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
      }),
      this.prisma.item.count({ where }),
    ]);

    return new PaginatedResult(data, total, page, limit);
  }

  async findById(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('품목을 찾을 수 없습니다');
    return item;
  }

  async findByCode(code: string) {
    const item = await this.prisma.item.findUnique({ where: { code } });
    if (!item) throw new NotFoundException('품목을 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateItemDto) {
    const existing = await this.prisma.item.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('이미 존재하는 품목 코드입니다');

    if (dto.barcode) {
      const barcodeExists = await this.prisma.item.findUnique({
        where: { barcode: dto.barcode },
      });
      if (barcodeExists) throw new ConflictException('이미 존재하는 바코드입니다');
    }

    return this.prisma.item.create({ data: dto });
  }

  async update(id: string, dto: UpdateItemDto) {
    await this.findById(id);
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);

    const inboundItemCount = await this.prisma.inboundOrderItem.count({ where: { itemId: id } });
    if (inboundItemCount > 0) {
      throw new BadRequestException('해당 품목에 연결된 입고 주문 항목이 있어 삭제할 수 없습니다.');
    }
    const outboundItemCount = await this.prisma.outboundOrderItem.count({ where: { itemId: id } });
    if (outboundItemCount > 0) {
      throw new BadRequestException('해당 품목에 연결된 출고 주문 항목이 있어 삭제할 수 없습니다.');
    }
    const inventoryCount = await this.prisma.inventory.count({ where: { itemId: id } });
    if (inventoryCount > 0) {
      throw new BadRequestException('해당 품목에 연결된 재고가 있어 삭제할 수 없습니다.');
    }

    return this.prisma.item.delete({ where: { id } });
  }
}
