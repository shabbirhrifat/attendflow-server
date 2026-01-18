/**
 * Session Module - Routes
 *
 * Defines all session management endpoints
 */

import { Router } from 'express';
import { SessionController } from './session.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminGuard } from '../../middleware/admin.guard';

const router = Router();

// All session routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/sessions/my-sessions
 * @desc    Get current user's active sessions
 * @access  Authenticated
 */
router.get('/my-sessions', SessionController.getMySessions);

/**
 * @route   GET /api/v1/sessions/my-sessions/stats
 * @desc    Get current user's session statistics
 * @access  Authenticated
 */
router.get('/my-sessions/stats', SessionController.getSessionStats);

/**
 * @route   GET /api/v1/sessions/user/:userId
 * @desc    Get all sessions for a specific user (admin only)
 * @access  Admin
 */
router.get('/user/:userId', adminGuard, SessionController.getUserSessions);

/**
 * @route   DELETE /api/v1/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Authenticated (own sessions only)
 */
router.delete('/:sessionId', SessionController.revokeSession);

/**
 * @route   DELETE /api/v1/sessions/revoke-others
 * @desc    Revoke all other sessions (keep current)
 * @access  Authenticated
 */
router.delete('/revoke-others', SessionController.revokeOtherSessions);

/**
 * @route   DELETE /api/v1/sessions/revoke-all
 * @desc    Revoke all sessions (including current)
 * @access  Authenticated
 */
router.delete('/revoke-all', SessionController.revokeAllSessions);

/**
 * @route   POST /api/v1/sessions/cleanup
 * @desc    Cleanup expired sessions (admin only)
 * @access  Admin
 */
router.post('/cleanup', adminGuard, SessionController.cleanupSessions);

export default router;
