// Local type definitions for Leave module
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type LeaveType = 'SICK' | 'PERSONAL' | 'VACATION' | 'ACADEMIC' | 'EMERGENCY';

// User type (simplified)
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

// Leave Request interface
export interface ILeaveRequest {
  _id: string;
  userId: string;
  studentId?: string;
  teacherId?: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: LeaveType;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  documents?: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Leave Request with relationships
export interface ILeaveRequestWithRelations extends ILeaveRequest {
  user?: IUser;
  student?: any;
  teacher?: any;
  approver?: IUser;
}

// Create Leave Request interface
export interface ILeaveRequestCreate {
  userId: string;
  studentId?: string;
  teacherId?: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type?: LeaveType;
  documents?: string;
  isPaid?: boolean;
}

// Update Leave Request interface
export interface ILeaveRequestUpdate {
  startDate?: Date;
  endDate?: Date;
  reason?: string;
  type?: LeaveType;
  documents?: string;
  isPaid?: boolean;
}

// Approve/Reject Leave Request interface
export interface ILeaveRequestApproval {
  status: LeaveStatus;
  approvedBy: string;
  rejectionReason?: string;
}

// Leave Balance interface
export interface ILeaveBalance {
  _id: string;
  userId?: string;
  studentId?: string;
  teacherId?: string;
  academicYear: string;
  sickLeave: number;
  personalLeave: number;
  vacationLeave: number;
  usedSick: number;
  usedPersonal: number;
  usedVacation: number;
  createdAt: Date;
  updatedAt: Date;
}

// Leave Balance with relationships
export interface ILeaveBalanceWithRelations extends ILeaveBalance {
  user?: IUser;
  student?: any;
  teacher?: any;
}

// Create Leave Balance interface
export interface ILeaveBalanceCreate {
  userId?: string;
  studentId?: string;
  teacherId?: string;
  academicYear: string;
  sickLeave?: number;
  personalLeave?: number;
  vacationLeave?: number;
}

// Update Leave Balance interface
export interface ILeaveBalanceUpdate {
  sickLeave?: number;
  personalLeave?: number;
  vacationLeave?: number;
  usedSick?: number;
  usedPersonal?: number;
  usedVacation?: number;
}

// Leave Policy interface
export interface ILeavePolicy {
  _id: string;
  name: string;
  description?: string;
  academicYear: string;
  maxSickLeave: number;
  maxPersonalLeave: number;
  maxVacationLeave: number;
  requireDocuments: boolean;
  minAdvanceDays: number;
  maxConsecutiveDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ILeave type alias for backward compatibility
export type ILeave = ILeaveRequest;

// Create Leave Policy interface
export interface ILeavePolicyCreate {
  name: string;
  description?: string;
  academicYear: string;
  maxSickLeave?: number;
  maxPersonalLeave?: number;
  maxVacationLeave?: number;
  requireDocuments?: boolean;
  minAdvanceDays?: number;
  maxConsecutiveDays?: number;
}

// Update Leave Policy interface
export interface ILeavePolicyUpdate {
  name?: string;
  description?: string;
  maxSickLeave?: number;
  maxPersonalLeave?: number;
  maxVacationLeave?: number;
  requireDocuments?: boolean;
  minAdvanceDays?: number;
  maxConsecutiveDays?: number;
  isActive?: boolean;
}

// Leave filters interface
export interface ILeaveFilters {
  userId?: string;
  studentId?: string;
  teacherId?: string;
  status?: LeaveStatus;
  type?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  academicYear?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Leave statistics interface
export interface ILeaveStats {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  leaveByType: {
    [key in LeaveType]: number;
  };
  monthlyTrend: {
    month: string;
    count: number;
  }[];
}

// Leave Balance Summary interface
export interface ILeaveBalanceSummary {
  userId: string;
  academicYear: string;
  availableSick: number;
  availablePersonal: number;
  availableVacation: number;
  usedSick: number;
  usedPersonal: number;
  usedVacation: number;
  remainingSick: number;
  remainingPersonal: number;
  remainingVacation: number;
}

// Dashboard data interface
export interface ILeaveDashboard {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  requestsThisMonth: number;
  monthlyTrend: {
    month: string;
    approved: number;
    rejected: number;
    pending: number;
  }[];
  leaveByType: {
    type: LeaveType;
    count: number;
  }[];
  recentRequests: ILeaveRequestWithRelations[];
}
