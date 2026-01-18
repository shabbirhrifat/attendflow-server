/**
 * Bulk Operations Module - Routes
 *
 * Defines all bulk operation endpoints
 */

import { Router } from 'express';
import { BulkController } from './bulk.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminGuard } from '../../middleware/admin.guard';
import validateRequest from '../../middlewares/validateRequest';
import { BulkValidation } from './bulk.validation';

const router = Router();

// All bulk routes require authentication and admin role
router.use(authMiddleware);
router.use(adminGuard);

/**
 * @route   POST /api/v1/bulk/create
 * @desc    Bulk create entities (users, students, teachers)
 * @access  Admin
 */
router.post('/create', validateRequest(BulkValidation.bulkCreate), BulkController.bulkCreate);

/**
 * @route   PATCH /api/v1/bulk/update
 * @desc    Bulk update entities
 * @access  Admin
 */
router.patch('/update', validateRequest(BulkValidation.bulkUpdate), BulkController.bulkUpdate);

/**
 * @route   DELETE /api/v1/bulk/delete
 * @desc    Bulk delete entities
 * @access  Admin
 */
router.delete('/delete', validateRequest(BulkValidation.bulkDelete), BulkController.bulkDelete);

/**
 * @route   POST /api/v1/bulk/mark-attendance
 * @desc    Bulk mark attendance for students
 * @access  Teacher/Admin
 */
router.post(
  '/mark-attendance',
  validateRequest(BulkValidation.bulkMarkAttendance),
  BulkController.bulkMarkAttendance
);

export default router;
