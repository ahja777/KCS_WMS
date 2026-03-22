import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryMovementService } from './inventory-movement.service';
import { CreateInventoryMovementDto } from './dto/inventory-movement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Inventory Movement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory/movements')
export class InventoryMovementController {
  constructor(private readonly movementService: InventoryMovementService) {}

  @Get()
  @ApiOperation({ summary: '재고이동 목록 조회' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  findAll(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.movementService.findAll({ ...query, status, warehouseId } as any);
  }

  @Get(':id')
  @ApiOperation({ summary: '재고이동 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.movementService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '재고이동 생성' })
  create(@Body() dto: CreateInventoryMovementDto) {
    return this.movementService.create(dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '재고이동 시작 (IN_PROGRESS)' })
  start(@Param('id') id: string) {
    return this.movementService.start(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '재고이동 완료 (COMPLETED)' })
  complete(@Param('id') id: string) {
    return this.movementService.complete(id);
  }
}
