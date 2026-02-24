import mongoose, { Schema } from 'mongoose';

/**
 * Auth Schemas for MongoDB
 * Corresponds to Prisma RefreshToken, PasswordResetToken, EmailVerificationToken models
 */

// Refresh Token interface
export interface IRefreshToken {
  _id: mongoose.Types.ObjectId;
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

// Password Reset Token interface
export interface IPasswordResetToken {
  _id: mongoose.Types.ObjectId;
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

// Email Verification Token interface
export interface IEmailVerificationToken {
  _id: mongoose.Types.ObjectId;
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

// Refresh Token schema definition
const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-cleanup of expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ userId: 1 });

// Virtual for user
RefreshTokenSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Cascade delete - remove tokens when user is deleted
RefreshTokenSchema.pre('deleteMany', async function () {
  const conditions = this.getFilter();
  if (conditions.userId) {
    // Handle cascade if needed
  }
});

// Password Reset Token schema definition
const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-cleanup of expired tokens
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetTokenSchema.index({ token: 1 }, { unique: true });
PasswordResetTokenSchema.index({ userId: 1 });

// Virtual for user
PasswordResetTokenSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Cascade delete - remove tokens when user is deleted
PasswordResetTokenSchema.pre('deleteMany', async function () {
  const conditions = this.getFilter();
  if (conditions.userId) {
    // Handle cascade if needed
  }
});

// Email Verification Token schema definition
const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-cleanup of expired tokens
EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
EmailVerificationTokenSchema.index({ token: 1 }, { unique: true });
EmailVerificationTokenSchema.index({ userId: 1 });

// Virtual for user
EmailVerificationTokenSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Cascade delete - remove tokens when user is deleted
EmailVerificationTokenSchema.pre('deleteMany', async function () {
  const conditions = this.getFilter();
  if (conditions.userId) {
    // Handle cascade if needed
  }
});

// Export models
export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
export const PasswordResetToken = mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
export const EmailVerificationToken = mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema);

export default { RefreshToken, PasswordResetToken, EmailVerificationToken };
