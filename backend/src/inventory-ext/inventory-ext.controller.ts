import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryExtService } from './inventory-ext.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateOwnershipTransferDto, UpdateOwnershipTransferDto,
  CreateAssemblyDto, CreateAssemblyItemDto,
  CreateStockTransferDto, UpdateStockTransferDto,
  CreatePeriodCloseDto,
  CreateLocationProductDto,
  CreateSetItemDto, CreatePartnerProductDto,
} from './dto/inventory-ext.dto';

@ApiTags('InventoryExt')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InventoryExtController {
  constructor(private readonly svc: InventoryExtService) {}

  // 명의변경
  @Get('ownership-transfers') @ApiOperation({ summary: '명의변경 목록' })
  getOwnershipTransfers(@Query() q: PaginationDto) { return this.svc.findAllOwnershipTransfers(q); }

  @Post('ownership-transfers') @ApiOperation({ summary: '명의변경 등록' })
  createOwnershipTransfer(@Body() dto: CreateOwnershipTransferDto) { return this.svc.createOwnershipTransfer(dto); }

  @Put('ownership-transfers/:id') @ApiOperation({ summary: '명의변경 수정' })
  updateOwnershipTransfer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOwnershipTransferDto) { return this.svc.updateOwnershipTransfer(id, dto); }

  @Delete('ownership-transfers/:id') @ApiOperation({ summary: '명의변경 삭제' })
  deleteOwnershipTransfer(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteOwnershipTransfer(id); }

  // 임가공/조립
  @Get('assemblies') @ApiOperation({ summary: '임가공 목록' })
  getAssemblies(@Query() q: PaginationDto) { return this.svc.findAllAssemblies(q); }

  @Get('assemblies/:id') @ApiOperation({ summary: '임가공 상세' })
  getAssembly(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findAssemblyById(id); }

  @Post('assemblies') @ApiOperation({ summary: '임가공 등록' })
  createAssembly(@Body() dto: CreateAssemblyDto) { return this.svc.createAssembly(dto); }

  @Post('assemblies/items') @ApiOperation({ summary: '임가공 품목 추가' })
  addAssemblyItem(@Body() dto: CreateAssemblyItemDto) { return this.svc.addAssemblyItem(dto); }

  @Delete('assemblies/:id') @ApiOperation({ summary: '임가공 삭제' })
  deleteAssembly(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteAssembly(id); }

  // 재고이동
  @Get('stock-transfers') @ApiOperation({ summary: '재고이동 목록' })
  getStockTransfers(@Query() q: PaginationDto) { return this.svc.findAllStockTransfers(q); }

  @Post('stock-transfers') @ApiOperation({ summary: '재고이동 등록' })
  createStockTransfer(@Body() dto: CreateStockTransferDto) { return this.svc.createStockTransfer(dto); }

  @Put('stock-transfers/:id') @ApiOperation({ summary: '재고이동 수정' })
  updateStockTransfer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStockTransferDto) { return this.svc.updateStockTransfer(id, dto); }

  @Put('stock-transfers/:id/complete') @ApiOperation({ summary: '재고이동 완료' })
  completeStockTransfer(@Param('id', ParseUUIDPipe) id: string) { return this.svc.completeStockTransfer(id); }

  @Delete('stock-transfers/:id') @ApiOperation({ summary: '재고이동 삭제' })
  deleteStockTransfer(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteStockTransfer(id); }

  // 마감관리
  @Get('period-closes') @ApiOperation({ summary: '마감관리 목록' })
  getPeriodCloses(@Query() q: PaginationDto) { return this.svc.findAllPeriodCloses(q); }

  @Post('period-closes') @ApiOperation({ summary: '마감 생성' })
  createPeriodClose(@Body() dto: CreatePeriodCloseDto) { return this.svc.createPeriodClose(dto); }

  @Put('period-closes/:id/close') @ApiOperation({ summary: '마감 실행' })
  closePeriod(@Param('id', ParseUUIDPipe) id: string) { return this.svc.closePeriod(id, 'system'); }

  @Delete('period-closes/:id') @ApiOperation({ summary: '마감 삭제' })
  deletePeriodClose(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deletePeriodClose(id); }

  // 물류용기재고
  @Get('container-inventories') @ApiOperation({ summary: '물류용기재고 목록' })
  getContainerInventories(@Query() q: PaginationDto) { return this.svc.findAllContainerInventories(q); }

  // LOC별입고상품
  @Get('location-products') @ApiOperation({ summary: 'LOC별입고상품 목록' })
  getLocationProducts(@Query() q: PaginationDto) { return this.svc.findAllLocationProducts(q); }

  @Post('location-products') @ApiOperation({ summary: 'LOC별입고상품 등록' })
  createLocationProduct(@Body() dto: CreateLocationProductDto) { return this.svc.createLocationProduct(dto); }

  @Delete('location-products/:id') @ApiOperation({ summary: 'LOC별입고상품 삭제' })
  deleteLocationProduct(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteLocationProduct(id); }

  // 세트품목
  @Get('set-items') @ApiOperation({ summary: '세트품목 목록' })
  getSetItems(@Query() q: PaginationDto) { return this.svc.findAllSetItems(q); }

  @Post('set-items') @ApiOperation({ summary: '세트품목 등록' })
  createSetItem(@Body() dto: CreateSetItemDto) { return this.svc.createSetItem(dto); }

  @Delete('set-items/:id') @ApiOperation({ summary: '세트품목 삭제' })
  deleteSetItem(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteSetItem(id); }

  // 거래처별상품
  @Get('partner-products') @ApiOperation({ summary: '거래처별상품 목록' })
  getPartnerProducts(@Query() q: PaginationDto) { return this.svc.findAllPartnerProducts(q); }

  @Post('partner-products') @ApiOperation({ summary: '거래처별상품 등록' })
  createPartnerProduct(@Body() dto: CreatePartnerProductDto) { return this.svc.createPartnerProduct(dto); }

  @Delete('partner-products/:id') @ApiOperation({ summary: '거래처별상품 삭제' })
  deletePartnerProduct(@Param('id', ParseUUIDPipe) id: string) { return this.svc.deletePartnerProduct(id); }
}
