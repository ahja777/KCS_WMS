import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContainerService } from './container.service';
import { CreateContainerDto, UpdateContainerDto } from './dto/container.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Container')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('containers')
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Get() @ApiOperation({ summary: '물류용기 목록 조회' })
  findAll(@Query() query: PaginationDto) { return this.containerService.findAll(query); }

  @Get(':id') @ApiOperation({ summary: '물류용기 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.containerService.findById(id); }

  @Post() @ApiOperation({ summary: '물류용기 등록' })
  create(@Body() dto: CreateContainerDto) { return this.containerService.create(dto); }

  @Put(':id') @ApiOperation({ summary: '물류용기 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContainerDto) { return this.containerService.update(id, dto); }

  @Delete(':id') @ApiOperation({ summary: '물류용기 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.containerService.delete(id); }
}
