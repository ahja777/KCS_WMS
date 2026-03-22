import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum WorkOrderType {
  RECEIVING = 'RECEIVING',
  PUTAWAY = 'PUTAWAY',
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  LOADING = 'LOADING',
  MOVEMENT = 'MOVEMENT',
  COUNT = 'COUNT',
}

export class WorkOrderItemDto {
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

  @ApiProperty({ description: '계획수량' })
  @IsInt()
  plannedQty: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  actualQty?: number;
}

export class CreateWorkOrderDto {
  @ApiProperty({ description: '창고 ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ description: '작업유형', enum: WorkOrderType })
  @IsEnum(WorkOrderType)
  workType: WorkOrderType;

  @ApiPropertyOptional({ description: '참조유형 (INBOUND, OUTBOUND 등)' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: '참조 ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: '담당자 ID' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ type: [WorkOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  items?: WorkOrderItemDto[];
}

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {}
