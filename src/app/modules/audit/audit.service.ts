/**
 * Audit Log Module - Service Layer
 *
 * Handles business logic for tracking system actions
 */

import { AuditLogModel } from './audit.model';
import { IAuditLogData, IAuditLogFilter, IAuditLogResponse, AuditAction } from './audit.interface';
import UserModel from '../user/user.model';

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: IAuditLogData): Promise<void> => {
  try {
    await AuditLogModel.model.create({
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      changes: data.changes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: data.success ?? true,
      errorMessage: data.errorMessage,
    });
  } catch (error) {
    // Log errors but don't throw - audit logging should not break the application
    console.error('Failed to create audit log:', error);
  }
};

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (
  filters: IAuditLogFilter,
  page: number = 1,
  limit: number = 50
): Promise<IAuditLogResponse> => {
  const where: any = {};

  // Build where clause based on filters
  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entity) {
    where.entity = filters.entity;
  }

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.$gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.$lte = filters.endDate;
    }
  }

  if (filters.success !== undefined) {
    where.success = filters.success;
  }

  // Build orderBy based on filters
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Get total count
  const total = await AuditLogModel.model.countDocuments(where);

  // Get paginated logs
  const logs = await AuditLogModel.model
    .find(where)
    .populate('user', 'id name email role')
    .sort(orderBy)
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Audit logs retrieved successfully',
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get audit logs for a specific user
 */
export const getUserAuditLogs = async (
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<IAuditLogResponse> => {
  return getAuditLogs({ userId }, page, limit);
};

/**
 * Get audit logs for a specific entity
 */
export const getEntityAuditLogs = async (
  entityId: string,
  page: number = 1,
  limit: number = 50
): Promise<IAuditLogResponse> => {
  return getAuditLogs({ entityId }, page, limit);
};

/**
 * Get failed login attempts (for security monitoring)
 */
export const getFailedLogins = async (
  hours: number = 24,
  page: number = 1,
  limit: number = 50
): Promise<IAuditLogResponse> => {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return getAuditLogs(
    {
      action: AuditAction.LOGIN_FAILED,
      startDate,
      success: false,
    },
    page,
    limit
  );
};

/**
 * Get recent system activity
 */
export const getRecentActivity = async (
  hours: number = 24,
  limit: number = 100
): Promise<IAuditLogResponse> => {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return getAuditLogs({ startDate }, 1, limit);
};

/**
 * Delete old audit logs (for maintenance)
 */
export const cleanupOldLogs = async (daysToKeep: number = 90): Promise<{ deleted: number }> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await AuditLogModel.model.deleteMany({
    createdAt: {
      $lt: cutoffDate,
    },
  });

  return { deleted: result.deletedCount || 0 };
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (days: number = 30): Promise<any> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    totalLogs,
    successfulLogs,
    failedLogs,
    actionCounts,
    entityCounts,
    topUsers,
  ] = await Promise.all([
    // Total logs
    AuditLogModel.model.countDocuments({
      createdAt: { $gte: startDate },
    }),

    // Successful logs
    AuditLogModel.model.countDocuments({
      createdAt: { $gte: startDate },
      success: true,
    }),

    // Failed logs
    AuditLogModel.model.countDocuments({
      createdAt: { $gte: startDate },
      success: false,
    }),

    // Count by action
    AuditLogModel.model.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Count by entity
    AuditLogModel.model.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$entity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Top active users
    AuditLogModel.model.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // Get user details for top users
  const userIds = topUsers.map((u: any) => u._id);
  const users = await UserModel.model.find({
    _id: { $in: userIds },
  }).select('id name email role');

  const topUsersWithData = topUsers.map((u: any) => ({
    userId: u._id,
    count: u.count,
    user: users.find((user: any) => user.id === u._id),
  }));

  return {
    period: `${days} days`,
    total: totalLogs,
    successful: successfulLogs,
    failed: failedLogs,
    successRate: totalLogs > 0 ? ((successfulLogs / totalLogs) * 100).toFixed(2) + '%' : 'N/A',
    byAction: actionCounts.map((a: any) => ({ action: a._id, count: a.count })),
    byEntity: entityCounts.map((e: any) => ({ entity: e._id, count: e.count })),
    topUsers: topUsersWithData,
  };
};

// Export all services
export const AuditService = {
  createAuditLog,
  getAuditLogs,
  getUserAuditLogs,
  getEntityAuditLogs,
  getFailedLogins,
  getRecentActivity,
  cleanupOldLogs,
  getAuditStats,
};
