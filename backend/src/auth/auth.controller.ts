import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, ChangePasswordDto } from './dto/register.dto';
import { UpdateUserDto, UserQueryDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @UseGuards(AuthGuard('local'))
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('change-password')
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: '비밀번호 초기화 (관리자)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async resetPassword(@Param('id') id: string, @Request() req: any) {
    return this.authService.resetPassword(id, { id: req.user.id, role: req.user.role });
  }

  // ─── User Management (TMSYS030 사용자관리) ──────────────

  @Get('users')
  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async getUsers(@Query() query: UserQueryDto) {
    return this.authService.getUsers(query);
  }

  @Put('users/:id')
  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.authService.updateUser(id, dto, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '사용자 삭제 (비활성화)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.authService.deleteUser(id, req.user.id);
  }
}
