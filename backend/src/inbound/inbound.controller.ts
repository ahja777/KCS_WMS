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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InboundService } from './inbound.service';
import {
  CreateInboundOrderDto,
  UpdateInboundOrderDto,
  ReceiveInboundDto,
} from './dto/inbound.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Inbound')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inbound')
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  @Get()
  @ApiOperation({ summary: '입고 주문 목록 조회' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  findAll(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inboundService.findAll(
      Object.assign(query, { status, warehouseId }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '입고 주문 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '입고 주문 생성 (ASN)' })
  create(@Body() dto: CreateInboundOrderDto) {
    return this.inboundService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '입고 주문 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInboundOrderDto) {
    return this.inboundService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '입고 주문 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.delete(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '입고 주문 확정' })
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.confirm(id);
  }

  @Post(':id/arrive')
  @ApiOperation({ summary: '입고 도착 처리' })
  markArrived(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.markArrived(id);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: '입고 검수/입고 처리' })
  receive(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReceiveInboundDto) {
    return this.inboundService.receive(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '입고 주문 취소' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.cancel(id);
  }
}
