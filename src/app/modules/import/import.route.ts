import { Router } from "express";
import { ImportController } from "./import.controller";
import { AuthMiddleware } from "../auth/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { ImportValidation } from "./import.validation";

const router = Router();

// All import routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @description validate import data before execution
 * @param {string} path - /api/import/validate
 * @param {function} middleware - ['AuthorizeRequest("ADMIN")', 'validateRequest(ImportValidation.validateImport)']
 * @param {function} controller - ['validateImport']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/validate",
    AuthMiddleware.authorize('ADMIN'),
    validateRequest(ImportValidation.validateImport),
    ImportController.validateImport
);

/**
 * @description execute import data after validation
 * @param {string} path - /api/import/execute
 * @param {function} middleware - ['AuthMiddleware.authorize("ADMIN")', 'validateRequest(ImportValidation.executeImport)']
 * @param {function} controller - ['executeImport']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/execute",
    AuthMiddleware.authorize('ADMIN'),
    validateRequest(ImportValidation.executeImport),
    ImportController.executeImport
);

export const ImportRoutes = router;
