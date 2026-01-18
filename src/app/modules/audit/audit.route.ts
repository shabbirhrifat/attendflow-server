/**
 * Audit Log Module - Routes
 *
 * Defines all audit log endpoints
 */

import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminGuard } from '../../middleware/admin.guard';

const router = Router();

// All audit routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/audit
 * @desc    Get all audit logs with filtering (admin only)
 * @access  Admin
 */
router.get('/', adminGuard, AuditController.getAuditLogs);

/**
 * @route   GET /api/v1/audit/my-logs
 * @desc    Get current user's audit logs
 * @access  Authenticated
 */
router.get('/my-logs', AuditController.getMyAuditLogs);

/**
 * @route   GET /api/v1/audit/entity/:entityId
 * @desc    Get audit logs for a specific entity
 * @access  Admin
 */
router.get('/entity/:entityId', adminGuard, AuditController.getEntityAuditLogs);

/**
 * @route   GET /api/v1/audit/failed-logins
 * @desc    Get failed login attempts (security monitoring)
 * @access  Admin
 */
router.get('/failed-logins', adminGuard, AuditController.getFailedLogins);

/**
 * @route   GET /api/v1/audit/recent-activity
 * @desc    Get recent system activity
 * @access  Admin
 */
router.get('/recent-activity', adminGuard, AuditController.getRecentActivity);

/**
 * @route   GET /api/v1/audit/stats
 * @desc    Get audit statistics
 * @access  Admin
 */
router.get('/stats', adminGuard, AuditController.getAuditStats);

/**
 * @route   POST /api/v1/audit/cleanup
 * @desc    Cleanup old audit logs
 * @access  Admin
 */
router.post('/cleanup', adminGuard, AuditController.cleanupOldLogs);

export default router;
