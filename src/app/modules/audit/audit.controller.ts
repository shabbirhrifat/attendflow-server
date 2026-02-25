/**
 * Audit Log Module - Controller Layer
 *
 * Handles HTTP requests for audit log operations
 */

import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { IAuditLogFilter } from './audit.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

/**
 * Get all audit logs with filtering
 */
const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const {
    userId,
    action,
    entity,
    entityId,
    startDate,
    endDate,
    success,
    sortBy,
    sortOrder,
    page = '1',
    limit = '50',
  } = req.query;

  const filters: IAuditLogFilter = {};

  if (userId) filters.userId = userId as string;
  if (action) filters.action = action as any;
  if (entity) filters.entity = entity as any;
  if (entityId) filters.entityId = entityId as string;
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);
  if (success !== undefined) filters.success = success === 'true';
  if (sortBy) filters.sortBy = sortBy as string;
  if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';

  const result = await AuditService.getAuditLogs(
    filters,
    parseInt(page as string),
    parseInt(limit as string)
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Audit logs retrieved successfully',
    data: result,
  });
});

/**
 * Get audit logs for current user
 */
const getMyAuditLogs = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await AuditService.getUserAuditLogs(userId, page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Your audit logs retrieved successfully',
    data: result,
  });
});

/**
 * Get audit logs for a specific entity
 */
const getEntityAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { entityId } = req.params;

  if (!entityId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Entity ID is required');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await AuditService.getEntityAuditLogs(entityId, page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Entity audit logs retrieved successfully',
    data: result,
  });
});

/**
 * Get failed login attempts (admin only)
 */
const getFailedLogins = catchAsync(async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const result = await AuditService.getFailedLogins(hours, page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Failed login attempts retrieved successfully',
    data: result,
  });
});

/**
 * Get recent system activity
 */
const getRecentActivity = catchAsync(async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const limit = parseInt(req.query.limit as string) || 100;

  const result = await AuditService.getRecentActivity(hours, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Recent activity retrieved successfully',
    data: result,
  });
});

/**
 * Get audit statistics
 */
const getAuditStats = catchAsync(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;

  const stats = await AuditService.getAuditStats(days);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Audit statistics retrieved successfully',
    data: stats,
  });
});

/**
 * Cleanup old audit logs (admin only)
 */
const cleanupOldLogs = catchAsync(async (req: Request, res: Response) => {
  const { daysToKeep = '90' } = req.body;

  const result = await AuditService.cleanupOldLogs(parseInt(daysToKeep));

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: `Deleted ${result.deleted} old audit logs`,
    data: result,
  });
});

// Export all controllers
export const AuditController = {
  getAuditLogs,
  getMyAuditLogs,
  getEntityAuditLogs,
  getFailedLogins,
  getRecentActivity,
  getAuditStats,
  cleanupOldLogs,
};
