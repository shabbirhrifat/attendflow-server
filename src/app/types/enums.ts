/**
 * Shared enum types for Mongoose models
 * These are the same enums used in Prisma schema
 */

// User roles enum
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

// User account status enum
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

// Notification type enum
export type NotificationType = 'IN_APP' | 'EMAIL' | 'BOTH';

// Email status enum
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

// Attendance status enum
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

// QR Code status enum
export type QRCodeStatus = 'ACTIVE' | 'EXPIRED' | 'USED';

// Leave status enum
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Leave type enum
export type LeaveType = 'SICK' | 'PERSONAL' | 'VACATION' | 'ACADEMIC' | 'EMERGENCY';

// Audit action types
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'EXPORT'
  | 'IMPORT'
  | 'BULK_OPERATION'
  | 'ATTENDANCE_MARKED'
  | 'ATTENDANCE_MODIFIED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'SETTINGS_CHANGED';
