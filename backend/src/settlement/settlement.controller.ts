import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { CreateSettlementDto, UpdateSettlementDto } from './dto/settlement.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Settlement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @ApiOperation({ summary: '정산 목록 조회' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'partnerId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  findAll(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('partnerId') partnerId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.settlementService.findAll({ ...query, status, partnerId, warehouseId } as any);
  }

  @Get(':id')
  @ApiOperation({ summary: '정산 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.settlementService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '정산 생성' })
  create(@Body() dto: CreateSettlementDto) {
    return this.settlementService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '정산 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateSettlementDto) {
    return this.settlementService.update(id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '정산 확정' })
  confirm(@Param('id') id: string) {
    return this.settlementService.confirm(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '정산 삭제' })
  remove(@Param('id') id: string) {
    return this.settlementService.delete(id);
  }
}
