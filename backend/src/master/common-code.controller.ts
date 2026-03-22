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
import { CommonCodeService } from './common-code.service';
import { CreateCommonCodeDto, UpdateCommonCodeDto } from './dto/common-code.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('CommonCode')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('common-codes')
export class CommonCodeController {
  constructor(private readonly commonCodeService: CommonCodeService) {}

  @Get()
  @ApiOperation({ summary: '공통코드 목록 조회' })
  @ApiQuery({ name: 'groupCode', required: false, description: '코드유형 필터' })
  findAll(
    @Query() query: PaginationDto,
    @Query('groupCode') groupCode?: string,
  ) {
    return this.commonCodeService.findAll({ ...query, groupCode } as any);
  }

  @Get(':id')
  @ApiOperation({ summary: '공통코드 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.commonCodeService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '공통코드 생성' })
  create(@Body() dto: CreateCommonCodeDto) {
    return this.commonCodeService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '공통코드 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateCommonCodeDto) {
    return this.commonCodeService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '공통코드 삭제' })
  remove(@Param('id') id: string) {
    return this.commonCodeService.delete(id);
  }
}
