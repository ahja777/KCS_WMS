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
exports.UpdateLocationDto = exports.CreateLocationDto = exports.LocationStatus = exports.UpdateZoneDto = exports.CreateZoneDto = exports.ZoneType = exports.UpdateWarehouseDto = exports.CreateWarehouseDto = exports.WarehouseStatus = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var WarehouseStatus;
(function (WarehouseStatus) {
    WarehouseStatus["ACTIVE"] = "ACTIVE";
    WarehouseStatus["INACTIVE"] = "INACTIVE";
    WarehouseStatus["MAINTENANCE"] = "MAINTENANCE";
})(WarehouseStatus || (exports.WarehouseStatus = WarehouseStatus = {}));
class CreateWarehouseDto {
}
exports.CreateWarehouseDto = CreateWarehouseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'WH-NY-01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'New York Warehouse' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'US' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'New York' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '456 Logistics Ave, NY 10001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '10001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "zipCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'America/New_York' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: WarehouseStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(WarehouseStatus),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "contactName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "contactPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "contactEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWarehouseDto.prototype, "notes", void 0);
class UpdateWarehouseDto extends (0, swagger_1.PartialType)(CreateWarehouseDto) {
}
exports.UpdateWarehouseDto = UpdateWarehouseDto;
var ZoneType;
(function (ZoneType) {
    ZoneType["RECEIVING"] = "RECEIVING";
    ZoneType["STORAGE"] = "STORAGE";
    ZoneType["PICKING"] = "PICKING";
    ZoneType["PACKING"] = "PACKING";
    ZoneType["SHIPPING"] = "SHIPPING";
    ZoneType["QUARANTINE"] = "QUARANTINE";
    ZoneType["RETURN"] = "RETURN";
})(ZoneType || (exports.ZoneType = ZoneType = {}));
class CreateZoneDto {
}
exports.CreateZoneDto = CreateZoneDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'STR-C' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Storage Area C' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ZoneType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ZoneType),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateZoneDto.prototype, "description", void 0);
class UpdateZoneDto extends (0, swagger_1.PartialType)(CreateZoneDto) {
}
exports.UpdateZoneDto = UpdateZoneDto;
var LocationStatus;
(function (LocationStatus) {
    LocationStatus["AVAILABLE"] = "AVAILABLE";
    LocationStatus["OCCUPIED"] = "OCCUPIED";
    LocationStatus["RESERVED"] = "RESERVED";
    LocationStatus["BLOCKED"] = "BLOCKED";
})(LocationStatus || (exports.LocationStatus = LocationStatus = {}));
class CreateLocationDto {
}
exports.CreateLocationDto = CreateLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A01-R01-L1-B01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "aisle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'R01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "rack", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'L1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'B01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "bin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: LocationStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(LocationStatus),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateLocationDto.prototype, "maxWeight", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateLocationDto.prototype, "maxVolume", void 0);
class UpdateLocationDto extends (0, swagger_1.PartialType)(CreateLocationDto) {
}
exports.UpdateLocationDto = UpdateLocationDto;
//# sourceMappingURL=warehouse.dto.js.map