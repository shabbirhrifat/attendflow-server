import mongoose, { Schema } from 'mongoose';
import { LeaveStatus, LeaveType } from '../../types/enums';

/**
 * Leave Schemas for MongoDB
 * Corresponds to Prisma LeaveRequest, LeaveBalance, LeavePolicy models
 */

// Leave Request interface
export interface ILeaveRequest {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: LeaveType;
  status: LeaveStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  documents?: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Leave Balance interface
export interface ILeaveBalance {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
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

// Leave Policy interface
export interface ILeavePolicy {
  _id: mongoose.Types.ObjectId;
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

// Leave Request schema definition
const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['SICK', 'PERSONAL', 'VACATION', 'ACADEMIC', 'EMERGENCY'],
      default: 'PERSONAL',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
    documents: String,
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LeaveRequestSchema.index({ userId: 1 });
LeaveRequestSchema.index({ status: 1 });
LeaveRequestSchema.index({ startDate: 1 });

// Virtuals
LeaveRequestSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

LeaveRequestSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

LeaveRequestSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

LeaveRequestSchema.virtual('approver', {
  ref: 'User',
  localField: 'approvedBy',
  foreignField: '_id',
  justOne: true,
});

// Leave Balance schema definition
const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    academicYear: {
      type: String,
      required: true,
    },
    sickLeave: {
      type: Number,
      default: 0,
    },
    personalLeave: {
      type: Number,
      default: 0,
    },
    vacationLeave: {
      type: Number,
      default: 0,
    },
    usedSick: {
      type: Number,
      default: 0,
    },
    usedPersonal: {
      type: Number,
      default: 0,
    },
    usedVacation: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for userId + academicYear
LeaveBalanceSchema.index({ userId: 1, academicYear: 1 }, { unique: true });
LeaveBalanceSchema.index({ studentId: 1 }, { unique: true, sparse: true });
LeaveBalanceSchema.index({ teacherId: 1 }, { unique: true, sparse: true });

// Virtuals
LeaveBalanceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

LeaveBalanceSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

LeaveBalanceSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

// Leave Policy schema definition
const LeavePolicySchema = new Schema<ILeavePolicy>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    academicYear: {
      type: String,
      required: true,
    },
    maxSickLeave: {
      type: Number,
      default: 5,
    },
    maxPersonalLeave: {
      type: Number,
      default: 3,
    },
    maxVacationLeave: {
      type: Number,
      default: 10,
    },
    requireDocuments: {
      type: Boolean,
      default: false,
    },
    minAdvanceDays: {
      type: Number,
      default: 1,
    },
    maxConsecutiveDays: {
      type: Number,
      default: 7,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

LeavePolicySchema.index({ name: 1 }, { unique: true });

// Export models
export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
export const LeaveBalance = mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
export const LeavePolicy = mongoose.model<ILeavePolicy>('LeavePolicy', LeavePolicySchema);

export default { LeaveRequest, LeaveBalance, LeavePolicy };
