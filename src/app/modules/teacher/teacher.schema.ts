import mongoose, { Schema } from 'mongoose';

/**
 * Teacher Schema for MongoDB
 * Corresponds to Prisma Teacher model
 */

// Teacher interface
export interface ITeacher {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  departmentId?: mongoose.Types.ObjectId;
  designation?: string;
  specialization?: string;
  joinDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Teacher schema definition
const TeacherSchema = new Schema<ITeacher>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    designation: String,
    specialization: String,
    joinDate: {
      type: Date,
      default: Date.now,
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
TeacherSchema.index({ departmentId: 1 });
TeacherSchema.index({ isActive: 1 });
TeacherSchema.index({ employeeId: 1 }, { unique: true });
TeacherSchema.index({ userId: 1 }, { unique: true });

// Virtual for user
TeacherSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for department
TeacherSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for courses
TeacherSchema.virtual('courses', {
  ref: 'Course',
  localField: 'userId',
  foreignField: 'teacherId',
});

// Cascade delete - remove teacher when user is deleted
TeacherSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await mongoose.model('User').deleteOne({ _id: this.userId });
});

// Export Teacher model
export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);

export default Teacher;
