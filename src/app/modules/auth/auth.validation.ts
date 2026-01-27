import { z } from 'zod';

// User registration validation schema
const userRegistrationValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT']).optional().default('STUDENT'),
    phone: z.string().optional(),
    departmentId: z.string().optional(),
    employeeId: z.string().optional(),
    designation: z.string().optional(),
    specialization: z.string().optional(),
    studentId: z.string().optional(),
    batchId: z.string().optional(),
    semester: z.number().optional(),
  }),
});

// Admin/Teacher registration validation schema (more restrictive - only allows ADMIN and TEACHER roles)
const adminRegistrationValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'TEACHER'], {
      errorMap: () => ({ message: 'Role must be either ADMIN or TEACHER for admin registration' }),
    }),
    phone: z.string().optional(),
    departmentId: z.string().optional(),
    employeeId: z.string().optional(),
    designation: z.string().optional(),
    specialization: z.string().optional(),
  }),
});

// User login validation schema
const userLoginValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Change password validation schema
const changePasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

// Forgot password validation schema
const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

// Reset password validation schema
const resetPasswordValidationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

// Refresh token validation schema
const refreshTokenValidationSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Update user profile validation schema
const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
  }),
});

// Email verification validation schema
const emailVerificationValidationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const AuthValidation = {
  userRegistrationValidationSchema,
  adminRegistrationValidationSchema,
  userLoginValidationSchema,
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  refreshTokenValidationSchema,
  updateProfileValidationSchema,
  emailVerificationValidationSchema,
};
