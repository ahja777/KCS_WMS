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
exports.ExternalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const channel_service_1 = require("./services/channel.service");
const channel_sync_service_1 = require("./services/channel-sync.service");
const channel_dto_1 = require("./dto/channel.dto");
let ExternalController = class ExternalController {
    constructor(channelService, syncService) {
        this.channelService = channelService;
        this.syncService = syncService;
    }
    findAll(page, limit, platform, status) {
        return this.channelService.findAll({
            page,
            limit,
            platform: platform,
            status: status,
        });
    }
    findOne(id) {
        return this.channelService.findOne(id);
    }
    create(dto) {
        return this.channelService.create(dto);
    }
    update(id, dto) {
        return this.channelService.update(id, dto);
    }
    remove(id) {
        return this.channelService.remove(id);
    }
    testConnection(id) {
        return this.channelService.testConnection(id);
    }
    toggleSync(id, enabled) {
        return this.channelService.toggleSync(id, enabled);
    }
    syncOrders(id, dto) {
        return this.syncService.syncOrders(id, dto.fromDate, dto.toDate);
    }
    getChannelOrders(id, page, limit, status) {
        return this.syncService.getChannelOrders(id, {
            page,
            limit,
            status: status,
        });
    }
    getAllOrders(page, limit, status, platform, search) {
        return this.syncService.getAllChannelOrders({
            page,
            limit,
            status: status,
            platform,
            search,
        });
    }
    confirmShipment(dto) {
        return this.syncService.confirmShipment(dto.channelOrderId, dto.carrier, dto.trackingNumber);
    }
    syncInventory(id) {
        return this.syncService.syncInventory(id);
    }
    getLinkedProducts(id) {
        return this.syncService.getLinkedProducts(id);
    }
    linkProduct(id, dto) {
        return this.syncService.linkProduct(id, dto.itemId, dto.platformProductId, dto.platformSku);
    }
    unlinkProduct(id, itemId) {
        return this.syncService.unlinkProduct(id, itemId);
    }
    fetchChannelProducts(id) {
        return this.syncService.fetchChannelProducts(id);
    }
    getSyncLogs(id, limit) {
        return this.channelService.getSyncLogs(id, limit ? parseInt(limit, 10) : undefined);
    }
};
exports.ExternalController = ExternalController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '판매채널 목록 조회' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('platform')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '판매채널 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '판매채널 등록' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [channel_dto_1.CreateChannelDto]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '판매채널 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, channel_dto_1.UpdateChannelDto]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '판매채널 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, swagger_1.ApiOperation)({ summary: '채널 연결 테스트' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)(':id/sync/toggle'),
    (0, swagger_1.ApiOperation)({ summary: '자동 동기화 ON/OFF' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "toggleSync", null);
__decorate([
    (0, common_1.Post)(':id/sync/orders'),
    (0, swagger_1.ApiOperation)({ summary: '주문 수동 동기화' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, channel_dto_1.SyncOrdersDto]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "syncOrders", null);
__decorate([
    (0, common_1.Get)(':id/orders'),
    (0, swagger_1.ApiOperation)({ summary: '채널별 주문 목록 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "getChannelOrders", null);
__decorate([
    (0, common_1.Get)('orders/all'),
    (0, swagger_1.ApiOperation)({ summary: '전체 채널 주문 조회' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('platform')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.Post)('orders/ship'),
    (0, swagger_1.ApiOperation)({ summary: '배송 확인 전송 (채널 → 플랫폼)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [channel_dto_1.ConfirmShipmentDto]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "confirmShipment", null);
__decorate([
    (0, common_1.Post)(':id/sync/inventory'),
    (0, swagger_1.ApiOperation)({ summary: '재고 동기화 (WMS → 채널)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "syncInventory", null);
__decorate([
    (0, common_1.Get)(':id/products'),
    (0, swagger_1.ApiOperation)({ summary: '채널 연결 상품 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "getLinkedProducts", null);
__decorate([
    (0, common_1.Post)(':id/products/link'),
    (0, swagger_1.ApiOperation)({ summary: '상품 매핑 (WMS ↔ 채널)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, channel_dto_1.LinkProductDto]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "linkProduct", null);
__decorate([
    (0, common_1.Delete)(':id/products/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: '상품 매핑 해제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "unlinkProduct", null);
__decorate([
    (0, common_1.Get)(':id/products/fetch'),
    (0, swagger_1.ApiOperation)({ summary: '플랫폼 상품 목록 가져오기' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "fetchChannelProducts", null);
__decorate([
    (0, common_1.Get)(':id/sync/logs'),
    (0, swagger_1.ApiOperation)({ summary: '동기화 로그 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExternalController.prototype, "getSyncLogs", null);
exports.ExternalController = ExternalController = __decorate([
    (0, swagger_1.ApiTags)('External Channels'),
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channel_service_1.ChannelService,
        channel_sync_service_1.ChannelSyncService])
], ExternalController);
//# sourceMappingURL=external.controller.js.map