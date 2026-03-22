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
exports.CommonCodeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_code_service_1 = require("./common-code.service");
const common_code_dto_1 = require("./dto/common-code.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let CommonCodeController = class CommonCodeController {
    constructor(commonCodeService) {
        this.commonCodeService = commonCodeService;
    }
    findAll(query, groupCode) {
        return this.commonCodeService.findAll({ ...query, groupCode });
    }
    findOne(id) {
        return this.commonCodeService.findById(id);
    }
    create(dto) {
        return this.commonCodeService.create(dto);
    }
    update(id, dto) {
        return this.commonCodeService.update(id, dto);
    }
    remove(id) {
        return this.commonCodeService.delete(id);
    }
};
exports.CommonCodeController = CommonCodeController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '공통코드 목록 조회' }),
    (0, swagger_1.ApiQuery)({ name: 'groupCode', required: false, description: '코드유형 필터' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('groupCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, String]),
    __metadata("design:returntype", void 0)
], CommonCodeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '공통코드 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommonCodeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '공통코드 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [common_code_dto_1.CreateCommonCodeDto]),
    __metadata("design:returntype", void 0)
], CommonCodeController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '공통코드 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, common_code_dto_1.UpdateCommonCodeDto]),
    __metadata("design:returntype", void 0)
], CommonCodeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '공통코드 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommonCodeController.prototype, "remove", null);
exports.CommonCodeController = CommonCodeController = __decorate([
    (0, swagger_1.ApiTags)('CommonCode'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('common-codes'),
    __metadata("design:paramtypes", [common_code_service_1.CommonCodeService])
], CommonCodeController);
//# sourceMappingURL=common-code.controller.js.map