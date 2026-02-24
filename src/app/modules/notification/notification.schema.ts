import mongoose, { Schema } from 'mongoose';
import { NotificationType, EmailStatus } from '../../types/enums';

/**
 * Notification Schema for MongoDB
 * Corresponds to Prisma Notification model
 */

// Notification interface
export interface INotification {
  _id: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  readStatus: boolean;
  emailStatus?: EmailStatus;
  recipientId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema definition
const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'BOTH'],
      default: 'IN_APP',
    },
    readStatus: {
      type: Boolean,
      default: false,
    },
    emailStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ recipientId: 1 });
NotificationSchema.index({ readStatus: 1 });
NotificationSchema.index({ createdAt: -1 });

// Virtual for recipient
NotificationSchema.virtual('recipient', {
  ref: 'User',
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true,
});

// Cascade delete - remove notifications when user is deleted
NotificationSchema.pre('deleteMany', async function () {
  const conditions = this.getFilter();
  if (conditions.recipientId) {
    // Handle cascade if needed
  }
});

// Export Notification model
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
