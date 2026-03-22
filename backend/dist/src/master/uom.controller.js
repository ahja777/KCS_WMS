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
exports.UomController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const uom_service_1 = require("./uom.service");
const uom_dto_1 = require("./dto/uom.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let UomController = class UomController {
    constructor(uomService) {
        this.uomService = uomService;
    }
    findAll(query) {
        return this.uomService.findAll(query);
    }
    findOne(id) {
        return this.uomService.findById(id);
    }
    create(dto) {
        return this.uomService.create(dto);
    }
    update(id, dto) {
        return this.uomService.update(id, dto);
    }
    remove(id) {
        return this.uomService.delete(id);
    }
    findConversions(id) {
        return this.uomService.findConversions(id);
    }
    createConversion(id, dto) {
        return this.uomService.createConversion(id, dto);
    }
};
exports.UomController = UomController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'UOM 목록 조회' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], UomController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'UOM 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UomController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'UOM 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [uom_dto_1.CreateUomMasterDto]),
    __metadata("design:returntype", void 0)
], UomController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'UOM 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, uom_dto_1.UpdateUomMasterDto]),
    __metadata("design:returntype", void 0)
], UomController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'UOM 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UomController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/conversions'),
    (0, swagger_1.ApiOperation)({ summary: 'UOM 환산 목록 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UomController.prototype, "findConversions", null);
__decorate([
    (0, common_1.Post)(':id/conversions'),
    (0, swagger_1.ApiOperation)({ summary: 'UOM 환산 등록' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, uom_dto_1.CreateUomConversionDto]),
    __metadata("design:returntype", void 0)
], UomController.prototype, "createConversion", null);
exports.UomController = UomController = __decorate([
    (0, swagger_1.ApiTags)('UOM'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('uom'),
    __metadata("design:paramtypes", [uom_service_1.UomService])
], UomController);
//# sourceMappingURL=uom.controller.js.map