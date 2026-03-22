import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOutboundOrderItemDto {
  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  orderedQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOutboundOrderDto {
  @ApiPropertyOptional({ example: 'OB-2026-0001', description: '미입력시 자동생성' })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiProperty()
  @IsUUID()
  partnerId: string;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ example: '2026-04-05T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  shipDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateOutboundOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOutboundOrderItemDto)
  items: CreateOutboundOrderItemDto[];
}

export class UpdateOutboundOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  shipDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shippingMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PickItemDto {
  @ApiProperty()
  @IsUUID()
  outboundOrderItemId: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  pickedQty: number;
}

export class PickOutboundDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pickedBy: string;

  @ApiProperty({ type: [PickItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickItemDto)
  items: PickItemDto[];
}

export class ShipOutboundDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippedBy: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
