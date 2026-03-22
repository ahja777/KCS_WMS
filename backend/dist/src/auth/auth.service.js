"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('잘못된 인증 정보입니다');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('잘못된 인증 정보입니다');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('비활성화된 계정입니다');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async login(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            user,
            accessToken: this.jwtService.sign(payload),
        };
    }
    async register(registerDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('이미 등록된 이메일입니다');
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                password: hashedPassword,
                name: registerDto.name,
                role: 'OPERATOR',
            },
        });
        const { password: _, ...result } = user;
        return result;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('사용자를 찾을 수 없습니다');
        }
        const { password: _, ...result } = user;
        return result;
    }
    async getUsers(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search } },
                { email: { contains: query.search } },
            ];
        }
        if (query.role) {
            where.role = query.role;
        }
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, page, limit);
    }
    async updateUser(id, dto, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다');
        }
        if (currentUser.id === id && dto.role && dto.role !== user.role) {
            throw new common_1.ForbiddenException('자신의 역할은 변경할 수 없습니다');
        }
        if (dto.role && dto.role !== user.role && currentUser.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('관리자만 사용자 역할을 변경할 수 있습니다');
        }
        if (dto.email && dto.email !== user.email) {
            const existing = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existing) {
                throw new common_1.ConflictException('이미 사용 중인 이메일입니다');
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.role !== undefined && { role: dto.role }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
        const { password: _, ...result } = updated;
        return result;
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다');
        const isValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isValid) {
            throw new common_1.BadRequestException('현재 비밀번호가 올바르지 않습니다');
        }
        if (dto.currentPassword === dto.newPassword) {
            throw new common_1.BadRequestException('새 비밀번호는 현재 비밀번호와 달라야 합니다');
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { message: '비밀번호가 변경되었습니다' };
    }
    async resetPassword(targetUserId, currentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('관리자만 비밀번호를 초기화할 수 있습니다');
        }
        const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user)
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다');
        const tempPassword = 'Reset1234!';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { password: hashedPassword },
        });
        return { message: '비밀번호가 초기화되었습니다', tempPassword };
    }
    async deleteUser(id, currentUserId) {
        if (currentUserId === id) {
            throw new common_1.BadRequestException('자신의 계정은 삭제할 수 없습니다');
        }
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
        const { password: _, ...result } = updated;
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map