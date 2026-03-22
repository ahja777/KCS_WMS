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
exports.OutboundController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const outbound_service_1 = require("./outbound.service");
const outbound_dto_1 = require("./dto/outbound.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let OutboundController = class OutboundController {
    constructor(outboundService) {
        this.outboundService = outboundService;
    }
    findAll(query, status, warehouseId) {
        return this.outboundService.findAll(Object.assign(query, { status, warehouseId }));
    }
    findOne(id) {
        return this.outboundService.findById(id);
    }
    create(dto) {
        return this.outboundService.create(dto);
    }
    update(id, dto) {
        return this.outboundService.update(id, dto);
    }
    remove(id) {
        return this.outboundService.delete(id);
    }
    confirm(id) {
        return this.outboundService.confirm(id);
    }
    pick(id, dto) {
        return this.outboundService.pick(id, dto);
    }
    ship(id, dto) {
        return this.outboundService.ship(id, dto);
    }
    markDelivered(id) {
        return this.outboundService.markDelivered(id);
    }
    cancel(id) {
        return this.outboundService.cancel(id);
    }
};
exports.OutboundController = OutboundController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 목록 조회' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'warehouseId', required: false }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, String, String]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [outbound_dto_1.CreateOutboundOrderDto]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, outbound_dto_1.UpdateOutboundOrderDto]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 확정 (재고 예약)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/pick'),
    (0, swagger_1.ApiOperation)({ summary: '피킹 처리' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, outbound_dto_1.PickOutboundDto]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "pick", null);
__decorate([
    (0, common_1.Post)(':id/ship'),
    (0, swagger_1.ApiOperation)({ summary: '출하 처리' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, outbound_dto_1.ShipOutboundDto]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "ship", null);
__decorate([
    (0, common_1.Post)(':id/deliver'),
    (0, swagger_1.ApiOperation)({ summary: '배송 완료 처리' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "markDelivered", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: '출고 주문 취소' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OutboundController.prototype, "cancel", null);
exports.OutboundController = OutboundController = __decorate([
    (0, swagger_1.ApiTags)('Outbound'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('outbound'),
    __metadata("design:paramtypes", [outbound_service_1.OutboundService])
], OutboundController);
//# sourceMappingURL=outbound.controller.js.map