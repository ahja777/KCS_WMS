import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MovementItemDto {
  @ApiProperty({ description: '품목코드' })
  @IsString()
  @IsNotEmpty()
  itemCode: string;

  @ApiProperty({ description: '품목명' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: '출발 로케이션' })
  @IsOptional()
  @IsString()
  fromLocation?: string;

  @ApiPropertyOptional({ description: '도착 로케이션' })
  @IsOptional()
  @IsString()
  toLocation?: string;

  @ApiPropertyOptional({ description: 'LOT번호' })
  @IsOptional()
  @IsString()
  lotNo?: string;

  @ApiPropertyOptional({ default: 0, description: '현재고' })
  @IsOptional()
  @IsInt()
  stockQty?: number;

  @ApiProperty({ description: '이동수량' })
  @IsInt()
  moveQty: number;

  @ApiPropertyOptional({ description: 'UOM' })
  @IsOptional()
  @IsString()
  uom?: string;
}

export class CreateInventoryMovementDto {
  @ApiProperty({ description: '창고 ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiPropertyOptional({ description: '출발 창고 ID (창고간 이동)' })
  @IsOptional()
  @IsString()
  fromWarehouseId?: string;

  @ApiPropertyOptional({ description: '도착 창고 ID (창고간 이동)' })
  @IsOptional()
  @IsString()
  toWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  performedBy?: string;

  @ApiProperty({ type: [MovementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovementItemDto)
  items: MovementItemDto[];
}
