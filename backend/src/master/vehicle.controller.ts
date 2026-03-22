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
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Vehicle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  @ApiOperation({ summary: '차량 목록 조회' })
  findAll(@Query() query: PaginationDto) {
    return this.vehicleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '차량 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '차량 등록' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehicleService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '차량 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicleService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '차량 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleService.delete(id);
  }
}
