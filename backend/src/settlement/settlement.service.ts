import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class SettlementService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { status?: string; partnerId?: string; warehouseId?: string }) {
    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.partnerId) where.partnerId = query.partnerId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    if (query.search) {
      where.OR = [
        { warehouse: { name: { contains: query.search } } },
        { notes: { contains: query.search } },
      ];
    }

    const allowedSortFields = ['createdAt', 'periodStart', 'periodEnd', 'totalAmount', 'status'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          partner: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.settlement.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        partner: { select: { id: true, name: true, code: true } },
        details: { orderBy: { workDate: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('정산을 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateSettlementDto) {
    const { details, ...settlementData } = dto;

    return this.prisma.settlement.create({
      data: {
        ...settlementData,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        details: details?.length
          ? {
              create: details.map((d) => ({
                ...d,
                workDate: new Date(d.workDate),
              })),
            }
          : undefined,
      },
      include: { details: true },
    });
  }

  async update(id: string, dto: UpdateSettlementDto) {
    const existing = await this.findById(id);
    if (existing.status === 'CONFIRMED' || existing.status === 'INVOICED') {
      throw new BadRequestException('확정/청구 상태의 정산은 수정할 수 없습니다');
    }

    const { details, ...settlementData } = dto;
    const updateData: any = { ...settlementData };
    if (dto.periodStart) updateData.periodStart = new Date(dto.periodStart);
    if (dto.periodEnd) updateData.periodEnd = new Date(dto.periodEnd);

    if (details) {
      // 트랜잭션으로 기존 상세 삭제 후 재생성
      return this.prisma.$transaction(async (tx) => {
        await tx.settlementDetail.deleteMany({ where: { settlementId: id } });
        updateData.details = {
          create: details.map((d) => ({
            ...d,
            workDate: new Date(d.workDate),
          })),
        };
        return tx.settlement.update({
          where: { id },
          data: updateData,
          include: { details: true },
        });
      });
    }

    return this.prisma.settlement.update({
      where: { id },
      data: updateData,
      include: { details: true },
    });
  }

  async confirm(id: string) {
    const existing = await this.findById(id);
    if (existing.status !== 'DRAFT' && existing.status !== 'CALCULATED') {
      throw new BadRequestException('DRAFT 또는 CALCULATED 상태에서만 확정할 수 있습니다');
    }

    return this.prisma.settlement.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (existing.status === 'CONFIRMED' || existing.status === 'INVOICED') {
      throw new BadRequestException('확정/청구 상태의 정산은 삭제할 수 없습니다');
    }

    return this.prisma.settlement.delete({ where: { id } });
  }
}
