import mongoose, { Schema } from 'mongoose';
import { AttendanceStatus } from '../../types/enums';

/**
 * Attendance Schemas for MongoDB
 * Corresponds to Prisma Attendance, AttendanceSession models
 */

// Attendance interface
export interface IAttendance {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  checkIn?: Date;
  checkOut?: Date;
  notes?: string;
  markedBy?: mongoose.Types.ObjectId;
  attendanceSessionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Session interface
export interface IAttendanceSession {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance schema definition
const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    notes: String,
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attendanceSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AttendanceSchema.index({ userId: 1, courseId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ userId: 1, date: 1 });
AttendanceSchema.index({ courseId: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ markedBy: 1 });
AttendanceSchema.index({ attendanceSessionId: 1 });

// Virtuals
AttendanceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

AttendanceSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

AttendanceSchema.virtual('marker', {
  ref: 'User',
  localField: 'markedBy',
  foreignField: '_id',
  justOne: true,
});

AttendanceSchema.virtual('student', {
  ref: 'Student',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true,
});

AttendanceSchema.virtual('attendanceSession', {
  ref: 'AttendanceSession',
  localField: 'attendanceSessionId',
  foreignField: '_id',
  justOne: true,
});

// Attendance Session schema definition
const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    location: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
AttendanceSessionSchema.index({ courseId: 1 });
AttendanceSessionSchema.index({ teacherId: 1 });
AttendanceSessionSchema.index({ date: 1 });
AttendanceSessionSchema.index({ isActive: 1 });

// Virtuals
AttendanceSessionSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

AttendanceSessionSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

AttendanceSessionSchema.virtual('attendances', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'attendanceSessionId',
});

// Export models
export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const AttendanceSession = mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);

export default { Attendance, AttendanceSession };
