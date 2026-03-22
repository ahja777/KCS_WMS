import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelPlatform, ChannelStatus, Prisma } from '@prisma/client';
import { CreateChannelDto, UpdateChannelDto } from '../dto/channel.dto';
import { CoupangAdapter } from '../adapters/coupang.adapter';
import { NaverAdapter } from '../adapters/naver.adapter';
import { AmazonAdapter } from '../adapters/amazon.adapter';
import { IChannelAdapter } from '../adapters/channel-adapter.interface';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coupangAdapter: CoupangAdapter,
    private readonly naverAdapter: NaverAdapter,
    private readonly amazonAdapter: AmazonAdapter,
  ) {}

  getAdapter(platform: ChannelPlatform): IChannelAdapter {
    switch (platform) {
      case 'COUPANG':
        return this.coupangAdapter;
      case 'NAVER':
        return this.naverAdapter;
      case 'AMAZON':
        return this.amazonAdapter;
      default:
        throw new BadRequestException(
          `지원하지 않는 플랫폼입니다: ${platform}. 현재 COUPANG, NAVER, AMAZON을 지원합니다.`,
        );
    }
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    platform?: ChannelPlatform;
    status?: ChannelStatus;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SalesChannelWhereInput = {};
    if (params?.platform) where.platform = params.platform;
    if (params?.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.salesChannel.findMany({
        where,
        include: { warehouse: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.salesChannel.count({ where }),
    ]);

    // credentials 마스킹 처리
    const maskedData = data.map((ch) => ({
      ...ch,
      credentials: this.maskCredentials(ch.credentials as Record<string, string>),
    }));

    return {
      data: maskedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const channel = await this.prisma.salesChannel.findUnique({
      where: { id },
      include: {
        warehouse: true,
        _count: {
          select: {
            channelOrders: true,
            channelProducts: true,
          },
        },
      },
    });

    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    return {
      ...channel,
      credentials: this.maskCredentials(channel.credentials as Record<string, string>),
    };
  }

  async create(dto: CreateChannelDto) {
    const channel = await this.prisma.salesChannel.create({
      data: {
        name: dto.name,
        platform: dto.platform,
        sellerId: dto.sellerId,
        warehouseId: dto.warehouseId,
        credentials: dto.credentials as any,
        syncEnabled: dto.syncEnabled ?? true,
        syncInterval: dto.syncInterval ?? 10,
        notes: dto.notes,
        status: 'PENDING',
      },
      include: { warehouse: true },
    });

    return {
      ...channel,
      credentials: this.maskCredentials(channel.credentials as Record<string, string>),
    };
  }

  async update(id: string, dto: UpdateChannelDto) {
    const existing = await this.prisma.salesChannel.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('채널을 찾을 수 없습니다.');

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sellerId !== undefined) updateData.sellerId = dto.sellerId;
    if (dto.syncEnabled !== undefined) updateData.syncEnabled = dto.syncEnabled;
    if (dto.syncInterval !== undefined) updateData.syncInterval = dto.syncInterval;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.credentials) {
      // 기존 credentials와 병합 (마스킹된 값은 제외)
      const existingCreds = existing.credentials as Record<string, string>;
      const merged = { ...existingCreds };
      for (const [key, value] of Object.entries(dto.credentials)) {
        if (!value.includes('****')) {
          merged[key] = value;
        }
      }
      updateData.credentials = merged;
    }

    const channel = await this.prisma.salesChannel.update({
      where: { id },
      data: updateData,
      include: { warehouse: true },
    });

    return {
      ...channel,
      credentials: this.maskCredentials(channel.credentials as Record<string, string>),
    };
  }

  async remove(id: string) {
    const channel = await this.prisma.salesChannel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    await this.prisma.salesChannel.delete({ where: { id } });
    return { message: '채널이 삭제되었습니다.' };
  }

  async testConnection(id: string) {
    const channel = await this.prisma.salesChannel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    const adapter = this.getAdapter(channel.platform);
    const credentials = channel.credentials as Record<string, string>;

    const isConnected = await adapter.testConnection(credentials);

    await this.prisma.salesChannel.update({
      where: { id },
      data: {
        status: isConnected ? 'ACTIVE' : 'ERROR',
        lastSyncError: isConnected ? null : '연결 테스트 실패',
      },
    });

    return { connected: isConnected, platform: channel.platform };
  }

  async toggleSync(id: string, enabled: boolean) {
    const channel = await this.prisma.salesChannel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('채널을 찾을 수 없습니다.');

    return this.prisma.salesChannel.update({
      where: { id },
      data: { syncEnabled: enabled },
    });
  }

  // 동기화 로그 조회
  async getSyncLogs(channelId: string, limit = 20) {
    return this.prisma.channelSyncLog.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private maskCredentials(creds: Record<string, string>): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(creds)) {
      if (typeof value === 'string' && value.length > 4) {
        masked[key] = value.slice(0, 4) + '****';
      } else {
        masked[key] = '****';
      }
    }
    return masked;
  }
}
