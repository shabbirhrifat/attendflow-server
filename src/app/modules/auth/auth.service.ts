import { User, RefreshToken, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { JwtPayload } from 'jsonwebtoken';
import { hashInfo } from '../../utils/hashInfo';
import generateToken from '../../utils/generateToken';
import { verifyToken } from '../../utils/verifyToken';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import UserModel from '../user/user.model';

const prisma = new PrismaClient();

// Types for auth service
interface LoginUser {
    email: string;
    password: string;
}

interface RegisterUser {
    email: string;
    username?: string;
    name: string;
    password: string;
    role?: UserRole;
}

// Define UserRole type locally since it's not exported from @prisma/client
type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

interface AuthResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}

// Helper function to store refresh token in database
const storeRefreshToken = async (token: string, userId: string): Promise<void> => {
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });
};

// Helper function to validate refresh token
const validateRefreshToken = async (token: string): Promise<{ userId: string } | null> => {
    const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
    });

    if (!refreshToken) {
        return null;
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({
            where: { id: refreshToken.id },
        });
        return null;
    }

    return { userId: refreshToken.userId };
};

// Helper function to remove refresh token
const removeRefreshToken = async (token: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({
        where: { token },
    });
};

// Helper function to remove all refresh tokens for a user
const removeAllUserRefreshTokens = async (userId: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({
        where: { userId },
    });
};

// Register a new user
const registerUser = async (userData: RegisterUser): Promise<AuthResponse> => {
    // Check if user already exists
    const existingUser = await UserModel.findFirst({
        where: {
            OR: [
                { email: userData.email },
            ],
        },
    });

    if (existingUser) {
        throw new AppError(StatusCodes.CONFLICT, 'User with this email already exists');
    }

    // Prevent admin registration
    if (userData.role === 'ADMIN') {
        throw new AppError(StatusCodes.FORBIDDEN, 'Admin registration is not allowed via this route');
    }

    // Hash password
    const hashedPassword = await hashInfo(userData.password);

    // Create user
    const user = await UserModel.create({
        data: {
            ...userData,
            password: hashedPassword,
        },
    });

    // Generate tokens
    const jwtPayload = {
        id: user.id,
        role: user.role,
    };

    const accessToken = await generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires as string
    );

    const refreshToken = await generateToken(
        jwtPayload,
        config.jwt_refresh_secret as string || config.jwt_access_secret as string,
        config.jwt_refresh_expires as string || '30d'
    );

    // Store refresh token in database
    await storeRefreshToken(refreshToken, user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

// User login
const loginUser = async (loginData: LoginUser): Promise<AuthResponse> => {
    // Find user by email
    const user = await UserModel.findUnique({
        where: { email: loginData.email },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid password');
    }

    // Prevent admin login through regular route
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role as any)) {
        throw new AppError(StatusCodes.FORBIDDEN, 'Administrative users must use the dedicated admin login portal');
    }

    // Generate tokens
    const jwtPayload = {
        id: user.id,
        role: user.role,
    };

    const accessToken = await generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires as string
    );

    const refreshToken = await generateToken(
        jwtPayload,
        config.jwt_refresh_secret as string || config.jwt_access_secret as string,
        config.jwt_refresh_expires as string || '30d'
    );

    // Store refresh token in database
    await storeRefreshToken(refreshToken, user.id);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

// Refresh access token
const refreshToken = async (token: string): Promise<{ accessToken: string }> => {
    // Validate refresh token exists in database and is not expired
    const tokenData = await validateRefreshToken(token);

    if (!tokenData) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    // Verify refresh token
    const decoded = verifyToken(token, config.jwt_refresh_secret as string || config.jwt_access_secret as string) as JwtPayload;

    // Generate new access token
    const jwtPayload = {
        id: decoded.id,
        role: decoded.role,
    };

    const accessToken = await generateToken(
        jwtPayload,
        config.jwt_access_secret as string,
        config.jwt_access_expires as string
    );

    return { accessToken };
};

// User logout
const logoutUser = async (token: string): Promise<void> => {
    // Remove refresh token from database
    await removeRefreshToken(token);
};

// Change password
const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    // Find user
    const user = await UserModel.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashInfo(newPassword);

    // Update password
    await UserModel.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });

    // Remove all refresh tokens for this user (force re-login)
    await removeAllUserRefreshTokens(userId);
};

// Forgot password
const forgotPassword = async (email: string): Promise<void> => {
    // Find user
    const user = await UserModel.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Generate reset token
    const resetToken = await generateToken(
        { id: user.id },
        config.jwt_reset_secret as string || config.jwt_access_secret as string,
        '1h' // Token expires in 1 hour
    );

    // In a real application, you would send an email with the reset token
    // TODO: Implement email sending functionality
};

// Reset password
const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    // Verify reset token
    const decoded = verifyToken(token, config.jwt_reset_secret as string || config.jwt_access_secret as string) as JwtPayload;

    // Hash new password
    const hashedNewPassword = await hashInfo(newPassword);

    // Update password
    await UserModel.update({
        where: { id: decoded.id },
        data: { password: hashedNewPassword },
    });

    // Remove all refresh tokens for this user (force re-login)
    await removeAllUserRefreshTokens(decoded.id);
};

// Verify email
const verifyEmail = async (token: string): Promise<void> => {
    // Verify email token
    const decoded = verifyToken(token, config.jwt_email_secret as string || config.jwt_access_secret as string) as JwtPayload;

    // In a real implementation, you would update the user's verification status
    // TODO: Update user verification status in database
};

// Check user role
const checkUserRole = async (userId: string, requiredRoles: UserRole[]): Promise<boolean> => {
    const user = await UserModel.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (!user) {
        return false;
    }

    return requiredRoles.includes(user.role as UserRole);
};

export const AuthService = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    checkUserRole,
};