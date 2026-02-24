import mongoose, { Schema } from 'mongoose';

/**
 * Organization Schemas for MongoDB
 * Corresponds to Prisma Department, Batch, Semester, Subject models
 */

// Department interface
export interface IDepartment {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  headId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Batch interface
export interface IBatch {
  _id: mongoose.Types.ObjectId;
  name: string;
  year: number;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Semester interface
export interface ISemester {
  _id: mongoose.Types.ObjectId;
  name: string;
  year: number;
  departmentId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subject interface
export interface ISubject {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  credits: number;
  departmentId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Department schema definition
const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    headId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
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

DepartmentSchema.index({ isActive: 1 });
DepartmentSchema.index({ name: 1 }, { unique: true });
DepartmentSchema.index({ code: 1 }, { unique: true });

// Virtual for head
DepartmentSchema.virtual('head', {
  ref: 'Teacher',
  localField: 'headId',
  foreignField: '_id',
  justOne: true,
});

// Batch schema definition
const BatchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    description: String,
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
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

BatchSchema.index({ year: 1 });
BatchSchema.index({ isActive: 1 });
BatchSchema.index({ name: 1 }, { unique: true });

// Semester schema definition
const SemesterSchema = new Schema<ISemester>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
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

// Compound unique index for departmentId + year + name
SemesterSchema.index({ departmentId: 1, year: 1, name: 1 }, { unique: true });

// Virtual for department
SemesterSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

// Subject schema definition
const SubjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
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

SubjectSchema.index({ name: 1 }, { unique: true });
SubjectSchema.index({ code: 1 }, { unique: true });

// Virtual for department
SubjectSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true,
});

// Export models
export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
export const Semester = mongoose.model<ISemester>('Semester', SemesterSchema);
export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);

export default { Department, Batch, Semester, Subject };
