import mongoose, { Schema } from 'mongoose';

/**
 * Session Schema for MongoDB
 * Corresponds to Prisma Session model
 */

// Session interface
export interface ISession {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
}

// Session schema definition
const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: String,
    userAgent: String,
    lastActive: {
      type: Date,
      default: Date.now,
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

// TTL index for auto-cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ token: 1 }, { unique: true });
SessionSchema.index({ lastActive: -1 });

// Virtual for user
SessionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Cascade delete - remove sessions when user is deleted
SessionSchema.pre('deleteMany', async function () {
  const conditions = this.getFilter();
  if (conditions.userId) {
    // Handle cascade if needed
  }
});

// Export Session model
export const Session = mongoose.model<ISession>('Session', SessionSchema);

export default Session;
