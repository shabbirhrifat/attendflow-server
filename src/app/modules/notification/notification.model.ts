import { Notification } from './notification.schema';
import BaseRepository from '../../repositories/BaseRepository';

/**
 * Notification Repository using MongoDB/Mongoose
 */
class NotificationRepository extends BaseRepository<any> {
  constructor() {
    super(Notification);
  }

  /**
   * Find notifications by recipient
   */
  async findByRecipient(recipientId: string, options: { limit?: number; skip?: number } = {}) {
    const { limit = 20, skip = 0 } = options;

    const [notifications, total] = await Promise.all([
      this.model.find({ recipientId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.model.countDocuments({ recipientId }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Find unread notifications by recipient
   */
  async findUnreadByRecipient(recipientId: string) {
    return await this.model.find({ recipientId, readStatus: false })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return await this.model.findByIdAndUpdate(
      notificationId,
      { readStatus: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a recipient
   */
  async markAllAsRead(recipientId: string) {
    return await this.model.updateMany(
      { recipientId, readStatus: false },
      { readStatus: true }
    );
  }

  /**
   * Get unread count for recipient
   */
  async getUnreadCount(recipientId: string) {
    return await this.model.countDocuments({ recipientId, readStatus: false });
  }

  /**
   * Create notification
   */
  async createNotification(data: {
    title: string;
    message: string;
    type: 'IN_APP' | 'EMAIL' | 'BOTH';
    recipientId: string;
  }) {
    return await this.model.create(data);
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(notifications: Array<{
    title: string;
    message: string;
    type: 'IN_APP' | 'EMAIL' | 'BOTH';
    recipientId: string;
  }>) {
    return await this.model.insertMany(notifications);
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    return await this.model.findByIdAndDelete(notificationId);
  }

  /**
   * Delete all notifications for recipient
   */
  async deleteAllForRecipient(recipientId: string) {
    return await this.model.deleteMany({ recipientId });
  }

  /**
   * Delete all read notifications for recipient
   */
  async deleteReadForRecipient(recipientId: string) {
    return await this.model.deleteMany({ recipientId, readStatus: true });
  }
}

// Create singleton instance
const notificationRepository = new NotificationRepository();

// Export for backward compatibility
export { Notification };
export const NotificationModel = notificationRepository;

export default notificationRepository;