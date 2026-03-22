"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChannelService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const coupang_adapter_1 = require("../adapters/coupang.adapter");
const naver_adapter_1 = require("../adapters/naver.adapter");
const amazon_adapter_1 = require("../adapters/amazon.adapter");
let ChannelService = ChannelService_1 = class ChannelService {
    constructor(prisma, coupangAdapter, naverAdapter, amazonAdapter) {
        this.prisma = prisma;
        this.coupangAdapter = coupangAdapter;
        this.naverAdapter = naverAdapter;
        this.amazonAdapter = amazonAdapter;
        this.logger = new common_1.Logger(ChannelService_1.name);
    }
    getAdapter(platform) {
        switch (platform) {
            case 'COUPANG':
                return this.coupangAdapter;
            case 'NAVER':
                return this.naverAdapter;
            case 'AMAZON':
                return this.amazonAdapter;
            default:
                throw new common_1.BadRequestException(`지원하지 않는 플랫폼입니다: ${platform}. 현재 COUPANG, NAVER, AMAZON을 지원합니다.`);
        }
    }
    async findAll(params) {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (params?.platform)
            where.platform = params.platform;
        if (params?.status)
            where.status = params.status;
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
        const maskedData = data.map((ch) => ({
            ...ch,
            credentials: this.maskCredentials(ch.credentials),
        }));
        return {
            data: maskedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
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
        if (!channel)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        return {
            ...channel,
            credentials: this.maskCredentials(channel.credentials),
        };
    }
    async create(dto) {
        const channel = await this.prisma.salesChannel.create({
            data: {
                name: dto.name,
                platform: dto.platform,
                sellerId: dto.sellerId,
                warehouseId: dto.warehouseId,
                credentials: dto.credentials,
                syncEnabled: dto.syncEnabled ?? true,
                syncInterval: dto.syncInterval ?? 10,
                notes: dto.notes,
                status: 'PENDING',
            },
            include: { warehouse: true },
        });
        return {
            ...channel,
            credentials: this.maskCredentials(channel.credentials),
        };
    }
    async update(id, dto) {
        const existing = await this.prisma.salesChannel.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.sellerId !== undefined)
            updateData.sellerId = dto.sellerId;
        if (dto.syncEnabled !== undefined)
            updateData.syncEnabled = dto.syncEnabled;
        if (dto.syncInterval !== undefined)
            updateData.syncInterval = dto.syncInterval;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes;
        if (dto.credentials) {
            const existingCreds = existing.credentials;
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
            credentials: this.maskCredentials(channel.credentials),
        };
    }
    async remove(id) {
        const channel = await this.prisma.salesChannel.findUnique({ where: { id } });
        if (!channel)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        await this.prisma.salesChannel.delete({ where: { id } });
        return { message: '채널이 삭제되었습니다.' };
    }
    async testConnection(id) {
        const channel = await this.prisma.salesChannel.findUnique({ where: { id } });
        if (!channel)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        const adapter = this.getAdapter(channel.platform);
        const credentials = channel.credentials;
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
    async toggleSync(id, enabled) {
        const channel = await this.prisma.salesChannel.findUnique({ where: { id } });
        if (!channel)
            throw new common_1.NotFoundException('채널을 찾을 수 없습니다.');
        return this.prisma.salesChannel.update({
            where: { id },
            data: { syncEnabled: enabled },
        });
    }
    async getSyncLogs(channelId, limit = 20) {
        return this.prisma.channelSyncLog.findMany({
            where: { channelId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    maskCredentials(creds) {
        const masked = {};
        for (const [key, value] of Object.entries(creds)) {
            if (typeof value === 'string' && value.length > 4) {
                masked[key] = value.slice(0, 4) + '****';
            }
            else {
                masked[key] = '****';
            }
        }
        return masked;
    }
};
exports.ChannelService = ChannelService;
exports.ChannelService = ChannelService = ChannelService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        coupang_adapter_1.CoupangAdapter,
        naver_adapter_1.NaverAdapter,
        amazon_adapter_1.AmazonAdapter])
], ChannelService);
//# sourceMappingURL=channel.service.js.map