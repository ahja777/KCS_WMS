import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: '12가3456', description: '차량번호' })
  @IsString()
  @IsNotEmpty()
  plateNo: string;

  @ApiProperty({ example: 5.0, description: '톤수' })
  @IsNumber()
  tonnage: number;

  @ApiPropertyOptional({ description: '운전자명' })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({ description: '운전자 연락처' })
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional({ description: '소속 창고 ID' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
