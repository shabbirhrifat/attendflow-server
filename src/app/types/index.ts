/**
 * Shared type definitions for the entire application
 * Export commonly used types to avoid circular dependencies
 */

// Import from single source of truth
import type { UserRole, UserStatus } from './enums';

// Re-export all enums from single source of truth
export {
  type UserRole,
  type UserStatus,
  type AttendanceStatus,
  type LeaveStatus,
  type LeaveType,
  type NotificationType,
  type EmailStatus,
} from './enums';

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

