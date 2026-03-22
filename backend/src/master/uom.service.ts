import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUomMasterDto, UpdateUomMasterDto, CreateUomConversionDto } from './dto/uom.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class UomService {
  constructor(private prisma: PrismaService) {}

  // ─── UOM Master ──────────────────────────────────────

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
      this.prisma.uomMaster.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
      }),
      this.prisma.uomMaster.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.uomMaster.findUnique({
      where: { id },
      include: {
        conversionsFrom: {
          include: { toUom: true, item: { select: { id: true, code: true, name: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException('UOM을 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateUomMasterDto) {
    const existing = await this.prisma.uomMaster.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('이미 존재하는 UOM 코드입니다');

    return this.prisma.uomMaster.create({ data: dto });
  }

  async update(id: string, dto: UpdateUomMasterDto) {
    await this.findById(id);
    return this.prisma.uomMaster.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);

    const convCount = await this.prisma.uomConversion.count({
      where: { OR: [{ fromUomId: id }, { toUomId: id }] },
    });
    if (convCount > 0) {
      throw new BadRequestException('해당 UOM에 연결된 환산 정보가 있어 삭제할 수 없습니다');
    }

    return this.prisma.uomMaster.delete({ where: { id } });
  }

  // ─── UOM Conversion ──────────────────────────────────

  async findConversions(uomId: string) {
    await this.findById(uomId);
    return this.prisma.uomConversion.findMany({
      where: { fromUomId: uomId },
      include: {
        toUom: true,
        item: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async createConversion(uomId: string, dto: CreateUomConversionDto) {
    await this.findById(uomId);

    // toUom 존재 확인
    const toUom = await this.prisma.uomMaster.findUnique({ where: { id: dto.toUomId } });
    if (!toUom) throw new NotFoundException('변환 대상 UOM을 찾을 수 없습니다');

    return this.prisma.uomConversion.create({
      data: {
        fromUomId: uomId,
        toUomId: dto.toUomId,
        convQty: dto.convQty,
        itemId: dto.itemId || null,
        startDate: dto.startDate || null,
        endDate: dto.endDate || null,
      },
    });
  }
}
