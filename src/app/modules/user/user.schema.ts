import mongoose, { Schema } from 'mongoose';
import { UserRole, UserStatus } from '../../types/enums';

/**
 * User Schema for MongoDB
 * Corresponds to Prisma User model
 */

// User interface
export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  username?: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  departmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User schema definition
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'TEACHER', 'STUDENT'],
      default: 'STUDENT',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'],
      default: 'ACTIVE',
    },
    avatar: String,
    phone: String,
    address: String,
    dateOfBirth: Date,
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { password, ...rest } = ret;
        return rest;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const { password, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ departmentId: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });

// Virtual for student profile
UserSchema.virtual('studentProfile', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Virtual for teacher profile
UserSchema.virtual('teacherProfile', {
  ref: 'Teacher',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Export User model
export const User = mongoose.model<IUser>('User', UserSchema);

export default User;
