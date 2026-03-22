import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum AdjustmentReason {
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  LOST = 'LOST',
  FOUND = 'FOUND',
  CORRECTION = 'CORRECTION',
  OTHER = 'OTHER',
}

export class StockAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: 'SKU-ELC-001' })
  @IsString()
  @IsNotEmpty()
  itemCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNo?: string;

  @ApiProperty({ example: -5, description: 'Positive for increase, negative for decrease' })
  @IsInt()
  adjustQty: number;

  @ApiProperty({ enum: AdjustmentReason })
  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  performedBy: string;
}

export class CreateCycleCountDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  systemQty: number;
}

export class CompleteCycleCountDto {
  @ApiProperty({ example: 98 })
  @IsInt()
  countedQty: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  countedBy: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InventoryQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemCode?: string;
}

export class TransferDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: 'SKU-ELC-001' })
  @IsString()
  @IsNotEmpty()
  itemCode: string;

  @ApiProperty({ example: 'A-01-01' })
  @IsString()
  @IsNotEmpty()
  fromLocationCode: string;

  @ApiProperty({ example: 'B-02-01' })
  @IsString()
  @IsNotEmpty()
  toLocationCode: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNo?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  performedBy: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransactionQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
