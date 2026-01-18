/**
 * Bulk Operations Module - Interface Definitions
 *
 * Handles batch create, update, and delete operations
 */

export enum BulkEntityType {
  USER = 'User',
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  COURSE = 'Course',
  DEPARTMENT = 'Department',
  ATTENDANCE = 'Attendance',
}

export enum BulkOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface IBulkOperation {
  id: string;
  entityType: BulkEntityType;
  operationType: BulkOperationType;
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    entityId?: string;
    message: string;
  }>;
  createdAt: Date;
}

export interface IBulkCreateRequest<T = any> {
  entityType: BulkEntityType;
  data: T[];
  options?: {
    continueOnError?: boolean;
    skipDuplicates?: boolean;
  };
}

export interface IBulkUpdateRequest {
  entityType: BulkEntityType;
  ids: string[];
  data: Record<string, any>;
}

export interface IBulkDeleteRequest {
  entityType: BulkEntityType;
  ids: string[];
}

export interface IBulkOperationResult {
  success: boolean;
  message: string;
  data?: {
    total: number;
    success: number;
    failed: number;
    errors: Array<{
      index: number;
      entityId?: string;
      message: string;
    }>;
  };
}

export interface IBulkMarkAttendanceRequest {
  courseId: string;
  date: string;
  attendance: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    notes?: string;
  }>;
}
