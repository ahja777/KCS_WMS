"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../prisma/prisma.service");
const excel_service_1 = require("../services/excel.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const MAX_EXPORT_ROWS = 10000;
let ExportController = class ExportController {
    constructor(prisma, excelService) {
        this.prisma = prisma;
        this.excelService = excelService;
    }
    setExportWarningHeader(res, count) {
        if (count >= MAX_EXPORT_ROWS) {
            res.setHeader('X-Export-Warning', `Result limited to ${MAX_EXPORT_ROWS} rows. Apply filters to narrow results.`);
        }
    }
    formatDate(date) {
        if (!date)
            return '';
        return new Date(date).toISOString().slice(0, 10);
    }
    formatDateTime(date) {
        if (!date)
            return '';
        return new Date(date).toISOString().replace('T', ' ').slice(0, 19);
    }
    getFilename(prefix) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${prefix}_${today}.xlsx`;
    }
    setExcelHeaders(res, filename) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    async exportInventory(warehouseId, res) {
        const where = {};
        if (warehouseId)
            where.warehouseId = warehouseId;
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
    async exportItems(res) {
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
    async exportInbound(status, warehouseId, res) {
        const where = {};
        if (status)
            where.status = status;
        if (warehouseId)
            where.warehouseId = warehouseId;
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
    async exportOutbound(status, warehouseId, res) {
        const where = {};
        if (status)
            where.status = status;
        if (warehouseId)
            where.warehouseId = warehouseId;
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
    async exportPartners(type, res) {
        const where = {};
        if (type)
            where.type = type;
        const partners = await this.prisma.partner.findMany({
            where,
            orderBy: { code: 'asc' },
            take: MAX_EXPORT_ROWS,
        });
        const typeMap = {
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
    async exportWarehouses(res) {
        const warehouses = await this.prisma.warehouse.findMany({
            orderBy: { code: 'asc' },
            take: MAX_EXPORT_ROWS,
        });
        const statusMap = {
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
    async exportChannelOrders(channelId, status, res) {
        const where = {};
        if (channelId)
            where.channelId = channelId;
        if (status)
            where.status = status;
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
};
exports.ExportController = ExportController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '재고 현황 엑셀 다운로드' }),
    (0, common_1.Get)('inventory'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportInventory", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '품목 마스터 엑셀 다운로드' }),
    (0, common_1.Get)('items'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportItems", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '입고 주문 엑셀 다운로드' }),
    (0, common_1.Get)('inbound'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('warehouseId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportInbound", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 엑셀 다운로드' }),
    (0, common_1.Get)('outbound'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('warehouseId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportOutbound", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '거래처 목록 엑셀 다운로드' }),
    (0, common_1.Get)('partners'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportPartners", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '창고 목록 엑셀 다운로드' }),
    (0, common_1.Get)('warehouses'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportWarehouses", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '채널 주문 엑셀 다운로드' }),
    (0, common_1.Get)('channel-orders'),
    __param(0, (0, common_1.Query)('channelId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportChannelOrders", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiTags)('Export'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('export'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        excel_service_1.ExcelService])
], ExportController);
//# sourceMappingURL=export.controller.js.map