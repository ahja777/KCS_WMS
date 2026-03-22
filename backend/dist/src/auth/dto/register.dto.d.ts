export declare enum UserRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    OPERATOR = "OPERATOR",
    VIEWER = "VIEWER"
}
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
