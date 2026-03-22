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
import { PartnerService } from './partner.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Partner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get()
  @ApiOperation({ summary: '거래처 목록 조회' })
  @ApiQuery({ name: 'type', required: false, enum: ['SUPPLIER', 'CUSTOMER', 'CARRIER'] })
  findAll(@Query() query: PaginationDto, @Query('type') type?: string) {
    return this.partnerService.findAll(Object.assign(query, { type }));
  }

  @Get(':id')
  @ApiOperation({ summary: '거래처 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.partnerService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '거래처 생성' })
  create(@Body() dto: CreatePartnerDto) {
    return this.partnerService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '거래처 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnerService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '거래처 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.partnerService.delete(id);
  }
}
