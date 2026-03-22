import { UserRole } from './register.dto';
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
}
export declare class UserQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
}
