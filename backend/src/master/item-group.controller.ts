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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ItemGroupService } from './item-group.service';
import { CreateItemGroupDto, UpdateItemGroupDto } from './dto/item-group.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('ItemGroup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('item-groups')
export class ItemGroupController {
  constructor(private readonly itemGroupService: ItemGroupService) {}

  @Get()
  @ApiOperation({ summary: '상품군 목록 조회' })
  findAll(@Query() query: PaginationDto) {
    return this.itemGroupService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '상품군 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.itemGroupService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '상품군 생성' })
  create(@Body() dto: CreateItemGroupDto) {
    return this.itemGroupService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '상품군 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateItemGroupDto) {
    return this.itemGroupService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '상품군 삭제' })
  remove(@Param('id') id: string) {
    return this.itemGroupService.delete(id);
  }
}
