import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContainerGroupService } from './container-group.service';
import { CreateContainerGroupDto, UpdateContainerGroupDto } from './dto/container.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('ContainerGroup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('container-groups')
export class ContainerGroupController {
  constructor(private readonly containerGroupService: ContainerGroupService) {}

  @Get() @ApiOperation({ summary: '물류용기군 목록 조회' })
  findAll(@Query() query: PaginationDto) { return this.containerGroupService.findAll(query); }

  @Get(':id') @ApiOperation({ summary: '물류용기군 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.containerGroupService.findById(id); }

  @Post() @ApiOperation({ summary: '물류용기군 등록' })
  create(@Body() dto: CreateContainerGroupDto) { return this.containerGroupService.create(dto); }

  @Put(':id') @ApiOperation({ summary: '물류용기군 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContainerGroupDto) { return this.containerGroupService.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: '물류용기군 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.containerGroupService.delete(id); }
}
