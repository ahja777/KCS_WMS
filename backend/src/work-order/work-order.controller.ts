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
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto } from './dto/work-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('WorkOrder')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Get()
  @ApiOperation({ summary: '작업지시서 목록 조회' })
  @ApiQuery({ name: 'type', required: false, description: '작업유형' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  findAll(
    @Query() query: PaginationDto,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.workOrderService.findAll({ ...query, type, status, warehouseId } as any);
  }

  @Get(':id')
  @ApiOperation({ summary: '작업지시서 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrderService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '작업지시서 생성' })
  create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrderService.create(dto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: '작업지시서 배정 (ASSIGNED)' })
  assign(@Param('id', ParseUUIDPipe) id: string, @Body('assignedTo') assignedTo?: string) {
    return this.workOrderService.assign(id, assignedTo);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '작업지시서 시작 (IN_PROGRESS)' })
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrderService.start(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '작업지시서 완료 (COMPLETED)' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrderService.complete(id);
  }
}
