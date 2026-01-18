/**
 * Session Module - Controller Layer
 *
 * Handles HTTP requests for session operations
 */

import { Request, Response, NextFunction } from 'express';
import { SessionService } from './session.service';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

/**
 * Get all sessions for current user
 */
export const getMySessions = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.id;
  // @ts-ignore
  const currentToken = req.headers.authorization?.replace('Bearer ', '');

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await SessionService.getUserSessions(userId, currentToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

/**
 * Get all sessions for a specific user (admin only)
 */
export const getUserSessions = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User ID is required');
  }

  const result = await SessionService.getUserSessions(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

/**
 * Revoke a specific session
 */
export const revokeSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await SessionService.revokeSession(sessionId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
  });
});

/**
 * Revoke all other sessions (keep current)
 */
export const revokeOtherSessions = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.id;
  // @ts-ignore
  const currentToken = req.headers.authorization?.replace('Bearer ', '');

  if (!userId || !currentToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await SessionService.revokeAllOtherSessions(userId, currentToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
  });
});

/**
 * Revoke all sessions (including current)
 */
export const revokeAllSessions = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const result = await SessionService.revokeAllSessions(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
  });
});

/**
 * Get session statistics
 */
export const getSessionStats = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const stats = await SessionService.getSessionStats(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Session statistics retrieved successfully',
    data: stats,
  });
});

/**
 * Cleanup expired sessions (admin only)
 */
export const cleanupSessions = catchAsync(async (req: Request, res: Response) => {
  const result = await SessionService.cleanupExpiredSessions();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
    data: { deleted: result.deleted },
  });
});

// Export all controllers
export const SessionController = {
  getMySessions,
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
  revokeAllSessions,
  getSessionStats,
  cleanupSessions,
};
