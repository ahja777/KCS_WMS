import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsInt,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SettlementDetailDto {
  @ApiProperty({ description: '작업일' })
  @IsDateString()
  workDate: string;

  @ApiPropertyOptional({ description: '품목코드' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ description: '품목명' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  inboundQty?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  outboundQty?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  stockQty?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  inboundFee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  outboundFee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  storageFee?: number;
}

export class CreateSettlementDto {
  @ApiProperty({ description: '창고 ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ description: '거래처 ID' })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiProperty({ description: '정산 시작일' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: '정산 종료일' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  inboundFee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  outboundFee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  storageFee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  handlingFee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ type: [SettlementDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettlementDetailDto)
  details?: SettlementDetailDto[];
}

export class UpdateSettlementDto extends PartialType(CreateSettlementDto) {}
