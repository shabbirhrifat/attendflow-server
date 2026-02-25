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
import { RefreshTokenModel } from './auth.model';
import { StudentModel } from '../student/student.model';
import { TeacherModel } from '../teacher/teacher.model';
import { sendPasswordResetEmail } from '../../utils/emailTemplates';
import { UserRole } from '../../types';

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

interface IUser {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

interface AuthResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}

// Helper function to store refresh token in database
const storeRefreshToken = async (token: string, userId: string): Promise<void> => {
  // Calculate expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await RefreshTokenModel.createToken(userId, token, expiresAt);
};

// Helper function to validate refresh token
const validateRefreshToken = async (token: string): Promise<{ userId: string } | null> => {
  const refreshToken = await RefreshTokenModel.findByToken(token);

  if (!refreshToken) {
    return null;
  }

  return { userId: refreshToken.userId?.toString() || '' };
};

// Helper function to remove refresh token
const removeRefreshToken = async (token: string): Promise<void> => {
  await RefreshTokenModel.deleteByToken(token);
};

// Helper function to remove all refresh tokens for a user
const removeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  await RefreshTokenModel.deleteAllForUser(userId);
};

// Register a new user
const registerUser = async (userData: RegisterUser): Promise<AuthResponse> => {
  // Check if user already exists
  const existingUser = await UserModel.findByEmail(userData.email);

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
    email: userData.email,
    username: userData.username,
    name: userData.name,
    password: hashedPassword,
    role: userData.role || 'STUDENT',
  });

  // Create associated profile based on role
  if (userData.role === 'STUDENT' || (!userData.role)) {
    await StudentModel.model.create({
      userId: user._id.toString(),
      studentId: `STU${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      semester: 1,
    });
  } else if (userData.role === 'TEACHER') {
    await TeacherModel.model.create({
      userId: user._id.toString(),
      employeeId: `EMP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
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
  await storeRefreshToken(refreshToken, user._id.toString());

  // Remove password from response
  const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

// User login
const loginUser = async (loginData: LoginUser): Promise<AuthResponse> => {
  // Find user by email
  const user = await UserModel.findByEmail(loginData.email);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
  if (!isPasswordValid) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid password');
  }

  // Prevent admin login through regular route
  if (user.role === 'ADMIN') {
    throw new AppError(StatusCodes.FORBIDDEN, 'Administrative users must use the dedicated admin login portal');
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
  await storeRefreshToken(refreshToken, user._id.toString());

  // Remove password from response
  const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;

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
  const user = await UserModel.findById(userId);

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
  await UserModel.updatePassword(userId, hashedNewPassword);

  // Remove all refresh tokens for this user (force re-login)
  await removeAllUserRefreshTokens(userId);
};

// Forgot password
const forgotPassword = async (email: string): Promise<void> => {
  // Find user
  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // Generate reset token
  const resetToken = await generateToken(
    { id: user._id.toString() },
    config.jwt_reset_secret as string || config.jwt_access_secret as string,
    '1h' // Token expires in 1 hour
  );

  // Send password reset email with the reset token
  try {
    // Create reset link for the email - using a default URL since frontend_url isn't in config
    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

    // Send professional password reset email
    await sendPasswordResetEmail(email, resetLink, user.name);
  } catch (error) {
    // Log error but don't throw - token is still generated and valid
    console.error('Failed to send password reset email:', error);
  }
};

// Reset password
const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  // Verify reset token
  const decoded = verifyToken(token, config.jwt_reset_secret as string || config.jwt_access_secret as string) as JwtPayload;

  // Hash new password
  const hashedNewPassword = await hashInfo(newPassword);

  // Update password
  await UserModel.updatePassword(decoded.id, hashedNewPassword);

  // Remove all refresh tokens for this user (force re-login)
  await removeAllUserRefreshTokens(decoded.id);
};

// Verify email
const verifyEmail = async (token: string): Promise<void> => {
  // Verify email token
  const decoded = verifyToken(token, config.jwt_email_secret as string || config.jwt_access_secret as string) as JwtPayload;

  // For now, just verify the token is valid - full implementation would check database
  // Note: To fully implement email verification, add an `emailVerified` field to the User schema
  // and update it here
};

// Check user role
const checkUserRole = async (userId: string, requiredRoles: UserRole[]): Promise<boolean> => {
  const user = await UserModel.findById(userId);

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
