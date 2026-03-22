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
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto, UpdateDispatchDto } from './dto/dispatch.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dispatches')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get()
  @ApiOperation({ summary: '배차 목록 조회' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
  findAll(
    @Query() query: PaginationDto,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('date') date?: string,
  ) {
    return this.dispatchService.findAll({ ...query, status, warehouseId, date } as any);
  }

  @Get(':id')
  @ApiOperation({ summary: '배차 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispatchService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '배차 생성' })
  create(@Body() dto: CreateDispatchDto) {
    return this.dispatchService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '배차 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDispatchDto) {
    return this.dispatchService.update(id, dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '배차 시작 (IN_PROGRESS)' })
  start(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispatchService.start(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '배차 완료 (COMPLETED)' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispatchService.complete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '배차 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispatchService.delete(id);
  }
}
