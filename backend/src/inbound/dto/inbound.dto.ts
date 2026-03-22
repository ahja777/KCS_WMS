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

export class CreateInboundOrderItemDto {
  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  expectedQty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInboundOrderDto {
  @ApiPropertyOptional({ example: 'IB-2026-0001', description: '미입력시 자동생성' })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiProperty()
  @IsUUID()
  partnerId: string;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @IsDateString()
  expectedDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateInboundOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInboundOrderItemDto)
  items: CreateInboundOrderItemDto[];
}

export class UpdateInboundOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveItemDto {
  @ApiProperty()
  @IsUUID()
  inboundOrderItemId: string;

  @ApiProperty({ example: 95 })
  @IsInt()
  @Min(1)
  receivedQty: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  damagedQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveInboundDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  receivedBy: string;

  @ApiProperty({ type: [ReceiveItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}
