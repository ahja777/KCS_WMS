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
exports.UpdateItemGroupDto = exports.CreateItemGroupDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateItemGroupDto {
}
exports.CreateItemGroupDto = CreateItemGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'GRP-001', description: '상품군 코드' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateItemGroupDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '식품류', description: '상품군명' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateItemGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '분류유형' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateItemGroupDto.prototype, "groupType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '입고존' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateItemGroupDto.prototype, "inboundZone", void 0);
class UpdateItemGroupDto extends (0, swagger_1.PartialType)(CreateItemGroupDto) {
}
exports.UpdateItemGroupDto = UpdateItemGroupDto;
//# sourceMappingURL=item-group.dto.js.map