import { IsString, IsOptional, IsNotEmpty, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// 명의변경
export class CreateOwnershipTransferDto {
  @ApiProperty() @IsString() @IsNotEmpty() workNumber: string;
  @ApiProperty() @IsDateString() workDate: string;
  @ApiProperty() @IsString() fromPartnerId: string;
  @ApiProperty() @IsString() fromItemId: string;
  @ApiProperty() @IsNumber() fromQuantity: number;
  @ApiProperty() @IsString() fromUom: string;
  @ApiProperty() @IsString() toPartnerId: string;
  @ApiProperty() @IsString() toItemId: string;
  @ApiProperty() @IsNumber() toQuantity: number;
  @ApiProperty() @IsString() toUom: string;
}
export class UpdateOwnershipTransferDto extends PartialType(CreateOwnershipTransferDto) {}

// 임가공/조립
export class CreateAssemblyDto {
  @ApiProperty() @IsString() @IsNotEmpty() workNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() workDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
export class UpdateAssemblyDto extends PartialType(CreateAssemblyDto) {}

export class CreateAssemblyItemDto {
  @ApiProperty() @IsString() assemblyId: string;
  @ApiProperty() @IsString() itemId: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiProperty() @IsString() uom: string;
  @ApiProperty() @IsString() type: string; // INPUT or OUTPUT
  @ApiPropertyOptional() @IsOptional() @IsString() locationCode?: string;
}

// 재고이동
export class CreateStockTransferDto {
  @ApiPropertyOptional() @IsOptional() @IsString() partnerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemId?: string;
  @ApiProperty() @IsString() fromLocationCode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() toLocationCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemGroupCode?: string;
  @ApiProperty() @IsNumber() quantity: number;
}
export class UpdateStockTransferDto extends PartialType(CreateStockTransferDto) {}

// 마감관리
export class CreatePeriodCloseDto {
  @ApiProperty() @IsString() periodType: string;
  @ApiProperty() @IsDateString() periodDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

// LOC별입고상품
export class CreateLocationProductDto {
  @ApiProperty() @IsString() @IsNotEmpty() locationCode: string;
  @ApiProperty() @IsString() @IsNotEmpty() itemId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() centerId?: string;
}
export class UpdateLocationProductDto extends PartialType(CreateLocationProductDto) {}

// 세트품목
export class CreateSetItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() parentItemId: string;
  @ApiProperty() @IsString() @IsNotEmpty() childItemId: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsNumber() quantity?: number;
}

// 거래처별상품
export class CreatePartnerProductDto {
  @ApiProperty() @IsString() @IsNotEmpty() partnerId: string;
  @ApiProperty() @IsString() @IsNotEmpty() customerPartnerId: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() expiryControl?: boolean;
}
