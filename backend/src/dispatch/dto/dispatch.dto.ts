import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DispatchItemDto {
  @ApiProperty({ description: '품목코드' })
  @IsString()
  @IsNotEmpty()
  itemCode: string;

  @ApiProperty({ description: '품목명' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ description: '주문수량' })
  @IsInt()
  orderedQty: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  dispatchedQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDispatchDto {
  @ApiProperty({ description: '창고 ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ description: '차량 ID' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: '입고주문 ID' })
  @IsOptional()
  @IsString()
  inboundOrderId?: string;

  @ApiPropertyOptional({ description: '출고주문 ID' })
  @IsOptional()
  @IsString()
  outboundOrderId?: string;

  @ApiProperty({ description: '배차일' })
  @IsDateString()
  dispatchDate: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  dispatchSeq?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ type: [DispatchItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispatchItemDto)
  items?: DispatchItemDto[];
}

export class UpdateDispatchDto extends PartialType(CreateDispatchDto) {}
