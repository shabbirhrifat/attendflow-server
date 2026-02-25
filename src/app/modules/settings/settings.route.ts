import { Router } from "express";
import { SettingsController } from "./settings.controller";
import { AuthMiddleware } from "../auth/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { SettingsValidation } from "./settings.validation";

const router = Router();

// All settings routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @description get system settings
 * @param {string} path - /api/settings/
 * @param {function} middleware - ['AuthorizeRequest("ADMIN")', 'validateRequest(SettingsValidation.getSettingsQuery)']
 * @param {function} controller - ['getSettings']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method GET
 */
router.get(
    "/",
    AuthMiddleware.authorize('ADMIN'),
    validateRequest(SettingsValidation.getSettingsQuery),
    SettingsController.getSettings
);

/**
 * @description update system settings
 * @param {string} path - /api/settings/
 * @param {function} middleware - ['AuthMiddleware.authorize("ADMIN")', 'validateRequest(SettingsValidation.updateSettings)']
 * @param {function} controller - ['updateSettings']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
    "/",
    AuthMiddleware.authorize('ADMIN'),
    validateRequest(SettingsValidation.updateSettings),
    SettingsController.updateSettings
);

export const SettingsRoutes = router;
