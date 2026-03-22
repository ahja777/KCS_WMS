import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateDockDto {
  @ApiProperty({ description: '창고 ID' })
  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @ApiProperty({ example: 'DOCK-01', description: '도크 코드' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '1번 도크', description: '도크명' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 0, description: '정렬순서' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ example: 10.0, description: '최대 톤수' })
  @IsOptional()
  @IsNumber()
  maxTonnage?: number;

  @ApiPropertyOptional({ description: '배정 차량번호' })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @ApiPropertyOptional({ description: '비고' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDockDto extends PartialType(CreateDockDto) {}
