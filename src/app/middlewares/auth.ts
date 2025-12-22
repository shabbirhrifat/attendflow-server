import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../errors/AppError';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import UserModel from '../modules/user/user.model';
import { AuthService } from '../modules/auth/auth.service';
import { StatusCodes } from 'http-status-codes';

// /**
//  * Middleware to authorize requests.
//  * Checks if the request has a valid authorization token.
//  * If not, it throws an unauthorized error.
//  * @deprecated Use AuthMiddleware from auth module instead
//  */

const AuthorizeRequest = (...roles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Get the authorization token from the request headers
    const token = req.headers.authorization?.split(' ')[1];
    // If no token is provided, throw an unauthorized error
    if (!token) {
      console.error('Authorization Error:', 'No token provided');

      throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized Access');
    }
    try {
      const decoded = jwt.verify(token, config.jwt_access_secret as string) as JwtPayload;
      req.user = decoded;
      const { id, role } = decoded;

      if (roles.length > 0 && !roles.includes(role)) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized Access');
      }

      const user = await UserModel.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');
      }
    } catch (error: any) {
      console.error('Authorization Error:', error);
      throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized Access');
    }
    next();
  });
};

export default AuthorizeRequest;

// Re-export the new auth middleware for easier migration
export { AuthMiddleware } from '../modules/auth/auth.middleware';
