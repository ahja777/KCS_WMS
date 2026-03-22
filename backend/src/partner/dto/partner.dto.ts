import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum PartnerType {
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER',
  CARRIER = 'CARRIER',
}

export class CreatePartnerDto {
  @ApiProperty({ example: 'SUP-003' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'New Supplier Co.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: PartnerType })
  @IsEnum(PartnerType)
  type: PartnerType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  president?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faxNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessKind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  creditRating?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shipControl?: boolean;
}

export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}
