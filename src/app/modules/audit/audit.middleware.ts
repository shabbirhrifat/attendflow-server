/**
 * Audit Log Module - Middleware
 *
 * Automatically logs HTTP requests for compliance and security
 */

import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { AuditAction, AuditEntityType } from './audit.interface';

/**
 * Extract user ID from request
 */
const extractUserId = (req: Request): string => {
  // @ts-ignore - user is attached by auth middleware
  return req.user?.id || 'anonymous';
};

/**
 * Extract IP address from request
 */
const extractIpAddress = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.headers['x-real-ip'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Extract user agent from request
 */
const extractUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

/**
 * Map HTTP methods to AuditActions
 */
const mapMethodToAction = (method: string, success: boolean): AuditAction => {
  if (!success) {
    return AuditAction.LOGIN_FAILED; // Generic failure for most operations
  }

  switch (method.toUpperCase()) {
    case 'GET':
      return AuditAction.UPDATE; // Get is not an audit action, treat as update for viewing
    case 'POST':
      return AuditAction.CREATE;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return AuditAction.UPDATE;
  }
};

/**
 * Map request path to entity type
 */
const mapPathToEntity = (path: string): AuditEntityType => {
  if (path.includes('/users')) return 'User';
  if (path.includes('/students')) return 'Student';
  if (path.includes('/teachers')) return 'Teacher';
  if (path.includes('/courses')) return 'Course';
  if (path.includes('/departments')) return 'Department';
  if (path.includes('/batches')) return 'Batch';
  if (path.includes('/attendance')) return 'Attendance';
  if (path.includes('/leaves')) return 'Leave';
  if (path.includes('/settings')) return 'Setting';
  if (path.includes('/notifications')) return 'Notification';
  if (path.includes('/sessions')) return 'Session';
  if (path.includes('/import')) return 'Import';
  if (path.includes('/export')) return 'Export';
  return 'User'; // Default
};

/**
 * Extract entity ID from request params
 */
const extractEntityId = (req: Request): string | undefined => {
  return req.params.id || req.params.userId || req.params.courseId || undefined;
};

/**
 * Audit logging middleware
 * Logs all requests to sensitive endpoints
 */
export const auditMiddleware = (excludePaths: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Skip GET requests to reduce noise (only log modifications)
    if (req.method === 'GET') {
      return next();
    }

    // Store original send to capture response
    const originalSend = res.send;
    let responseData: any;

    res.send = function (data) {
      responseData = data;
      return originalSend.call(this, data);
    };

    // Continue to next middleware
    res.on('finish', async () => {
      const userId = extractUserId(req);
      const ipAddress = extractIpAddress(req);
      const userAgent = extractUserAgent(req);
      const entity = mapPathToEntity(req.path);
      const entityId = extractEntityId(req);
      const success = res.statusCode >= 200 && res.statusCode < 400;

      // Special handling for auth endpoints
      if (req.path.includes('/auth/login')) {
        await AuditService.createAuditLog({
          userId,
          action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
          entity: 'User',
          ipAddress,
          userAgent,
          success,
          errorMessage: !success ? responseData?.message || 'Login failed' : undefined,
        });
        return;
      }

      if (req.path.includes('/auth/logout')) {
        await AuditService.createAuditLog({
          userId,
          action: AuditAction.LOGOUT,
          entity: 'User',
          ipAddress,
          userAgent,
          success,
        });
        return;
      }

      if (req.path.includes('/import')) {
        await AuditService.createAuditLog({
          userId,
          action: AuditAction.IMPORT,
          entity: 'Import',
          entityId,
          ipAddress,
          userAgent,
          success,
          errorMessage: !success ? responseData?.message : undefined,
        });
        return;
      }

      if (req.path.includes('/export')) {
        await AuditService.createAuditLog({
          userId,
          action: AuditAction.EXPORT,
          entity: 'Export',
          entityId,
          ipAddress,
          userAgent,
          success,
        });
        return;
      }

      if (req.path.includes('/attendance') && req.method === 'POST') {
        await AuditService.createAuditLog({
          userId,
          action: AuditAction.ATTENDANCE_MARKED,
          entity: 'Attendance',
          entityId,
          ipAddress,
          userAgent,
          success,
        });
        return;
      }

      if (req.path.includes('/attendance') && (req.method === 'PUT' || req.method === 'PATCH')) {
        await AuditService.createAuditLog({
          userId,
          action: AuditAction.ATTENDANCE_MODIFIED,
          entity: 'Attendance',
          entityId,
          ipAddress,
          userAgent,
          success,
        });
        return;
      }

      // Generic logging for other modifications
      if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        await AuditService.createAuditLog({
          userId,
          action: mapMethodToAction(req.method, success),
          entity,
          entityId,
          ipAddress,
          userAgent,
          success,
          errorMessage: !success ? responseData?.message : undefined,
        });
      }
    });

    next();
  };
};

/**
 * Login audit helper
 */
export const auditLogin = async (
  userId: string,
  success: boolean,
  req: Request,
  errorMessage?: string
): Promise<void> => {
  await AuditService.createAuditLog({
    userId,
    action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
    entity: 'User',
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
    success,
    errorMessage,
  });
};

/**
 * Logout audit helper
 */
export const auditLogout = async (userId: string, req: Request): Promise<void> => {
  await AuditService.createAuditLog({
    userId,
    action: AuditAction.LOGOUT,
    entity: 'User',
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
    success: true,
  });
};

/**
 * Password change audit helper
 */
export const auditPasswordChange = async (
  userId: string,
  req: Request,
  success: boolean = true
): Promise<void> => {
  await AuditService.createAuditLog({
    userId,
    action: AuditAction.PASSWORD_CHANGE,
    entity: 'User',
    entityId: userId,
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
    success,
  });
};

/**
 * Role change audit helper
 */
export const auditRoleChange = async (
  adminUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  req: Request
): Promise<void> => {
  await AuditService.createAuditLog({
    userId: adminUserId,
    action: AuditAction.ROLE_CHANGE,
    entity: 'User',
    entityId: targetUserId,
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
    },
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
    success: true,
  });
};
