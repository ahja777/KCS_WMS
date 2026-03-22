import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCommonCodeDto {
  @ApiProperty({ example: 'WAREHOUSE_TYPE', description: '코드유형' })
  @IsString()
  @IsNotEmpty()
  codeType: string;

  @ApiProperty({ example: '창고유형', description: '유형명' })
  @IsString()
  @IsNotEmpty()
  typeNm: string;

  @ApiProperty({ example: 'COLD', description: '코드' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: '냉장창고', description: '코드명' })
  @IsString()
  @IsNotEmpty()
  codeNm: string;

  @ApiPropertyOptional({ description: '값' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ example: 0, description: '정렬순서' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCommonCodeDto extends PartialType(CreateCommonCodeDto) {}
