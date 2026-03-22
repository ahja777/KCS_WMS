import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ChannelPlatform } from '@prisma/client';

export class CreateChannelDto {
  @IsString()
  name: string;

  @IsEnum(ChannelPlatform)
  platform: ChannelPlatform;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsString()
  warehouseId: string;

  @IsObject()
  credentials: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  syncInterval?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  syncInterval?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class LinkProductDto {
  @IsString()
  channelId: string;

  @IsString()
  itemId: string;

  @IsOptional()
  @IsString()
  platformProductId?: string;

  @IsOptional()
  @IsString()
  platformSku?: string;
}

export class SyncOrdersDto {
  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;
}

export class ConfirmShipmentDto {
  @IsString()
  channelOrderId: string;

  @IsString()
  carrier: string;

  @IsString()
  trackingNumber: string;
}
