/**
 * Shared type definitions for the entire application
 * Export commonly used types to avoid circular dependencies
 */

// User types
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

// User role values for use in runtime checks
export const UserRole = {
  ADMIN: 'ADMIN' as UserRole,
  TEACHER: 'TEACHER' as UserRole,
  STUDENT: 'STUDENT' as UserRole,
};

// Attendance types
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

// Leave types
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'SICK' | 'PERSONAL' | 'VACATION' | 'ACADEMIC' | 'EMERGENCY';

// Notification types
export type NotificationType = 'IN_APP' | 'EMAIL' | 'BOTH';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

// Base user interface
export interface IUser {
  _id: string;
  id: string; // For backward compatibility
  email: string;
  username?: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pagination meta interface
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response interface
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: IPaginationMeta;
}

// Error response interface
export interface IErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorSources?: Array<{
    path: string;
    message: string;
  }>;
  stack?: string;
}

