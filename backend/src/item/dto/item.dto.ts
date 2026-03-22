import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum ItemCategory {
  GENERAL = 'GENERAL',
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  FOOD = 'FOOD',
  FRAGILE = 'FRAGILE',
  HAZARDOUS = 'HAZARDOUS',
  OVERSIZED = 'OVERSIZED',
}

export enum UnitOfMeasure {
  EA = 'EA',
  BOX = 'BOX',
  PALLET = 'PALLET',
  CASE = 'CASE',
  KG = 'KG',
  LB = 'LB',
}

export class CreateItemDto {
  @ApiProperty({ example: 'SKU-NEW-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'New Product' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '8801234560099' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ enum: ItemCategory })
  @IsOptional()
  @IsEnum(ItemCategory)
  category?: ItemCategory;

  @ApiPropertyOptional({ enum: UnitOfMeasure })
  @IsOptional()
  @IsEnum(UnitOfMeasure)
  uom?: UnitOfMeasure;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  length?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  minStock?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsInt()
  maxStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inboundZone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lotControl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  expiryControl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  expiryDays?: number;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}
