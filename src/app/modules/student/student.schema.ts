import mongoose, { Schema } from 'mongoose';

/**
 * Student Schema for MongoDB
 * Corresponds to Prisma Student model
 */

// Student interface
export interface IStudent {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  studentId: string;
  batchId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  semester: number;
  enrollmentDate: Date;
  gpa?: number;
  credits: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Student schema definition
const StudentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    semester: {
      type: Number,
      default: 1,
      min: 1,
      max: 8,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    gpa: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 4.0,
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
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
StudentSchema.index({ batchId: 1 });
StudentSchema.index({ departmentId: 1 });
StudentSchema.index({ isActive: 1 });
StudentSchema.index({ studentId: 1 });
StudentSchema.index({ userId: 1 }, { unique: true });

// Virtual for user
StudentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for batch
StudentSchema.virtual('batch', {
  ref: 'Batch',
  localField: 'batchId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for department
StudentSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

// Cascade delete - remove student when user is deleted
StudentSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await mongoose.model('User').deleteOne({ _id: this.userId });
});

// Export Student model
export const Student = mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
