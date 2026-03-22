import {
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateItemGroupDto {
  @ApiProperty({ example: 'GRP-001', description: '상품군 코드' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '식품류', description: '상품군명' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '분류유형' })
  @IsOptional()
  @IsString()
  groupType?: string;

  @ApiPropertyOptional({ description: '입고존' })
  @IsOptional()
  @IsString()
  inboundZone?: string;
}

export class UpdateItemGroupDto extends PartialType(CreateItemGroupDto) {}
