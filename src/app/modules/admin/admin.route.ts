import { Router } from 'express';
import { AdminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from '../auth/auth.validation';

const router = Router();

/**
 * @description Login for administrators and teachers
 * @param {string} path - /api/admin/auth/login
 * @param {function} middleware - ['validateRequest(AuthValidation.userLoginValidationSchema)']
 * @param {function} controller - ['loginAdmin']
 * @returns {object} - router
 * @access public
 * @method POST
 */
router.post(
    '/auth/login',
    validateRequest(AuthValidation.userLoginValidationSchema),
    AdminController.loginAdmin
);

/**
 * @description Register new administrator or teacher
 * @param {string} path - /api/admin/auth/register
 * @param {function} middleware - ['validateRequest(AuthValidation.adminRegistrationValidationSchema)']
 * @param {function} controller - ['registerAdmin']
 * @returns {object} - router
 * @access public
 * @method POST
 */
router.post(
    '/auth/register',
    validateRequest(AuthValidation.adminRegistrationValidationSchema),
    AdminController.registerAdmin
);

export const AdminRoutes = router;
