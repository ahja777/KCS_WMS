import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { plateNo: { contains: query.search } },
        { driverName: { contains: query.search } },
        { driverPhone: { contains: query.search } },
      ];
    }

    const allowedSortFields = ['createdAt', 'plateNo', 'tonnage', 'driverName'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        include: { warehouse: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findById(id: string) {
    const item = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
    if (!item) throw new NotFoundException('차량을 찾을 수 없습니다');
    return item;
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { plateNo: dto.plateNo },
    });
    if (existing) throw new ConflictException('이미 등록된 차량번호입니다');

    return this.prisma.vehicle.create({ data: dto });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findById(id);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);

    const dispatchCount = await this.prisma.dispatch.count({ where: { vehicleId: id } });
    if (dispatchCount > 0) {
      throw new BadRequestException('해당 차량에 연결된 배차가 있어 삭제할 수 없습니다');
    }

    return this.prisma.vehicle.delete({ where: { id } });
  }
}
