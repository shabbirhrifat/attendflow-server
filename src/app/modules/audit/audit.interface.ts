/**
 * Audit Log Module - Interface Definitions
 *
 * Tracks all system actions for compliance and security
 */

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ROLE_CHANGE = 'ROLE_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BULK_OPERATION = 'BULK_OPERATION',
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  ATTENDANCE_MODIFIED = 'ATTENDANCE_MODIFIED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
}

export type AuditEntityType =
  | 'User'
  | 'Student'
  | 'Teacher'
  | 'Course'
  | 'Department'
  | 'Batch'
  | 'Attendance'
  | 'Leave'
  | 'Setting'
  | 'Notification'
  | 'Session'
  | 'Import'
  | 'Export';

export interface IAuditLogData {
  userId: string;
  action: AuditAction;
  entity: AuditEntityType;
  entityId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export interface IAuditLogFilter {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

export interface IAuditLogResponse {
  success: boolean;
  message: string;
  data?: any;
  logs?: any[];
  total?: number;
}
