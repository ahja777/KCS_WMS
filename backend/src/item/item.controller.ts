import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Item')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @ApiOperation({ summary: '품목 목록 조회' })
  findAll(@Query() query: PaginationDto & { category?: string; isActive?: string }) {
    return this.itemService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '품목 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '품목 생성' })
  create(@Body() dto: CreateItemDto) {
    return this.itemService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '품목 수정 (전체)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '품목 수정 (부분)' })
  partialUpdate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateItemDto) {
    return this.itemService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '품목 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemService.delete(id);
  }
}
