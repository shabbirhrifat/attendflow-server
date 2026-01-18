/**
 * Audit Log Module - Service Layer
 *
 * Handles business logic for tracking system actions
 */

import prisma from '../../config/prisma';
import { IAuditLogData, IAuditLogFilter, IAuditLogResponse, AuditAction } from './audit.interface';

/**
 * Create an audit log entry
 */
export const createAuditLog = async (data: IAuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
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
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  if (filters.success !== undefined) {
    where.success = filters.success;
  }

  // Get total count
  const total = await prisma.auditLog.count({ where });

  // Get paginated logs
  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * limit,
    take: limit,
  });

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

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return { deleted: result.count };
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
    prisma.auditLog.count({
      where: { createdAt: { gte: startDate } },
    }),

    // Successful logs
    prisma.auditLog.count({
      where: { createdAt: { gte: startDate }, success: true },
    }),

    // Failed logs
    prisma.auditLog.count({
      where: { createdAt: { gte: startDate }, success: false },
    }),

    // Count by action
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    }),

    // Count by entity
    prisma.auditLog.groupBy({
      by: ['entity'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { entity: 'desc' } },
    }),

    // Top active users
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startDate } },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
  ]);

  // Get user details for top users
  const userIds = topUsers.map((u) => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true },
  });

  const topUsersWithData = topUsers.map((u) => ({
    ...u,
    user: users.find((user) => user.id === u.userId),
  }));

  return {
    period: `${days} days`,
    total: totalLogs,
    successful: successfulLogs,
    failed: failedLogs,
    successRate: totalLogs > 0 ? ((successfulLogs / totalLogs) * 100).toFixed(2) + '%' : 'N/A',
    byAction: actionCounts,
    byEntity: entityCounts,
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
