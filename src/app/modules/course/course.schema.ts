import mongoose, { Schema } from 'mongoose';

/**
 * Course Schemas for MongoDB
 * Corresponds to Prisma Course, CourseEnrollment, ClassSchedule models
 */

// Course interface
export interface ICourse {
  _id: mongoose.Types.ObjectId;
  title: string;
  code: string;
  description?: string;
  credits: number;
  batchId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  semesterId?: mongoose.Types.ObjectId;
  semester: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Course Enrollment interface
export interface ICourseEnrollment {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enrolledAt: Date;
}

// Class Schedule interface
export interface IClassSchedule {
  _id: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  semester: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Course schema definition
const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: String,
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    semesterId: {
      type: Schema.Types.ObjectId,
      ref: 'Semester',
    },
    semester: {
      type: Number,
      default: 1,
      min: 1,
      max: 8,
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

// Indexes
CourseSchema.index({ departmentId: 1 });
CourseSchema.index({ teacherId: 1 });
CourseSchema.index({ batchId: 1 });
CourseSchema.index({ semesterId: 1 });
CourseSchema.index({ isActive: 1 });
CourseSchema.index({ code: 1 }, { unique: true });

// Virtuals for populated references
CourseSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

CourseSchema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: '_id',
  justOne: true,
});

CourseSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

CourseSchema.virtual('subject', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: '_id',
  justOne: true,
});

CourseSchema.virtual('semesterInfo', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: '_id',
  justOne: true,
});

// Course Enrollment schema definition
const CourseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound unique index for studentId + courseId
CourseEnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Virtuals
CourseEnrollmentSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true,
});

CourseEnrollmentSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Class Schedule schema definition
const ClassScheduleSchema = new Schema<IClassSchedule>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0, // 0 = Sunday
      max: 6, // 6 = Saturday
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    room: String,
    semester: {
      type: Number,
      default: 1,
      min: 1,
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

// Virtuals
ClassScheduleSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true,
});

ClassScheduleSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

ClassScheduleSchema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: '_id',
  justOne: true,
});

// Export models
export const Course = mongoose.model<ICourse>('Course', CourseSchema);
export const CourseEnrollment = mongoose.model<ICourseEnrollment>('CourseEnrollment', CourseEnrollmentSchema);
export const ClassSchedule = mongoose.model<IClassSchedule>('ClassSchedule', ClassScheduleSchema);

export default { Course, CourseEnrollment, ClassSchedule };
