import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContainerGroupDto, UpdateContainerGroupDto } from './dto/container.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ContainerGroupService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { groupCode: { contains: query.search } },
        { groupName: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.containerGroup.findMany({
        where, skip: query.skip, take: query.take,
        orderBy: { createdAt: 'desc' },
        include: { containers: { select: { id: true, containerCode: true, containerName: true } } },
      }),
      this.prisma.containerGroup.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.containerGroup.findUnique({
      where: { id }, include: { containers: true },
    });
    if (!item) throw new NotFoundException('물류용기군을 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateContainerGroupDto) {
    const existing = await this.prisma.containerGroup.findUnique({ where: { groupCode: dto.groupCode } });
    if (existing) throw new ConflictException('이미 등록된 용기군코드입니다');
    return this.prisma.containerGroup.create({ data: dto });
  }

  async update(id: string, dto: UpdateContainerGroupDto) {
    await this.findById(id);
    return this.prisma.containerGroup.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    const cnt = await this.prisma.container.count({ where: { containerGroupId: id } });
    if (cnt > 0) throw new ConflictException('해당 용기군에 연결된 용기가 있어 삭제할 수 없습니다');
    return this.prisma.containerGroup.delete({ where: { id } });
  }
}
