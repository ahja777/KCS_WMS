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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UomService } from './uom.service';
import { CreateUomMasterDto, UpdateUomMasterDto, CreateUomConversionDto } from './dto/uom.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('UOM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uom')
export class UomController {
  constructor(private readonly uomService: UomService) {}

  @Get()
  @ApiOperation({ summary: 'UOM 목록 조회' })
  findAll(@Query() query: PaginationDto) {
    return this.uomService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'UOM 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.uomService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'UOM 생성' })
  create(@Body() dto: CreateUomMasterDto) {
    return this.uomService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'UOM 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUomMasterDto) {
    return this.uomService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'UOM 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.uomService.delete(id);
  }

  @Get(':id/conversions')
  @ApiOperation({ summary: 'UOM 환산 목록 조회' })
  findConversions(@Param('id', ParseUUIDPipe) id: string) {
    return this.uomService.findConversions(id);
  }

  @Post(':id/conversions')
  @ApiOperation({ summary: 'UOM 환산 등록' })
  createConversion(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateUomConversionDto) {
    return this.uomService.createConversion(id, dto);
  }
}
