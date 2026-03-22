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
exports.UpdateDispatchDto = exports.CreateDispatchDto = exports.DispatchItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class DispatchItemDto {
}
exports.DispatchItemDto = DispatchItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '품목코드' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DispatchItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '품목명' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DispatchItemDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '주문수량' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], DispatchItemDto.prototype, "orderedQty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], DispatchItemDto.prototype, "dispatchedQty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DispatchItemDto.prototype, "notes", void 0);
class CreateDispatchDto {
}
exports.CreateDispatchDto = CreateDispatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '창고 ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDispatchDto.prototype, "warehouseId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '차량 ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchDto.prototype, "vehicleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '입고주문 ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchDto.prototype, "inboundOrderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '출고주문 ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchDto.prototype, "outboundOrderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '배차일' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateDispatchDto.prototype, "dispatchDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateDispatchDto.prototype, "dispatchSeq", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDispatchDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [DispatchItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DispatchItemDto),
    __metadata("design:type", Array)
], CreateDispatchDto.prototype, "items", void 0);
class UpdateDispatchDto extends (0, swagger_1.PartialType)(CreateDispatchDto) {
}
exports.UpdateDispatchDto = UpdateDispatchDto;
//# sourceMappingURL=dispatch.dto.js.map