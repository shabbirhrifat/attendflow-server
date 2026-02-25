import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../errors/AppError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import { AuthService } from './auth.service';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Get the authorization token from the request headers
    const token = req.headers.authorization?.split(' ')[1];

    // If no token is provided, throw an unauthorized error
    if (!token) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Access token is required');
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;

        // Attach user information to the request object
        req.user = decoded;

        next();
    } catch (error) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired access token');
    }
});

/**
 * Middleware to authorize requests based on user roles
 * @param roles - Array of allowed roles
 * @returns Middleware function that checks if the user has the required role
 */
const authorize = (...roles: string[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // First check if user is authenticated
        if (!req.user) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Authentication required');
        }

        const { id, role } = req.user;

        // Check if the user has the required role
        if (roles.length > 0 && !roles.includes(role)) {
            throw new AppError(StatusCodes.FORBIDDEN, 'Insufficient permissions');
        }

        // Additional check to verify the user still exists and has the same role
        const hasRequiredRole = await AuthService.checkUserRole(id, roles as any);

        if (!hasRequiredRole) {
            throw new AppError(StatusCodes.FORBIDDEN, 'User role has changed or user no longer exists');
        }

        next();
    });
};

/**
 * Middleware to check if the user is the owner of the resource or has admin privileges
 * @param resourceUserIdParam - The parameter name that contains the user ID of the resource owner
 * @returns Middleware function that checks ownership or admin privileges
 */
const authorizeOwnerOrAdmin = (resourceUserIdParam: string = 'userId') => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // First check if user is authenticated
        if (!req.user) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Authentication required');
        }

        const { id: currentUserId, role } = req.user;
        const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];

        // Check if user is the owner of the resource or has admin privileges
        const isOwner = currentUserId === resourceUserId;
        const isAdmin = role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            throw new AppError(StatusCodes.FORBIDDEN, 'Access denied: You can only access your own resources or need admin privileges');
        }

        next();
    });
};

/**
 * Middleware to verify refresh token
 */
const verifyRefreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Refresh token is required');
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(
            refreshToken,
            config.jwt_refresh_secret as string || config.jwt_access_secret as string
        ) as JwtPayload;

        // Attach user information to the request object
        req.user = decoded;

        next();
    } catch (error) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
});

/**
 * Middleware to check if the user is a teacher or admin
 */
const isTeacherOrAdmin = authorize('TEACHER', 'ADMIN');

/**
 * Middleware to check if the user is an admin
 */
const isAdmin = authorize('ADMIN');

// SUPER_ADMIN role removed — use isAdmin instead

/**
 * Middleware to check if the user is a student
 */
const isStudent = authorize('STUDENT');

/**
 * Middleware to check if the user is a teacher
 */
const isTeacher = authorize('TEACHER');

export const AuthMiddleware = {
    authenticate,
    authorize,
    authorizeOwnerOrAdmin,
    verifyRefreshToken,
    isTeacherOrAdmin,
    isAdmin,
    isStudent,
    isTeacher,
};

// Named exports for convenience
export { authenticate as authMiddleware };
export { isAdmin as adminGuard };
export { authorize };
export { authorizeOwnerOrAdmin };
export { verifyRefreshToken };
export { isTeacherOrAdmin };
export { isAdmin };
export { isStudent };
export { isTeacher };