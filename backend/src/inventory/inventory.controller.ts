import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  StockAdjustmentDto,
  CreateCycleCountDto,
  CompleteCycleCountDto,
  InventoryQueryDto,
  TransactionQueryDto,
  TransferDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Current Stock ────────────────────────────────────

  @Get('stock')
  @ApiOperation({ summary: '현재 재고 조회' })
  getCurrentStock(@Query() query: InventoryQueryDto) {
    return this.inventoryService.getCurrentStock(query);
  }

  @Get('stock/item/:itemId')
  @ApiOperation({ summary: '품목별 재고 조회' })
  getStockByItem(@Param('itemId') itemId: string) {
    return this.inventoryService.getStockByItem(itemId);
  }

  @Get('stock/summary/:warehouseId')
  @ApiOperation({ summary: '창고별 재고 요약' })
  getStockSummary(@Param('warehouseId') warehouseId: string) {
    return this.inventoryService.getStockSummary(warehouseId);
  }

  // ─── Stock Adjustment ─────────────────────────────────

  @Post('adjustments')
  @ApiOperation({ summary: '재고 조정' })
  createAdjustment(@Body() dto: StockAdjustmentDto) {
    return this.inventoryService.createAdjustment(dto);
  }

  @Get('adjustments')
  @ApiOperation({ summary: '재고 조정 내역 조회' })
  @ApiQuery({ name: 'warehouseId', required: false })
  getAdjustments(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getAdjustments(warehouseId);
  }

  // ─── Stock Transfer ─────────────────────────────────

  @Post('transfer')
  @ApiOperation({ summary: '재고 이동 (로케이션 간 이동)' })
  transferStock(@Body() dto: TransferDto) {
    return this.inventoryService.transferStock(dto);
  }

  // ─── Cycle Count ──────────────────────────────────────

  @Post('cycle-counts')
  @ApiOperation({ summary: '순환 실사 생성' })
  createCycleCount(@Body() dto: CreateCycleCountDto) {
    return this.inventoryService.createCycleCount(dto);
  }

  @Get('cycle-counts')
  @ApiOperation({ summary: '순환 실사 목록 조회' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'status', required: false })
  getCycleCounts(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.getCycleCounts(warehouseId, status);
  }

  @Post('cycle-counts/:id/complete')
  @ApiOperation({ summary: '순환 실사 완료' })
  completeCycleCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteCycleCountDto,
  ) {
    return this.inventoryService.completeCycleCount(id, dto);
  }

  // ─── Transaction Log ──────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: '재고 이동 이력 조회' })
  getTransactions(@Query() query: TransactionQueryDto) {
    return this.inventoryService.getTransactions(query);
  }
}
