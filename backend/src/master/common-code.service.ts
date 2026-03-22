import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommonCodeDto, UpdateCommonCodeDto } from './dto/common-code.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CommonCodeService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { groupCode?: string }) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { codeType: { contains: query.search } },
        { typeNm: { contains: query.search } },
        { code: { contains: query.search } },
        { codeNm: { contains: query.search } },
      ];
    }

    if (query.groupCode) {
      where.codeType = query.groupCode;
    }

    const allowedSortFields = ['createdAt', 'codeType', 'code', 'sortOrder'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.commonCode.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
      }),
      this.prisma.commonCode.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.commonCode.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('공통코드를 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateCommonCodeDto) {
    const existing = await this.prisma.commonCode.findUnique({
      where: { codeType_code: { codeType: dto.codeType, code: dto.code } },
    });
    if (existing) throw new ConflictException('이미 존재하는 공통코드입니다');

    return this.prisma.commonCode.create({ data: dto });
  }

  async update(id: string, dto: UpdateCommonCodeDto) {
    await this.findById(id);
    return this.prisma.commonCode.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.commonCode.delete({ where: { id } });
  }
}
