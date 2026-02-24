import nodemailer from 'nodemailer';
import { NotificationModel } from './notification.model';
import {
    INotification,
    INotificationCreate,
    INotificationUpdate,
    INotificationResponse,
    INotificationListResponse,
    INotificationQueryOptions,
    INotificationStats,
    INotificationFilters,
    ISendNotificationPayload,
    IEmailNotificationPayload,
    IBulkNotificationPayload,
    IEmailConfig,
    NotificationType,
    EmailStatus
} from './notification.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import UserModel from '../user/user.model';
import config from '../../config';

// Create Nodemailer transporter
const createEmailTransporter = () => {
    const emailConfig: IEmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: config.email_user || '',
            pass: config.email_pass || '',
        },
    };

    return nodemailer.createTransport(emailConfig);
};

// Send email using Nodemailer
const sendEmail = async (to: string, subject: string, html: string, options?: any) => {
    try {
        const transporter = createEmailTransporter();

        const mailOptions = {
            from: config.email_user || '',
            to,
            subject,
            html,
            ...options,
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

// Create a new notification
const createNotification = async (data: INotificationCreate): Promise<INotificationResponse> => {
    // Check if recipient exists
    const recipient = await UserModel.findById(data.recipientId);

    if (!recipient) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Recipient not found');
    }

    // Create notification
    const notification = await NotificationModel.create({
        recipientId: data.recipientId,
        title: data.title,
        message: data.message,
        type: data.type,
        readStatus: data.readStatus,
        emailStatus: data.type === 'EMAIL' || data.type === 'BOTH' ? 'PENDING' : null,
    });

    // If it's an email notification, send it
    if (data.type === 'EMAIL' || data.type === 'BOTH') {
        const emailResult = await sendEmail(
            recipient.email,
            data.title,
            data.message
        );

        // Update email status
        await NotificationModel.update(notification.id, {
            emailStatus: emailResult.success ? 'SENT' : 'FAILED',
        });
    }

    // Get notification with recipient data
    const notificationWithRecipient = await NotificationModel.findById(notification.id)
        .populate('recipient', 'id name email role');

    return notificationWithRecipient as INotificationResponse;
};

// Send notification to a single user
const sendNotification = async (payload: ISendNotificationPayload): Promise<INotificationResponse> => {
    const notificationData: INotificationCreate = {
        recipientId: payload.recipientId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'IN_APP',
        readStatus: false,
        emailStatus: payload.type === 'EMAIL' || payload.type === 'BOTH' ? 'PENDING' : null,
    };

    return createNotification(notificationData);
};

// Send email notification
const sendEmailNotification = async (payload: IEmailNotificationPayload): Promise<INotificationResponse> => {
    const recipient = await UserModel.findById(payload.recipientId);

    if (!recipient) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Recipient not found');
    }

    // Create notification
    const notification = await NotificationModel.create({
        recipientId: payload.recipientId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        readStatus: false,
        emailStatus: 'PENDING',
    });

    // Prepare email options
    const emailOptions = {
        to: payload.emailOptions?.to || [recipient.email],
        cc: payload.emailOptions?.cc,
        bcc: payload.emailOptions?.bcc,
        attachments: payload.emailOptions?.attachments,
    };

    // Send email
    const emailResult = await sendEmail(
        recipient.email,
        payload.title,
        payload.message,
        emailOptions
    );

    // Update email status
    const updatedNotification = await NotificationModel.update(notification.id, {
        emailStatus: emailResult.success ? 'SENT' : 'FAILED',
    });

    const populated = await NotificationModel.findById(updatedNotification.id)
        .populate('recipient', 'id name email role');

    return populated as INotificationResponse;
};

// Send bulk notifications
const sendBulkNotifications = async (payload: IBulkNotificationPayload): Promise<INotificationResponse[]> => {
    const notifications: INotificationResponse[] = [];

    for (const recipientId of payload.recipientIds) {
        try {
            const notificationData: INotificationCreate = {
                recipientId,
                title: payload.title,
                message: payload.message,
                type: payload.type || 'IN_APP',
                readStatus: false,
                emailStatus: 'PENDING',
            };

            const notification = await createNotification(notificationData);
            notifications.push(notification);
        } catch (error) {
            console.error(`Failed to send notification to user ${recipientId}:`, error);
        }
    }

    return notifications;
};

// Broadcast notification to all users of a specific role
const broadcastNotification = async (payload: { role: string; title: string; message: string; type?: NotificationType; priority?: string }): Promise<INotificationResponse[]> => {
    let users;
    if (payload.role === 'ALL') {
        users = await UserModel.model.find({}, { _id: 1 });
    } else {
        users = await UserModel.model.find({ role: payload.role }, { _id: 1 });
    }

    const recipientIds = users.map(u => u._id.toString());

    if (recipientIds.length === 0) {
        return [];
    }

    return sendBulkNotifications({
        recipientIds,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority as any,
    });
};

// Get all notifications with query builder support
const getAllNotifications = async (query: INotificationQueryOptions): Promise<INotificationListResponse> => {
    const queryBuilder = new QueryBuilder(query as Record<string, unknown>);

    // Build where clause based on filters
    let whereClause: any = {};

    if (query.filters) {
        const { type, readStatus, emailStatus, recipientId, search, dateRange } = query.filters;

        if (type) whereClause.type = type;
        if (readStatus !== undefined) whereClause.readStatus = readStatus;
        if (emailStatus) whereClause.emailStatus = emailStatus;
        if (recipientId) whereClause.recipientId = recipientId;

        if (search) {
            whereClause.$or = [
                { title: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ];
        }

        if (dateRange) {
            whereClause.createdAt = {
                $gte: dateRange.start,
                $lte: dateRange.end,
            };
        }
    }

    // Build query with search, filter, sort, pagination
    queryBuilder.search(['title', 'message']).filter().sort().paginate();

    const filter = queryBuilder.getFilter();
    const sort = queryBuilder.getSort();
    const pagination = queryBuilder.getPagination();

    // Merge with custom filters
    const finalFilter = { ...filter, ...whereClause };

    // Execute query
    const [notifications, total] = await Promise.all([
        NotificationModel.model.find(finalFilter)
            .populate('recipient', 'id name email role')
            .sort(sort)
            .skip((pagination.page - 1) * pagination.limit)
            .limit(pagination.limit),
        NotificationModel.model.countDocuments(finalFilter),
    ]);

    const meta = queryBuilder.getPaginationMeta(total);
    const page = query.page || 1;
    const limit = query.limit || 20;

    return {
        notifications: notifications.map((notification: any) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
            readStatus: notification.readStatus,
            emailStatus: notification.emailStatus,
            recipientId: notification.recipientId,
            recipient: notification.recipient,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
    };
};

// Get a single notification by ID
const getNotificationById = async (id: string): Promise<INotificationResponse | null> => {
    const notification = await NotificationModel.findById(id)
        .populate('recipient', 'id name email role');

    return notification as INotificationResponse | null;
};

// Update a notification
const updateNotification = async (id: string, data: INotificationUpdate): Promise<INotificationResponse | null> => {
    // Check if notification exists
    const existingNotification = await NotificationModel.findById(id);

    if (!existingNotification) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
    }

    const updatedNotification = await NotificationModel.update(id, data);

    if (!updatedNotification) {
        return null;
    }

    const populated = await NotificationModel.findById(id)
        .populate('recipient', 'id name email role');

    return populated as INotificationResponse;
};

// Mark notification as read/unread
const markNotificationAsRead = async (id: string, readStatus: boolean): Promise<INotificationResponse | null> => {
    return updateNotification(id, { readStatus });
};

// Delete a notification
const deleteNotification = async (id: string): Promise<void> => {
    // Check if notification exists
    const existingNotification = await NotificationModel.findById(id);

    if (!existingNotification) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
    }

    await NotificationModel.delete(id);
};

// Resend failed email notifications
const resendFailedEmail = async (id: string): Promise<INotificationResponse | null> => {
    const notification = await NotificationModel.findById(id)
        .populate('recipient', 'id name email role');

    if (!notification) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
    }

    const notifObj = notification.toObject ? notification.toObject() : notification;

    if (notifObj.type !== 'EMAIL' && notifObj.type !== 'BOTH') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Notification is not an email type');
    }

    if (notifObj.emailStatus && notifObj.emailStatus !== 'FAILED') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Email was not failed, no need to resend');
    }

    // Update status to pending
    await NotificationModel.update(id, { emailStatus: 'PENDING' });

    // Resend email
    const emailResult = await sendEmail(
        notifObj.recipient?.email,
        notifObj.title,
        notifObj.message
    );

    // Update email status
    await NotificationModel.update(id, {
        emailStatus: emailResult.success ? 'SENT' : 'FAILED',
    });

    const updated = await NotificationModel.findById(id)
        .populate('recipient', 'id name email role');

    return updated as INotificationResponse;
};

// Get notification statistics
const getNotificationStats = async (recipientId?: string): Promise<INotificationStats> => {
    let whereClause: any = {};

    if (recipientId) {
        whereClause.recipientId = recipientId;
    }

    const [
        totalNotifications,
        readNotifications,
        inAppNotifications,
        emailNotifications,
        pendingEmails,
        sentEmails,
        failedEmails,
    ] = await Promise.all([
        NotificationModel.model.countDocuments(whereClause),
        NotificationModel.model.countDocuments({ ...whereClause, readStatus: true }),
        NotificationModel.model.countDocuments({ ...whereClause, type: 'IN_APP' }),
        NotificationModel.model.countDocuments({ ...whereClause, type: 'EMAIL' }),
        NotificationModel.model.countDocuments({ ...whereClause, emailStatus: 'PENDING' }),
        NotificationModel.model.countDocuments({ ...whereClause, emailStatus: 'SENT' }),
        NotificationModel.model.countDocuments({ ...whereClause, emailStatus: 'FAILED' }),
    ]);

    return {
        totalNotifications,
        readNotifications,
        unreadNotifications: totalNotifications - readNotifications,
        inAppNotifications,
        emailNotifications,
        pendingEmails,
        sentEmails,
        failedEmails,
    };
};

// Mark all notifications as read for a user
const markAllNotificationsAsRead = async (recipientId: string): Promise<void> => {
    await NotificationModel.model.updateMany(
        {
            recipientId,
            readStatus: false,
        },
        {
            readStatus: true,
        }
    );
};

// Delete all read notifications for a user
const deleteAllReadNotifications = async (recipientId: string): Promise<void> => {
    await NotificationModel.model.deleteMany({
        recipientId,
        readStatus: true,
    });
};

export const notificationServices = {
    createNotification,
    sendNotification,
    sendEmailNotification,
    sendBulkNotifications,
    broadcastNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    markNotificationAsRead,
    deleteNotification,
    resendFailedEmail,
    getNotificationStats,
    markAllNotificationsAsRead,
    deleteAllReadNotifications,
};