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
import { WarehouseService } from './warehouse.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateZoneDto,
  UpdateZoneDto,
  CreateLocationDto,
  UpdateLocationDto,
} from './dto/warehouse.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  // ─── Warehouse ─────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '창고 목록 조회' })
  findAll(@Query() query: PaginationDto) {
    return this.warehouseService.findAllWarehouses(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '창고 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouseService.findWarehouseById(id);
  }

  @Post()
  @ApiOperation({ summary: '창고 생성' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.createWarehouse(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '창고 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.updateWarehouse(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '창고 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouseService.deleteWarehouse(id);
  }

  // ─── Zone ─────────────────────────────────────────────

  @Get(':warehouseId/zones')
  @ApiOperation({ summary: '창고 구역 목록 조회' })
  findZones(@Param('warehouseId') warehouseId: string) {
    return this.warehouseService.findZonesByWarehouse(warehouseId);
  }

  @Get(':warehouseId/zones/:zoneId')
  @ApiOperation({ summary: '구역 상세 조회' })
  findZone(
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.warehouseService.findZoneById(warehouseId, zoneId);
  }

  @Post(':warehouseId/zones')
  @ApiOperation({ summary: '구역 생성' })
  createZone(
    @Param('warehouseId') warehouseId: string,
    @Body() dto: CreateZoneDto,
  ) {
    return this.warehouseService.createZone(warehouseId, dto);
  }

  @Put(':warehouseId/zones/:zoneId')
  @ApiOperation({ summary: '구역 수정' })
  updateZone(
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.warehouseService.updateZone(warehouseId, zoneId, dto);
  }

  @Delete(':warehouseId/zones/:zoneId')
  @ApiOperation({ summary: '구역 삭제' })
  removeZone(
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.warehouseService.deleteZone(warehouseId, zoneId);
  }

  // ─── Location ─────────────────────────────────────────

  @Get(':warehouseId/zones/:zoneId/locations')
  @ApiOperation({ summary: '로케이션 목록 조회' })
  findLocations(
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.warehouseService.findLocationsByZone(warehouseId, zoneId);
  }

  @Post(':warehouseId/zones/:zoneId/locations')
  @ApiOperation({ summary: '로케이션 생성' })
  createLocation(
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.warehouseService.createLocation(warehouseId, zoneId, dto);
  }

  @Put(':warehouseId/zones/:zoneId/locations/:locationId')
  @ApiOperation({ summary: '로케이션 수정' })
  updateLocation(
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.warehouseService.updateLocation(warehouseId, zoneId, locationId, dto);
  }

  @Delete(':warehouseId/zones/:zoneId/locations/:locationId')
  @ApiOperation({ summary: '로케이션 삭제' })
  removeLocation(
    @Param('warehouseId') warehouseId: string,
    @Param('zoneId') zoneId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.warehouseService.deleteLocation(warehouseId, zoneId, locationId);
  }
}
