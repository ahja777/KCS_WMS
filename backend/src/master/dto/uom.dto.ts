import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateUomMasterDto {
  @ApiProperty({ example: 'EA', description: 'UOM 코드' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '개', description: 'UOM명' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateUomMasterDto extends PartialType(CreateUomMasterDto) {}

export class CreateUomConversionDto {
  @ApiPropertyOptional({ description: '품목 ID (특정 품목 전용 환산)' })
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiProperty({ description: '변환 대상 UOM ID' })
  @IsString()
  @IsNotEmpty()
  toUomId: string;

  @ApiProperty({ example: 10, description: '환산 수량' })
  @IsNumber()
  convQty: number;

  @ApiPropertyOptional({ description: '시작일' })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: '종료일' })
  @IsOptional()
  endDate?: Date;
}
