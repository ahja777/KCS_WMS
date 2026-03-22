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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUomConversionDto = exports.UpdateUomMasterDto = exports.CreateUomMasterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateUomMasterDto {
}
exports.CreateUomMasterDto = CreateUomMasterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EA', description: 'UOM 코드' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUomMasterDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '개', description: 'UOM명' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUomMasterDto.prototype, "name", void 0);
class UpdateUomMasterDto extends (0, swagger_1.PartialType)(CreateUomMasterDto) {
}
exports.UpdateUomMasterDto = UpdateUomMasterDto;
class CreateUomConversionDto {
}
exports.CreateUomConversionDto = CreateUomConversionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '품목 ID (특정 품목 전용 환산)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUomConversionDto.prototype, "itemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '변환 대상 UOM ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUomConversionDto.prototype, "toUomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: '환산 수량' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateUomConversionDto.prototype, "convQty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '시작일' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateUomConversionDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '종료일' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateUomConversionDto.prototype, "endDate", void 0);
//# sourceMappingURL=uom.dto.js.map