/**
 * Session Module - Service Layer
 *
 * Handles business logic for session management
 */

import prisma from '../../config/prisma';
import {
  ISessionData,
  ISessionResponse,
  IGetSessionsResponse,
  ICreateSessionResponse,
  IRevokeSessionResponse,
  ICleanupResponse,
} from './session.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

/**
 * Create a new session
 */
export const createSession = async (
  data: ISessionData
): Promise<ICreateSessionResponse> => {
  // Default expiration: 24 hours from now
  const expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: data.userId,
      token: data.token,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt,
    },
  });

  return {
    success: true,
    message: 'Session created successfully',
    data: session as any,
  };
};

/**
 * Get all sessions for a user
 */
export const getUserSessions = async (
  userId: string,
  currentToken?: string
): Promise<IGetSessionsResponse> => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActive: 'desc' },
  });

  const now = new Date();
  const active = sessions.filter((s) => s.expiresAt > now).length;
  const expired = sessions.filter((s) => s.expiresAt <= now).length;

  // Mark current session
  const sessionsWithCurrentFlag: ISessionResponse[] = sessions.map((s) => ({
    ...s,
    isCurrent: currentToken ? s.token === currentToken : false,
  }));

  return {
    success: true,
    message: 'Sessions retrieved successfully',
    data: {
      sessions: sessionsWithCurrentFlag,
      total: sessions.length,
      active,
      expired,
    },
  };
};

/**
 * Get a specific session by token
 */
export const getSessionByToken = async (token: string): Promise<any | null> => {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    return null;
  }

  return session;
};

/**
 * Update session last active timestamp
 */
export const updateSessionActivity = async (token: string): Promise<void> => {
  try {
    await prisma.session.update({
      where: { token },
      data: { lastActive: new Date() },
    });
  } catch (error) {
    // Ignore errors - session might have been deleted
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (
  sessionId: string,
  userId: string
): Promise<IRevokeSessionResponse> => {
  // Verify session belongs to user
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Session not found');
  }

  if (session.userId !== userId) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You do not have permission to revoke this session');
  }

  await prisma.session.delete({
    where: { id: sessionId },
  });

  return {
    success: true,
    message: 'Session revoked successfully',
  };
};

/**
 * Revoke all sessions for a user except current
 */
export const revokeAllOtherSessions = async (
  userId: string,
  currentToken: string
): Promise<IRevokeSessionResponse> => {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      token: { not: currentToken },
    },
  });

  return {
    success: true,
    message: `${result.count} other session(s) revoked successfully`,
  };
};

/**
 * Revoke all sessions for a user (including current)
 */
export const revokeAllSessions = async (userId: string): Promise<IRevokeSessionResponse> => {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });

  return {
    success: true,
    message: `${result.count} session(s) revoked successfully`,
  };
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async (): Promise<ICleanupResponse> => {
  const now = new Date();

  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });

  return {
    success: true,
    message: 'Expired sessions cleaned up successfully',
    deleted: result.count,
  };
};

/**
 * Enforce concurrent session limit
 * Removes oldest sessions if limit is exceeded
 */
export const enforceSessionLimit = async (
  userId: string,
  maxSessions: number = 5
): Promise<void> => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActive: 'asc' },
  });

  if (sessions.length > maxSessions) {
    // Delete oldest sessions
    const toDelete = sessions.slice(0, sessions.length - maxSessions);
    await prisma.session.deleteMany({
      where: {
        id: { in: toDelete.map((s) => s.id) },
      },
    });
  }
};

/**
 * Get session statistics for a user
 */
export const getSessionStats = async (userId: string): Promise<any> => {
  const sessions = await prisma.session.findMany({
    where: { userId },
  });

  const now = new Date();
  const active = sessions.filter((s) => s.expiresAt > now);
  const expired = sessions.filter((s) => s.expiresAt <= now);

  // Group by device/browser (userAgent)
  const byDevice: Record<string, number> = {};
  sessions.forEach((s) => {
    const device = s.userAgent || 'Unknown';
    byDevice[device] = (byDevice[device] || 0) + 1;
  });

  return {
    total: sessions.length,
    active: active.length,
    expired: expired.length,
    byDevice,
    lastActivity: sessions.length > 0 ? sessions[0].lastActive : null,
  };
};

// Export all services
export const SessionService = {
  createSession,
  getUserSessions,
  getSessionByToken,
  updateSessionActivity,
  revokeSession,
  revokeAllOtherSessions,
  revokeAllSessions,
  cleanupExpiredSessions,
  enforceSessionLimit,
  getSessionStats,
};
