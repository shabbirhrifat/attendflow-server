import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { AuthService } from '../auth/auth.service';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import UserModel from '../user/user.model';
import AppError from '../../errors/AppError';
import bcrypt from 'bcrypt';
import config from '../../config';
import generateToken from '../../utils/generateToken';
import { hashInfo } from '../../utils/hashInfo';
import { RefreshTokenModel } from '../auth/auth.model';

interface RegisterAdminData {
    email: string;
    username?: string;
    name: string;
    password: string;
    role: 'ADMIN' | 'TEACHER';
    phone?: string;
    departmentId?: string;
    employeeId?: string;
    designation?: string;
    specialization?: string;
}

const loginAdmin = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Verify role - Allow ADMIN and TEACHER to login
    if (
        (user.role as any) !== 'ADMIN' &&
        (user.role as any) !== 'TEACHER'
    ) {
        throw new AppError(StatusCodes.FORBIDDEN, 'Access denied: Not an administrator or teacher');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid password');
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

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Login successful',
        data: {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        },
    });
});

const registerAdmin = catchAsync(async (req: Request, res: Response) => {
    const adminData: RegisterAdminData = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(adminData.email);
    if (adminData.username && existingUser) {
        // Also check username if provided
        const existingByUsername = await UserModel.findByUsername(adminData.username);
        if (existingByUsername || existingUser) {
            throw new AppError(StatusCodes.CONFLICT, 'User with this email or username already exists');
        }
    }

    if (existingUser) {
        throw new AppError(StatusCodes.CONFLICT, 'User with this email already exists');
    }

    // Only allow ADMIN and TEACHER roles through this route
    if (adminData.role !== 'ADMIN' && adminData.role !== 'TEACHER') {
        throw new AppError(StatusCodes.FORBIDDEN, 'Only ADMIN and TEACHER roles can be registered through this endpoint');
    }

    // Hash password
    const hashedPassword = await hashInfo(adminData.password);

    // Create user
    const user = await UserModel.create({
        email: adminData.email,
        username: adminData.username,
        name: adminData.name,
        password: hashedPassword,
        role: adminData.role,
        phone: adminData.phone,
        departmentId: adminData.departmentId,
    });

    // Create teacher profile if role is TEACHER
    if (adminData.role === 'TEACHER') {
        const { TeacherModel } = await import('../teacher/teacher.model');
        await TeacherModel.model.create({
            userId: user._id.toString(),
            employeeId: adminData.employeeId || `EMP${Date.now()}`,
            designation: adminData.designation,
            specialization: adminData.specialization,
            departmentId: adminData.departmentId,
        });
    }

    // Generate tokens
    const jwtPayload = {
        id: user._id.toString(),
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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await RefreshTokenModel.model.create({
        token: refreshToken,
        userId: user.id,
        expiresAt,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Registration successful',
        data: {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        },
    });
});

export const AdminController = {
    loginAdmin,
    registerAdmin,
};
