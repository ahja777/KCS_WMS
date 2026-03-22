import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PartnerService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { type?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
      ];
    }
    if (query.type) {
      where.type = query.type;
    }

    const allowedSortFields = ['createdAt', 'code', 'name', 'type', 'status'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
      }),
      this.prisma.partner.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('거래처를 찾을 수 없습니다');
    return partner;
  }

  async create(dto: CreatePartnerDto) {
    const existing = await this.prisma.partner.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('이미 존재하는 거래처 코드입니다');
    return this.prisma.partner.create({ data: dto });
  }

  async update(id: string, dto: UpdatePartnerDto) {
    await this.findById(id);
    return this.prisma.partner.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);

    const inboundCount = await this.prisma.inboundOrder.count({ where: { partnerId: id } });
    if (inboundCount > 0) {
      throw new BadRequestException('해당 거래처에 연결된 입고 주문이 있어 삭제할 수 없습니다.');
    }
    const outboundCount = await this.prisma.outboundOrder.count({ where: { partnerId: id } });
    if (outboundCount > 0) {
      throw new BadRequestException('해당 거래처에 연결된 출고 주문이 있어 삭제할 수 없습니다.');
    }

    return this.prisma.partner.delete({ where: { id } });
  }
}
