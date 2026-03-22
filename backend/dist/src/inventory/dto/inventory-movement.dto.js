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
exports.CreateInventoryMovementDto = exports.MovementItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class MovementItemDto {
}
exports.MovementItemDto = MovementItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '품목코드' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MovementItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '품목명' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MovementItemDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '출발 로케이션' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovementItemDto.prototype, "fromLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '도착 로케이션' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovementItemDto.prototype, "toLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LOT번호' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovementItemDto.prototype, "lotNo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0, description: '현재고' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], MovementItemDto.prototype, "stockQty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '이동수량' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], MovementItemDto.prototype, "moveQty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'UOM' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MovementItemDto.prototype, "uom", void 0);
class CreateInventoryMovementDto {
}
exports.CreateInventoryMovementDto = CreateInventoryMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '창고 ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "warehouseId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '출발 창고 ID (창고간 이동)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "fromWarehouseId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '도착 창고 ID (창고간 이동)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "toWarehouseId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "performedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MovementItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MovementItemDto),
    __metadata("design:type", Array)
], CreateInventoryMovementDto.prototype, "items", void 0);
//# sourceMappingURL=inventory-movement.dto.js.map