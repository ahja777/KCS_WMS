import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChannelService } from './services/channel.service';
import { ChannelSyncService } from './services/channel-sync.service';
import {
  CreateChannelDto,
  UpdateChannelDto,
  LinkProductDto,
  SyncOrdersDto,
  ConfirmShipmentDto,
} from './dto/channel.dto';

@ApiTags('External Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ExternalController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly syncService: ChannelSyncService,
  ) {}

  // ===== 채널 관리 =====

  @Get()
  @ApiOperation({ summary: '판매채널 목록 조회' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    return this.channelService.findAll({
      page,
      limit,
      platform: platform as any,
      status: status as any,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '판매채널 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.channelService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '판매채널 등록' })
  create(@Body() dto: CreateChannelDto) {
    return this.channelService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '판매채널 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChannelDto) {
    return this.channelService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '판매채널 삭제' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.channelService.remove(id);
  }

  // ===== 연결 테스트 =====

  @Post(':id/test')
  @ApiOperation({ summary: '채널 연결 테스트' })
  testConnection(@Param('id', ParseUUIDPipe) id: string) {
    return this.channelService.testConnection(id);
  }

  // ===== 동기화 제어 =====

  @Post(':id/sync/toggle')
  @ApiOperation({ summary: '자동 동기화 ON/OFF' })
  toggleSync(@Param('id', ParseUUIDPipe) id: string, @Body('enabled') enabled: boolean) {
    return this.channelService.toggleSync(id, enabled);
  }

  // ===== 주문 동기화 =====

  @Post(':id/sync/orders')
  @ApiOperation({ summary: '주문 수동 동기화' })
  syncOrders(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SyncOrdersDto) {
    return this.syncService.syncOrders(id, dto.fromDate, dto.toDate);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: '채널별 주문 목록 조회' })
  getChannelOrders(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.syncService.getChannelOrders(id, {
      page,
      limit,
      status: status as any,
    });
  }

  // ===== 전체 채널 주문 =====

  @Get('orders/all')
  @ApiOperation({ summary: '전체 채널 주문 조회' })
  getAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('search') search?: string,
  ) {
    return this.syncService.getAllChannelOrders({
      page,
      limit,
      status: status as any,
      platform,
      search,
    });
  }

  // ===== 배송 확인 =====

  @Post('orders/ship')
  @ApiOperation({ summary: '배송 확인 전송 (채널 → 플랫폼)' })
  confirmShipment(@Body() dto: ConfirmShipmentDto) {
    return this.syncService.confirmShipment(
      dto.channelOrderId,
      dto.carrier,
      dto.trackingNumber,
    );
  }

  // ===== 재고 동기화 =====

  @Post(':id/sync/inventory')
  @ApiOperation({ summary: '재고 동기화 (WMS → 채널)' })
  syncInventory(@Param('id', ParseUUIDPipe) id: string) {
    return this.syncService.syncInventory(id);
  }

  // ===== 상품 매핑 =====

  @Get(':id/products')
  @ApiOperation({ summary: '채널 연결 상품 조회' })
  getLinkedProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.syncService.getLinkedProducts(id);
  }

  @Post(':id/products/link')
  @ApiOperation({ summary: '상품 매핑 (WMS ↔ 채널)' })
  linkProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: LinkProductDto) {
    return this.syncService.linkProduct(
      id,
      dto.itemId,
      dto.platformProductId,
      dto.platformSku,
    );
  }

  @Delete(':id/products/:itemId')
  @ApiOperation({ summary: '상품 매핑 해제' })
  unlinkProduct(@Param('id', ParseUUIDPipe) id: string, @Param('itemId') itemId: string) {
    return this.syncService.unlinkProduct(id, itemId);
  }

  @Get(':id/products/fetch')
  @ApiOperation({ summary: '플랫폼 상품 목록 가져오기' })
  fetchChannelProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.syncService.fetchChannelProducts(id);
  }

  // ===== 동기화 로그 =====

  @Get(':id/sync/logs')
  @ApiOperation({ summary: '동기화 로그 조회' })
  getSyncLogs(@Param('id', ParseUUIDPipe) id: string, @Query('limit') limit?: string) {
    return this.channelService.getSyncLogs(id, limit ? parseInt(limit, 10) : undefined);
  }
}
