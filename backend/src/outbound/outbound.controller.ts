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
import { OutboundService } from './outbound.service';
import {
  CreateOutboundOrderDto,
  UpdateOutboundOrderDto,
  PickOutboundDto,
  ShipOutboundDto,
} from './dto/outbound.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Outbound')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('outbound')
export class OutboundController {
  constructor(private readonly outboundService: OutboundService) {}

  @Get()
  @ApiOperation({ summary: '출고 주문 목록 조회' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  findAll(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.outboundService.findAll(
      Object.assign(query, { status, warehouseId }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '출고 주문 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.outboundService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '출고 주문 생성' })
  create(@Body() dto: CreateOutboundOrderDto) {
    return this.outboundService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '출고 주문 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateOutboundOrderDto) {
    return this.outboundService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '출고 주문 삭제' })
  remove(@Param('id') id: string) {
    return this.outboundService.delete(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '출고 주문 확정 (재고 예약)' })
  confirm(@Param('id') id: string) {
    return this.outboundService.confirm(id);
  }

  @Post(':id/pick')
  @ApiOperation({ summary: '피킹 처리' })
  pick(@Param('id') id: string, @Body() dto: PickOutboundDto) {
    return this.outboundService.pick(id, dto);
  }

  @Post(':id/ship')
  @ApiOperation({ summary: '출하 처리' })
  ship(@Param('id') id: string, @Body() dto: ShipOutboundDto) {
    return this.outboundService.ship(id, dto);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: '배송 완료 처리' })
  markDelivered(@Param('id') id: string) {
    return this.outboundService.markDelivered(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '출고 주문 취소' })
  cancel(@Param('id') id: string) {
    return this.outboundService.cancel(id);
  }
}
