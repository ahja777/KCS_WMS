import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelService } from '../services/excel.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const MAX_EXPORT_ROWS = 10000;

@ApiTags('Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService,
  ) {}

  private setExportWarningHeader(res: Response, count: number): void {
    if (count >= MAX_EXPORT_ROWS) {
      res.setHeader(
        'X-Export-Warning',
        `Result limited to ${MAX_EXPORT_ROWS} rows. Apply filters to narrow results.`,
      );
    }
  }

  private formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 10);
  }

  private formatDateTime(date: Date | null | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().replace('T', ' ').slice(0, 19);
  }

  private getFilename(prefix: string): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${prefix}_${today}.xlsx`;
  }

  private setExcelHeaders(res: Response, filename: string): void {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
  }

  @ApiOperation({ summary: '재고 현황 엑셀 다운로드' })
  @Get('inventory')
  async exportInventory(
    @Query('warehouseId') warehouseId: string,
    @Res() res: Response,
  ) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    const inventories = await this.prisma.inventory.findMany({
      where,
      include: {
        item: true,
        warehouse: true,
        location: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });

    const columns = [
      { header: '창고', key: 'warehouse' },
      { header: 'SKU코드', key: 'skuCode' },
      { header: '품목명', key: 'itemName' },
      { header: '위치', key: 'location' },
      { header: 'LOT번호', key: 'lotNo' },
      { header: '수량', key: 'quantity' },
      { header: '가용수량', key: 'availableQty' },
      { header: '예약수량', key: 'reservedQty' },
      { header: '최종수정일', key: 'updatedAt' },
    ];

    const data = inventories.map((inv) => ({
      warehouse: inv.warehouse?.name ?? '',
      skuCode: inv.item?.code ?? '',
      itemName: inv.item?.name ?? '',
      location: inv.location?.code ?? '',
      lotNo: inv.lotNo ?? '',
      quantity: inv.quantity,
      availableQty: inv.availableQty,
      reservedQty: inv.reservedQty,
      updatedAt: this.formatDateTime(inv.updatedAt),
    }));

    const buffer = await this.excelService.generateExcel('재고현황', columns, data);
    const filename = this.getFilename('inventory');
    this.setExcelHeaders(res, filename);
    this.setExportWarningHeader(res, inventories.length);
    res.end(buffer);
  }

  @ApiOperation({ summary: '품목 마스터 엑셀 다운로드' })
  @Get('items')
  async exportItems(@Res() res: Response) {
    const items = await this.prisma.item.findMany({
      orderBy: { code: 'asc' },
      take: MAX_EXPORT_ROWS,
    });

    const columns = [
      { header: 'SKU코드', key: 'code' },
      { header: '품목명', key: 'name' },
      { header: '카테고리', key: 'category' },
      { header: '바코드', key: 'barcode' },
      { header: '단위', key: 'uom' },
      { header: '무게', key: 'weight' },
      { header: '치수', key: 'dimensions' },
      { header: '안전재고', key: 'minStock' },
      { header: '최대재고', key: 'maxStock' },
      { header: '상태', key: 'status' },
    ];

    const data = items.map((item) => {
      const dims = [item.length, item.width, item.height]
        .filter((v) => v != null)
        .join(' x ');

      return {
        code: item.code,
        name: item.name,
        category: item.category,
        barcode: item.barcode ?? '',
        uom: item.uom,
        weight: item.weight ?? '',
        dimensions: dims || '',
        minStock: item.minStock,
        maxStock: item.maxStock ?? '',
        status: item.isActive ? '활성' : '비활성',
      };
    });

    const buffer = await this.excelService.generateExcel('품목마스터', columns, data);
    const filename = this.getFilename('items');
    this.setExcelHeaders(res, filename);
    this.setExportWarningHeader(res, items.length);
    res.end(buffer);
  }

  @ApiOperation({ summary: '입고 주문 엑셀 다운로드' })
  @Get('inbound')
  async exportInbound(
    @Query('status') status: string,
    @Query('warehouseId') warehouseId: string,
    @Res() res: Response,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    const orders = await this.prisma.inboundOrder.findMany({
      where,
      include: {
        warehouse: true,
        partner: true,
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });

    const columns = [
      { header: '주문번호', key: 'orderNumber' },
      { header: '창고', key: 'warehouse' },
      { header: '거래처', key: 'partner' },
      { header: '상태', key: 'status' },
      { header: '예정일', key: 'expectedDate' },
      { header: '도착일', key: 'arrivedDate' },
      { header: '완료일', key: 'completedDate' },
      { header: '생성일', key: 'createdAt' },
    ];

    const data = orders.map((order) => ({
      orderNumber: order.orderNumber,
      warehouse: order.warehouse?.name ?? '',
      partner: order.partner?.name ?? '',
      status: order.status,
      expectedDate: this.formatDate(order.expectedDate),
      arrivedDate: this.formatDate(order.arrivedDate),
      completedDate: this.formatDate(order.completedDate),
      createdAt: this.formatDate(order.createdAt),
    }));

    const buffer = await this.excelService.generateExcel('입고주문', columns, data);
    const filename = this.getFilename('inbound');
    this.setExcelHeaders(res, filename);
    this.setExportWarningHeader(res, orders.length);
    res.end(buffer);
  }

  @ApiOperation({ summary: '출고 주문 엑셀 다운로드' })
  @Get('outbound')
  async exportOutbound(
    @Query('status') status: string,
    @Query('warehouseId') warehouseId: string,
    @Res() res: Response,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    const orders = await this.prisma.outboundOrder.findMany({
      where,
      include: {
        warehouse: true,
        partner: true,
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_EXPORT_ROWS,
    });

    const columns = [
      { header: '주문번호', key: 'orderNumber' },
      { header: '창고', key: 'warehouse' },
      { header: '고객', key: 'partner' },
      { header: '상태', key: 'status' },
      { header: '출하예정일', key: 'shipDate' },
      { header: '배송일', key: 'deliveryDate' },
      { header: '추적번호', key: 'trackingNumber' },
      { header: '생성일', key: 'createdAt' },
    ];

    const data = orders.map((order) => ({
      orderNumber: order.orderNumber,
      warehouse: order.warehouse?.name ?? '',
      partner: order.partner?.name ?? '',
      status: order.status,
      shipDate: this.formatDate(order.shipDate),
      deliveryDate: this.formatDate(order.deliveryDate),
      trackingNumber: order.trackingNumber ?? '',
      createdAt: this.formatDate(order.createdAt),
    }));

    const buffer = await this.excelService.generateExcel('출고주문', columns, data);
    const filename = this.getFilename('outbound');
    this.setExcelHeaders(res, filename);
    this.setExportWarningHeader(res, orders.length);
    res.end(buffer);
  }

  @ApiOperation({ summary: '거래처 목록 엑셀 다운로드' })
  @Get('partners')
  async exportPartners(
    @Query('type') type: string,
    @Res() res: Response,
  ) {
    const where: any = {};
    if (type) where.type = type;

    const partners = await this.prisma.partner.findMany({
      where,
      orderBy: { code: 'asc' },
      take: MAX_EXPORT_ROWS,
    });

    const typeMap: Record<string, string> = {
      SUPPLIER: '공급처',
      CUSTOMER: '고객사',
      CARRIER: '운송사',
    };

    const columns = [
      { header: '파트너코드', key: 'code' },
      { header: '파트너명', key: 'name' },
      { header: '유형', key: 'type' },
      { header: '국가', key: 'country' },
      { header: '담당자', key: 'contactName' },
      { header: '연락처', key: 'contactPhone' },
      { header: '이메일', key: 'contactEmail' },
      { header: '상태', key: 'status' },
    ];

    const data = partners.map((p) => ({
      code: p.code,
      name: p.name,
      type: typeMap[p.type] ?? p.type,
      country: p.country ?? '',
      contactName: p.contactName ?? '',
      contactPhone: p.contactPhone ?? '',
      contactEmail: p.contactEmail ?? '',
      status: p.isActive ? '활성' : '비활성',
    }));

    const buffer = await this.excelService.generateExcel('파트너목록', columns, data);
    const filename = this.getFilename('partners');
    this.setExcelHeaders(res, filename);
    this.setExportWarningHeader(res, partners.length);
    res.end(buffer);
  }

  @ApiOperation({ summary: '창고 목록 엑셀 다운로드' })
  @Get('warehouses')
  async exportWarehouses(@Res() res: Response) {
    const warehouses = await this.prisma.warehouse.findMany({
      orderBy: { code: 'asc' },
      take: MAX_EXPORT_ROWS,
    });

    const statusMap: Record<string, string> = {
      ACTIVE: '운영중',
      INACTIVE: '비활성',
      MAINTENANCE: '점검중',
    };

    const columns = [
      { header: '창고코드', key: 'code' },
      { header: '창고명', key: 'name' },
      { header: '국가', key: 'country' },
      { header: '도시', key: 'city' },
      { header: '주소', key: 'address' },
      { header: '시간대', key: 'timezone' },
      { header: '담당자', key: 'contactName' },
      { header: '상태', key: 'status' },
    ];

    const data = warehouses.map((w) => ({
      code: w.code,
      name: w.name,
      country: w.country ?? '',
      city: w.city ?? '',
      address: w.address ?? '',
      timezone: w.timezone ?? '',
      contactName: w.contactName ?? '',
      status: statusMap[w.status] ?? w.status,
    }));

    const buffer = await this.excelService.generateExcel('창고목록', columns, data);
    const filename = this.getFilename('warehouses');
    this.setExcelHeaders(res, filename);
    this.setExportWarningHeader(res, warehouses.length);
    res.end(buffer);
  }

  @ApiOperation({ summary: '채널 주문 엑셀 다운로드' })
  @Get('channel-orders')
  async exportChannelOrders(
    @Query('channelId') channelId: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const where: any = {};
    if (channelId) where.channelId = channelId;
    if (status) where.status = status;

    const orders = await this.prisma.channelOrder.findMany({
      where,
      include: { channel: true, items: true },
      orderBy: { orderDate: 'desc' },
      take: MAX_EXPORT_ROWS,
    });

    const columns = [
      { header: '플랫폼', key: 'platform' },
      { header: '채널명', key: 'channelName' },
      { header: '주문번호', key: 'platformOrderNo' },
      { header: '상태', key: 'status' },
      { header: '주문일', key: 'orderDate' },
      { header: '고객명', key: 'customerName' },
      { header: '배송지', key: 'shippingAddress' },
      { header: '금액', key: 'totalAmount' },
      { header: '통화', key: 'currency' },
      { header: '운송장번호', key: 'trackingNumber' },
      { header: '출하일', key: 'shippedAt' },
    ];

    const data = orders.map((o) => ({
      platform: o.channel?.platform ?? '',
      channelName: o.channel?.name ?? '',
      platformOrderNo: o.platformOrderNo ?? o.platformOrderId,
      status: o.status,
      orderDate: this.formatDate(o.orderDate),
      customerName: o.customerName ?? '',
      shippingAddress: o.shippingAddress ?? '',
      totalAmount: o.totalAmount ?? '',
      currency: o.currency ?? '',
      trackingNumber: o.trackingNumber ?? '',
      shippedAt: this.formatDateTime(o.shippedAt),
    }));

    const buffer = await this.excelService.generateExcel('채널주문', columns, data);
    const filename = this.getFilename('channel_orders');
    this.setExcelHeaders(res, filename);
    this.setExportWarningHeader(res, orders.length);
    res.end(buffer);
  }
}
