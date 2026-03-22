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
import { DockService } from './dock.service';
import { CreateDockDto, UpdateDockDto } from './dto/dock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Dock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('docks')
export class DockController {
  constructor(private readonly dockService: DockService) {}

  @Get()
  @ApiOperation({ summary: '도크 목록 조회' })
  @ApiQuery({ name: 'warehouseId', required: false, description: '창고 ID 필터' })
  findAll(
    @Query() query: PaginationDto,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.dockService.findAll({ ...query, warehouseId } as any);
  }

  @Get(':id')
  @ApiOperation({ summary: '도크 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dockService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '도크 등록' })
  create(@Body() dto: CreateDockDto) {
    return this.dockService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '도크 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDockDto) {
    return this.dockService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '도크 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dockService.delete(id);
  }
}
