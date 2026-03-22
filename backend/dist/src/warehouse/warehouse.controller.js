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
exports.WarehouseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const warehouse_service_1 = require("./warehouse.service");
const warehouse_dto_1 = require("./dto/warehouse.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let WarehouseController = class WarehouseController {
    constructor(warehouseService) {
        this.warehouseService = warehouseService;
    }
    findAll(query) {
        return this.warehouseService.findAllWarehouses(query);
    }
    findOne(id) {
        return this.warehouseService.findWarehouseById(id);
    }
    create(dto) {
        return this.warehouseService.createWarehouse(dto);
    }
    update(id, dto) {
        return this.warehouseService.updateWarehouse(id, dto);
    }
    remove(id) {
        return this.warehouseService.deleteWarehouse(id);
    }
    findZones(warehouseId) {
        return this.warehouseService.findZonesByWarehouse(warehouseId);
    }
    findZone(warehouseId, zoneId) {
        return this.warehouseService.findZoneById(warehouseId, zoneId);
    }
    createZone(warehouseId, dto) {
        return this.warehouseService.createZone(warehouseId, dto);
    }
    updateZone(warehouseId, zoneId, dto) {
        return this.warehouseService.updateZone(warehouseId, zoneId, dto);
    }
    removeZone(warehouseId, zoneId) {
        return this.warehouseService.deleteZone(warehouseId, zoneId);
    }
    findLocations(warehouseId, zoneId) {
        return this.warehouseService.findLocationsByZone(warehouseId, zoneId);
    }
    createLocation(warehouseId, zoneId, dto) {
        return this.warehouseService.createLocation(warehouseId, zoneId, dto);
    }
    updateLocation(warehouseId, zoneId, locationId, dto) {
        return this.warehouseService.updateLocation(warehouseId, zoneId, locationId, dto);
    }
    removeLocation(warehouseId, zoneId, locationId) {
        return this.warehouseService.deleteLocation(warehouseId, zoneId, locationId);
    }
};
exports.WarehouseController = WarehouseController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '창고 목록 조회' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '창고 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '창고 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [warehouse_dto_1.CreateWarehouseDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '창고 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, warehouse_dto_1.UpdateWarehouseDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '창고 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':warehouseId/zones'),
    (0, swagger_1.ApiOperation)({ summary: '창고 구역 목록 조회' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findZones", null);
__decorate([
    (0, common_1.Get)(':warehouseId/zones/:zoneId'),
    (0, swagger_1.ApiOperation)({ summary: '구역 상세 조회' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('zoneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findZone", null);
__decorate([
    (0, common_1.Post)(':warehouseId/zones'),
    (0, swagger_1.ApiOperation)({ summary: '구역 생성' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, warehouse_dto_1.CreateZoneDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "createZone", null);
__decorate([
    (0, common_1.Put)(':warehouseId/zones/:zoneId'),
    (0, swagger_1.ApiOperation)({ summary: '구역 수정' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('zoneId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, warehouse_dto_1.UpdateZoneDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "updateZone", null);
__decorate([
    (0, common_1.Delete)(':warehouseId/zones/:zoneId'),
    (0, swagger_1.ApiOperation)({ summary: '구역 삭제' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('zoneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "removeZone", null);
__decorate([
    (0, common_1.Get)(':warehouseId/zones/:zoneId/locations'),
    (0, swagger_1.ApiOperation)({ summary: '로케이션 목록 조회' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('zoneId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "findLocations", null);
__decorate([
    (0, common_1.Post)(':warehouseId/zones/:zoneId/locations'),
    (0, swagger_1.ApiOperation)({ summary: '로케이션 생성' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('zoneId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, warehouse_dto_1.CreateLocationDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "createLocation", null);
__decorate([
    (0, common_1.Put)(':warehouseId/zones/:zoneId/locations/:locationId'),
    (0, swagger_1.ApiOperation)({ summary: '로케이션 수정' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('zoneId')),
    __param(2, (0, common_1.Param)('locationId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, warehouse_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Delete)(':warehouseId/zones/:zoneId/locations/:locationId'),
    (0, swagger_1.ApiOperation)({ summary: '로케이션 삭제' }),
    __param(0, (0, common_1.Param)('warehouseId')),
    __param(1, (0, common_1.Param)('zoneId')),
    __param(2, (0, common_1.Param)('locationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WarehouseController.prototype, "removeLocation", null);
exports.WarehouseController = WarehouseController = __decorate([
    (0, swagger_1.ApiTags)('Warehouse'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('warehouses'),
    __metadata("design:paramtypes", [warehouse_service_1.WarehouseService])
], WarehouseController);
//# sourceMappingURL=warehouse.controller.js.map