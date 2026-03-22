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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./dto/inventory.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getCurrentStock(query) {
        return this.inventoryService.getCurrentStock(query);
    }
    getStockByItem(itemId) {
        return this.inventoryService.getStockByItem(itemId);
    }
    getStockSummary(warehouseId) {
        return this.inventoryService.getStockSummary(warehouseId);
    }
    createAdjustment(dto) {
        return this.inventoryService.createAdjustment(dto);
    }
    getAdjustments(warehouseId) {
        return this.inventoryService.getAdjustments(warehouseId);
    }
    transferStock(dto) {
        return this.inventoryService.transferStock(dto);
    }
    createCycleCount(dto) {
        return this.inventoryService.createCycleCount(dto);
    }
    getCycleCounts(warehouseId, status) {
        return this.inventoryService.getCycleCounts(warehouseId, status);
    }
    completeCycleCount(id, dto) {
        return this.inventoryService.completeCycleCount(id, dto);
    }
    getTransactions(query) {
        return this.inventoryService.getTransactions(query);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('stock'),
    (0, swagger_1.ApiOperation)({ summary: '현재 재고 조회' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.InventoryQueryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getCurrentStock", null);
__decorate([
    (0, common_1.Get)('stock/item/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: '품목별 재고 조회' }),
    __param(0, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStockByItem", null);
__decorate([
    (0, common_1.Get)('stock/summary/:warehouseId'),
    (0, swagger_1.ApiOperation)({ summary: '창고별 재고 요약' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStockSummary", null);
__decorate([
    (0, common_1.Post)('adjustments'),
    (0, swagger_1.ApiOperation)({ summary: '재고 조정' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.StockAdjustmentDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createAdjustment", null);
__decorate([
    (0, common_1.Get)('adjustments'),
    (0, swagger_1.ApiOperation)({ summary: '재고 조정 내역 조회' }),
    (0, swagger_1.ApiQuery)({ name: 'warehouseId', required: false }),
    __param(0, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAdjustments", null);
__decorate([
    (0, common_1.Post)('transfer'),
    (0, swagger_1.ApiOperation)({ summary: '재고 이동 (로케이션 간 이동)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.TransferDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "transferStock", null);
__decorate([
    (0, common_1.Post)('cycle-counts'),
    (0, swagger_1.ApiOperation)({ summary: '순환 실사 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateCycleCountDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createCycleCount", null);
__decorate([
    (0, common_1.Get)('cycle-counts'),
    (0, swagger_1.ApiOperation)({ summary: '순환 실사 목록 조회' }),
    (0, swagger_1.ApiQuery)({ name: 'warehouseId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getCycleCounts", null);
__decorate([
    (0, common_1.Post)('cycle-counts/:id/complete'),
    (0, swagger_1.ApiOperation)({ summary: '순환 실사 완료' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.CompleteCycleCountDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "completeCycleCount", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: '재고 이동 이력 조회' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.TransactionQueryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getTransactions", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map