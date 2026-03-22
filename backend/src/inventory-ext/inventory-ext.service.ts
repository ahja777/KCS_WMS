import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import {
  CreateOwnershipTransferDto, UpdateOwnershipTransferDto,
  CreateAssemblyDto, UpdateAssemblyDto, CreateAssemblyItemDto,
  CreateStockTransferDto, UpdateStockTransferDto,
  CreatePeriodCloseDto,
  CreateLocationProductDto, UpdateLocationProductDto,
  CreateSetItemDto, CreatePartnerProductDto,
} from './dto/inventory-ext.dto';

@Injectable()
export class InventoryExtService {
  constructor(private prisma: PrismaService) {}

  // === 명의변경 ===
  async findAllOwnershipTransfers(query: PaginationDto) {
    const where: any = {};
    if (query.search) { where.workNumber = { contains: query.search }; }
    const [data, total] = await Promise.all([
      this.prisma.ownershipTransfer.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' } }),
      this.prisma.ownershipTransfer.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async createOwnershipTransfer(dto: CreateOwnershipTransferDto) {
    return this.prisma.ownershipTransfer.create({ data: { ...dto, workDate: new Date(dto.workDate) } });
  }

  async updateOwnershipTransfer(id: string, dto: UpdateOwnershipTransferDto) {
    const data: any = { ...dto };
    if (dto.workDate) data.workDate = new Date(dto.workDate);
    return this.prisma.ownershipTransfer.update({ where: { id }, data });
  }

  async deleteOwnershipTransfer(id: string) {
    return this.prisma.ownershipTransfer.delete({ where: { id } });
  }

  // === 임가공/조립 ===
  async findAllAssemblies(query: PaginationDto) {
    const where: any = {};
    if (query.search) { where.workNumber = { contains: query.search }; }
    const [data, total] = await Promise.all([
      this.prisma.assembly.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' }, include: { items: true } }),
      this.prisma.assembly.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async findAssemblyById(id: string) {
    const item = await this.prisma.assembly.findUnique({ where: { id }, include: { items: true } });
    if (!item) throw new NotFoundException('임가공 작업을 찾을 수 없습니다');
    return item;
  }

  async createAssembly(dto: CreateAssemblyDto) {
    const data: any = { ...dto };
    if (dto.workDate) data.workDate = new Date(dto.workDate);
    return this.prisma.assembly.create({ data });
  }

  async addAssemblyItem(dto: CreateAssemblyItemDto) {
    return this.prisma.assemblyItem.create({ data: dto });
  }

  async deleteAssembly(id: string) {
    return this.prisma.assembly.delete({ where: { id } });
  }

  // === 재고이동 ===
  async findAllStockTransfers(query: PaginationDto) {
    const where: any = {};
    if (query.search) { where.fromLocationCode = { contains: query.search }; }
    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' } }),
      this.prisma.stockTransfer.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async createStockTransfer(dto: CreateStockTransferDto) {
    return this.prisma.stockTransfer.create({ data: dto });
  }

  async updateStockTransfer(id: string, dto: UpdateStockTransferDto) {
    return this.prisma.stockTransfer.update({ where: { id }, data: dto });
  }

  async completeStockTransfer(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('재고이동 내역을 찾을 수 없습니다');
    if (transfer.status === 'COMPLETED') throw new BadRequestException('이미 완료된 재고이동입니다');
    if (transfer.status === 'CANCELLED') throw new BadRequestException('취소된 재고이동은 완료할 수 없습니다');
    return this.prisma.stockTransfer.update({ where: { id }, data: { status: 'COMPLETED', workDateTime: new Date() } });
  }

  async deleteStockTransfer(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('재고이동 내역을 찾을 수 없습니다');
    if (transfer.status === 'COMPLETED') throw new BadRequestException('완료된 재고이동은 삭제할 수 없습니다');
    return this.prisma.stockTransfer.delete({ where: { id } });
  }

  // === 마감관리 ===
  async findAllPeriodCloses(query: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.periodClose.findMany({ skip: query.skip, take: query.take, orderBy: { periodDate: 'desc' } }),
      this.prisma.periodClose.count(),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async createPeriodClose(dto: CreatePeriodCloseDto) {
    return this.prisma.periodClose.create({ data: { ...dto, periodDate: new Date(dto.periodDate) } });
  }

  async closePeriod(id: string, userId: string) {
    return this.prisma.periodClose.update({
      where: { id },
      data: { status: 'CLOSED', closedBy: userId, closedAt: new Date() },
    });
  }

  async deletePeriodClose(id: string) {
    return this.prisma.periodClose.delete({ where: { id } });
  }

  // === 물류용기재고 ===
  async findAllContainerInventories(query: PaginationDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { containerCode: { contains: query.search } },
        { containerName: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.containerInventory.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' } }),
      this.prisma.containerInventory.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  // === LOC별입고상품 ===
  async findAllLocationProducts(query: PaginationDto) {
    const where: any = {};
    if (query.search) { where.locationCode = { contains: query.search }; }
    const [data, total] = await Promise.all([
      this.prisma.locationProduct.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' } }),
      this.prisma.locationProduct.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async createLocationProduct(dto: CreateLocationProductDto) {
    return this.prisma.locationProduct.create({ data: dto });
  }

  async deleteLocationProduct(id: string) {
    return this.prisma.locationProduct.delete({ where: { id } });
  }

  // === 세트품목 ===
  async findAllSetItems(query: PaginationDto) {
    const where: any = {};
    if (query.search) { where.parentItemId = { contains: query.search }; }
    const [data, total] = await Promise.all([
      this.prisma.setItem.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' } }),
      this.prisma.setItem.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async createSetItem(dto: CreateSetItemDto) {
    return this.prisma.setItem.create({ data: { ...dto, quantity: dto.quantity ?? 1 } });
  }

  async deleteSetItem(id: string) {
    return this.prisma.setItem.delete({ where: { id } });
  }

  // === 거래처별상품 ===
  async findAllPartnerProducts(query: PaginationDto) {
    const where: any = {};
    if (query.search) { where.partnerId = { contains: query.search }; }
    const [data, total] = await Promise.all([
      this.prisma.partnerProduct.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' } }),
      this.prisma.partnerProduct.count({ where }),
    ]);
    return new PaginatedResult(data, total, query.page, query.limit);
  }

  async createPartnerProduct(dto: CreatePartnerProductDto) {
    return this.prisma.partnerProduct.create({ data: { ...dto, expiryControl: dto.expiryControl ?? false } });
  }

  async deletePartnerProduct(id: string) {
    return this.prisma.partnerProduct.delete({ where: { id } });
  }
}
