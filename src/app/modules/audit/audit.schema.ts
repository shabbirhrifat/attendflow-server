import mongoose, { Schema } from 'mongoose';
import { AuditAction } from '../../types/enums';

/**
 * Audit Log Schema for MongoDB
 * Corresponds to Prisma AuditLog model
 */

// Audit Log interface
export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: AuditAction;
  entity: string;
  entityId?: mongoose.Types.ObjectId;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

// Audit Log schema definition
const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Disable automatic timestamps, only using createdAt
  }
);

// Indexes
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entity: 1 });
AuditLogSchema.index({ entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });

// Virtual for user
AuditLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Cascade delete - remove audit logs when user is deleted
AuditLogSchema.pre('deleteMany', async function () {
  const conditions = this.getFilter();
  if (conditions.userId) {
    // Handle cascade if needed
  }
});

// Export AuditLog model
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
