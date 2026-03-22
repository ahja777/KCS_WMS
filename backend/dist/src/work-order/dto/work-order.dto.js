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
exports.UpdateWorkOrderDto = exports.CreateWorkOrderDto = exports.WorkOrderItemDto = exports.WorkOrderType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var WorkOrderType;
(function (WorkOrderType) {
    WorkOrderType["RECEIVING"] = "RECEIVING";
    WorkOrderType["PUTAWAY"] = "PUTAWAY";
    WorkOrderType["PICKING"] = "PICKING";
    WorkOrderType["PACKING"] = "PACKING";
    WorkOrderType["LOADING"] = "LOADING";
    WorkOrderType["MOVEMENT"] = "MOVEMENT";
    WorkOrderType["COUNT"] = "COUNT";
})(WorkOrderType || (exports.WorkOrderType = WorkOrderType = {}));
class WorkOrderItemDto {
}
exports.WorkOrderItemDto = WorkOrderItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '품목코드' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkOrderItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '품목명' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkOrderItemDto.prototype, "itemName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '출발 로케이션' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkOrderItemDto.prototype, "fromLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '도착 로케이션' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkOrderItemDto.prototype, "toLocation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LOT번호' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkOrderItemDto.prototype, "lotNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '계획수량' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], WorkOrderItemDto.prototype, "plannedQty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], WorkOrderItemDto.prototype, "actualQty", void 0);
class CreateWorkOrderDto {
}
exports.CreateWorkOrderDto = CreateWorkOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '창고 ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "warehouseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '작업유형', enum: WorkOrderType }),
    (0, class_validator_1.IsEnum)(WorkOrderType),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "workType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '참조유형 (INBOUND, OUTBOUND 등)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "referenceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '참조 ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "referenceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '담당자 ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "assignedTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkOrderDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [WorkOrderItemDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkOrderItemDto),
    __metadata("design:type", Array)
], CreateWorkOrderDto.prototype, "items", void 0);
class UpdateWorkOrderDto extends (0, swagger_1.PartialType)(CreateWorkOrderDto) {
}
exports.UpdateWorkOrderDto = UpdateWorkOrderDto;
//# sourceMappingURL=work-order.dto.js.map