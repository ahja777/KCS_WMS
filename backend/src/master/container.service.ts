import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContainerDto, UpdateContainerDto } from './dto/container.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ContainerService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { containerCode: { contains: query.search } },
        { containerName: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.container.findMany({
        where, skip: query.skip, take: query.take,
        orderBy: { createdAt: 'desc' },
        include: {
          containerGroup: { select: { id: true, groupCode: true, groupName: true } },
          partner: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.container.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.container.findUnique({
      where: { id },
      include: { containerGroup: true, partner: { select: { id: true, code: true, name: true } } },
    });
    if (!item) throw new NotFoundException('물류용기를 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateContainerDto) {
    const existing = await this.prisma.container.findUnique({ where: { containerCode: dto.containerCode } });
    if (existing) throw new ConflictException('이미 등록된 용기코드입니다');
    return this.prisma.container.create({ data: dto });
  }

  async update(id: string, dto: UpdateContainerDto) {
    await this.findById(id);
    return this.prisma.container.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.container.delete({ where: { id } });
  }
}
