/**
 * Audit Log Module - Controller Layer
 *
 * Handles HTTP requests for audit log operations
 */

import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { IAuditLogFilter } from './audit.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

/**
 * Get all audit logs with filtering
 */
export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs for current user
 */
export const getMyAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await AuditService.getUserAuditLogs(userId, page, limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Your audit logs retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs for a specific entity
 */
export const getEntityAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { entityId } = req.params;

    if (!entityId) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Entity ID is required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await AuditService.getEntityAuditLogs(entityId, page, limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Entity audit logs retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get failed login attempts (admin only)
 */
export const getFailedLogins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await AuditService.getFailedLogins(hours, page, limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Failed login attempts retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent system activity
 */
export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const limit = parseInt(req.query.limit as string) || 100;

    const result = await AuditService.getRecentActivity(hours, limit);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const stats = await AuditService.getAuditStats(days);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Audit statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cleanup old audit logs (admin only)
 */
export const cleanupOldLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { daysToKeep = '90' } = req.body;

    const result = await AuditService.cleanupOldLogs(parseInt(daysToKeep));

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Deleted ${result.deleted} old audit logs`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

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
