import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, ChangePasswordDto } from './dto/register.dto';
import { UpdateUserDto, UserQueryDto } from './dto/update-user.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: {
        id: string;
        email: string;
        role: string;
        [key: string]: unknown;
    }): Promise<{
        user: {
            [key: string]: unknown;
            id: string;
            email: string;
            role: string;
        };
        accessToken: string;
    }>;
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUsers(query: UserQueryDto): Promise<PaginatedResult<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    updateUser(id: string, dto: UpdateUserDto, currentUser: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(targetUserId: string, currentUser: {
        id: string;
        role: string;
    }): Promise<{
        message: string;
        tempPassword: string;
    }>;
    deleteUser(id: string, currentUserId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
