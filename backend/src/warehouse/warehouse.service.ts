import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateZoneDto,
  UpdateZoneDto,
  CreateLocationDto,
  UpdateLocationDto,
} from './dto/warehouse.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  // ─── Warehouse ─────────────────────────────────────────

  async findAllWarehouses(query: PaginationDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { name: { contains: query.search } },
        { country: { contains: query.search } },
      ];
    }

    const allowedSortFields = ['createdAt', 'code', 'name', 'country', 'status'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        include: { _count: { select: { zones: true } } },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findWarehouseById(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        zones: { include: { _count: { select: { locations: true } } } },
      },
    });
    if (!warehouse) throw new NotFoundException('창고를 찾을 수 없습니다');
    return warehouse;
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('이미 존재하는 창고 코드입니다');
    return this.prisma.warehouse.create({ data: dto });
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto) {
    await this.findWarehouseById(id);
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async deleteWarehouse(id: string) {
    await this.findWarehouseById(id);

    const inboundCount = await this.prisma.inboundOrder.count({ where: { warehouseId: id } });
    if (inboundCount > 0) {
      throw new BadRequestException('해당 창고에 연결된 입고 주문이 있어 삭제할 수 없습니다.');
    }
    const outboundCount = await this.prisma.outboundOrder.count({ where: { warehouseId: id } });
    if (outboundCount > 0) {
      throw new BadRequestException('해당 창고에 연결된 출고 주문이 있어 삭제할 수 없습니다.');
    }
    const inventoryCount = await this.prisma.inventory.count({ where: { warehouseId: id } });
    if (inventoryCount > 0) {
      throw new BadRequestException('해당 창고에 연결된 재고가 있어 삭제할 수 없습니다.');
    }

    return this.prisma.warehouse.delete({ where: { id } });
  }

  // ─── Zone ─────────────────────────────────────────────

  async findZonesByWarehouse(warehouseId: string) {
    await this.findWarehouseById(warehouseId);
    return this.prisma.zone.findMany({
      where: { warehouseId },
      include: { _count: { select: { locations: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async findZoneById(warehouseId: string, zoneId: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, warehouseId },
      include: { locations: true },
    });
    if (!zone) throw new NotFoundException('구역을 찾을 수 없습니다');
    return zone;
  }

  async createZone(warehouseId: string, dto: CreateZoneDto) {
    await this.findWarehouseById(warehouseId);
    const existing = await this.prisma.zone.findUnique({
      where: { warehouseId_code: { warehouseId, code: dto.code } },
    });
    if (existing) throw new ConflictException('해당 창고에 이미 존재하는 구역 코드입니다');
    return this.prisma.zone.create({
      data: { ...dto, warehouseId },
    });
  }

  async updateZone(warehouseId: string, zoneId: string, dto: UpdateZoneDto) {
    await this.findZoneById(warehouseId, zoneId);
    return this.prisma.zone.update({ where: { id: zoneId }, data: dto });
  }

  async deleteZone(warehouseId: string, zoneId: string) {
    await this.findZoneById(warehouseId, zoneId);
    const inventoryCount = await this.prisma.inventory.count({
      where: { location: { zoneId } },
    });
    if (inventoryCount > 0) {
      throw new BadRequestException(`해당 구역에 재고가 ${inventoryCount}건 존재하여 삭제할 수 없습니다`);
    }
    return this.prisma.zone.delete({ where: { id: zoneId } });
  }

  // ─── Location ─────────────────────────────────────────

  async findLocationsByZone(warehouseId: string, zoneId: string) {
    await this.findZoneById(warehouseId, zoneId);
    return this.prisma.location.findMany({
      where: { zoneId },
      orderBy: { code: 'asc' },
    });
  }

  async createLocation(warehouseId: string, zoneId: string, dto: CreateLocationDto) {
    await this.findZoneById(warehouseId, zoneId);
    const existing = await this.prisma.location.findUnique({
      where: { zoneId_code: { zoneId, code: dto.code } },
    });
    if (existing) throw new ConflictException('해당 구역에 이미 존재하는 로케이션 코드입니다');
    return this.prisma.location.create({
      data: { ...dto, zoneId },
    });
  }

  async updateLocation(warehouseId: string, zoneId: string, locationId: string, dto: UpdateLocationDto) {
    const zone = await this.findZoneById(warehouseId, zoneId);
    const location = zone.locations?.find((l) => l.id === locationId);
    if (!location) throw new NotFoundException('로케이션을 찾을 수 없습니다');
    return this.prisma.location.update({ where: { id: locationId }, data: dto });
  }

  async deleteLocation(warehouseId: string, zoneId: string, locationId: string) {
    const zone = await this.findZoneById(warehouseId, zoneId);
    const location = zone.locations?.find((l) => l.id === locationId);
    if (!location) throw new NotFoundException('로케이션을 찾을 수 없습니다');
    const inventoryCount = await this.prisma.inventory.count({
      where: { locationId },
    });
    if (inventoryCount > 0) {
      throw new BadRequestException(`해당 로케이션에 재고가 ${inventoryCount}건 존재하여 삭제할 수 없습니다`);
    }
    return this.prisma.location.delete({ where: { id: locationId } });
  }
}
