import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, ChangePasswordDto } from './dto/register.dto';
import { UpdateUserDto, UserQueryDto } from './dto/update-user.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('잘못된 인증 정보입니다');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('잘못된 인증 정보입니다');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다');
    }
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: { id: string; email: string; role: string; [key: string]: unknown }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('이미 등록된 이메일입니다');
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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }
    const { password: _, ...result } = user;
    return result;
  }

  // ─── User Management (TMSYS030) ────────────────────────

  async getUsers(query: UserQueryDto) {
    const where: any = {};

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

    return new PaginatedResult(data, total, page, limit);
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    currentUser: { id: string; role: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // Cannot change own role
    if (currentUser.id === id && dto.role && dto.role !== user.role) {
      throw new ForbiddenException('자신의 역할은 변경할 수 없습니다');
    }

    // Only ADMIN can change roles
    if (dto.role && dto.role !== user.role && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('관리자만 사용자 역할을 변경할 수 있습니다');
    }

    // Check email uniqueness if changing email
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
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

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('현재 비밀번호가 올바르지 않습니다');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('새 비밀번호는 현재 비밀번호와 달라야 합니다');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '비밀번호가 변경되었습니다' };
  }

  async resetPassword(targetUserId: string, currentUser: { id: string; role: string }) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('관리자만 비밀번호를 초기화할 수 있습니다');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    const tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { password: hashedPassword },
    });

    return { message: '비밀번호가 초기화되었습니다. 사용자에게 임시 비밀번호를 안전하게 전달해주세요.', tempPassword };
  }

  async deleteUser(id: string, currentUserId: string) {
    if (currentUserId === id) {
      throw new BadRequestException('자신의 계정은 삭제할 수 없습니다');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // Soft delete by setting isActive=false
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    const { password: _, ...result } = updated;
    return result;
  }
}
