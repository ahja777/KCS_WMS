import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateWarehouseDto {
  @ApiProperty({ example: 'WH-NY-01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'New York Warehouse' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '456 Logistics Ave, NY 10001' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: WarehouseStatus })
  @IsOptional()
  @IsEnum(WarehouseStatus)
  status?: WarehouseStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

export enum ZoneType {
  RECEIVING = 'RECEIVING',
  STORAGE = 'STORAGE',
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  SHIPPING = 'SHIPPING',
  QUARANTINE = 'QUARANTINE',
  RETURN = 'RETURN',
}

export class CreateZoneDto {
  @ApiProperty({ example: 'STR-C' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Storage Area C' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: ZoneType })
  @IsOptional()
  @IsEnum(ZoneType)
  type?: ZoneType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateZoneDto extends PartialType(CreateZoneDto) {}

export enum LocationStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  BLOCKED = 'BLOCKED',
}

export class CreateLocationDto {
  @ApiProperty({ example: 'A01-R01-L1-B01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'A01' })
  @IsString()
  @IsNotEmpty()
  aisle: string;

  @ApiProperty({ example: 'R01' })
  @IsString()
  @IsNotEmpty()
  rack: string;

  @ApiProperty({ example: 'L1' })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({ example: 'B01' })
  @IsString()
  @IsNotEmpty()
  bin: string;

  @ApiPropertyOptional({ enum: LocationStatus })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  maxWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maxVolume?: number;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}
