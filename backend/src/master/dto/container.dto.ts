import { IsString, IsOptional, IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateContainerDto {
  @ApiProperty({ description: '용기코드' }) @IsString() @IsNotEmpty() containerCode: string;
  @ApiProperty({ description: '용기명' }) @IsString() @IsNotEmpty() containerName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() containerGroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inboundWarehouseCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inboundZone?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() shelfLife?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() shelfLifeDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() weight?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() size?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() optimalStock?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() stockUnit?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() unitPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() assetType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tagPrefix?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyEpcCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() weightToleranceKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() optimalStockDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() expiryDays?: number;
}
export class UpdateContainerDto extends PartialType(CreateContainerDto) {}

export class CreateContainerGroupDto {
  @ApiProperty({ description: '용기군코드' }) @IsString() @IsNotEmpty() groupCode: string;
  @ApiProperty({ description: '용기군명' }) @IsString() @IsNotEmpty() groupName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() centerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zoneId?: string;
}
export class UpdateContainerGroupDto extends PartialType(CreateContainerGroupDto) {}
