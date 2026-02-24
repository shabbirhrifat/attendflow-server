// Local type definitions for Notification module
export type NotificationType = 'IN_APP' | 'EMAIL' | 'BOTH';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

// Notification interface
export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  readStatus: boolean;
  emailStatus?: EmailStatus;
  recipientId: string;
  createdAt: Date;
  updatedAt: Date;
}

// For creating a new notification
export interface INotificationCreate {
  recipientId: string;
  title: string;
  message: string;
  type?: NotificationType;
  readStatus?: boolean;
}

// For updating a notification
export type INotificationUpdate = Partial<INotificationCreate>;

// Notification response with additional information
export interface INotificationResponse extends Omit<INotification, 'recipientId'> {
  recipient: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Notification statistics
export interface INotificationStats {
  totalNotifications: number;
  readNotifications: number;
  unreadNotifications: number;
  inAppNotifications: number;
  emailNotifications: number;
  pendingEmails: number;
  sentEmails: number;
  failedEmails: number;
}

// Notification filters for queries
export interface INotificationFilters {
  type?: NotificationType;
  readStatus?: boolean;
  emailStatus?: EmailStatus;
  recipientId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Send notification payload
export interface ISendNotificationPayload {
  recipientId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  scheduledAt?: Date;
}

// Email notification payload
export interface IEmailNotificationPayload extends ISendNotificationPayload {
  type: 'EMAIL' | 'BOTH';
  emailOptions?: {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{
      filename: string;
      path: string;
      contentType?: string;
    }>;
  };
}

// Bulk notification payload
export interface IBulkNotificationPayload {
  recipientIds: string[];
  title: string;
  message: string;
  type?: NotificationType;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  scheduledAt?: Date;
}

// Notification query options
export interface INotificationQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  filters?: INotificationFilters;
}

// Notification list response
export interface INotificationListResponse {
  notifications: INotificationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Email configuration for Nodemailer
export interface IEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Notification template
export interface INotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  variables: string[];
}

// Notification event types for integration
export type NotificationEventType =
  | 'ATTENDANCE_MARKED'
  | 'ATTENDANCE_LOW'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'QR_CHECK_IN'
  | 'QR_CHECK_OUT'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED';

// Notification event payload
export interface INotificationEvent {
  type: NotificationEventType;
  userId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}
