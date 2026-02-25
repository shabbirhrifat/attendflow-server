import { Router } from "express";
import { userControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import { AuthMiddleware } from "../auth/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @description create a new user
 * @param {string} path - /api/user/create-user
 * @param {function} middleware - ['validateRequest(userValidation.createUserSchema)']
 * @param {function} controller - ['createUser']
 * @returns {object} - router
 * @access private
 * @method POST
 */
router.post(
  "/create-user",
  validateRequest(userValidation.createUserSchema),
  userControllers.createUser
);

/**
 * @description get a single user by ID
 * @param {string} path - /api/user/:id
 * @param {function} middleware - ['validateRequest(userValidation.userIdParamSchema)']
 * @param {function} controller - ['getSingleUser']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
  "/:id",
  validateRequest(userValidation.userIdParamSchema),
  userControllers.getSingleUser
);

/**
 * @description get all users with filtering
 * @param {string} path - /api/user/
 * @param {function} middleware - ['validateRequest(userValidation.userFiltersSchema)']
 * @param {function} controller - ['getAllUsers']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
  "/",
  validateRequest(userValidation.userFiltersSchema),
  userControllers.getAllUsers
);

/**
 * @description update a user
 * @param {string} path - /api/user/:id
 * @param {function} middleware - ['validateRequest(userValidation.userIdParamSchema)', 'validateRequest(userValidation.updateUserSchema)']
 * @param {function} controller - ['updateUser']
 * @returns {object} - router
 * @access private
 * @method PATCH
 */
router.patch(
  "/:id",
  validateRequest(userValidation.userIdParamSchema),
  validateRequest(userValidation.updateUserSchema),
  userControllers.updateUser
);

/**
 * @description delete a user
 * @param {string} path - /api/user/:id
 * @param {function} middleware - ['validateRequest(userValidation.userIdParamSchema)']
 * @param {function} controller - ['deleteUser']
 * @returns {object} - router
 * @access private
 * @method DELETE
 */
router.delete(
  "/:id",
  validateRequest(userValidation.userIdParamSchema),
  userControllers.deleteUser
);

/**
 * @description change user role
 * @param {string} path - /api/user/:id/role
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(userValidation.userIdParamSchema)', 'validateRequest(userValidation.changeUserRoleSchema)']
 * @param {function} controller - ['changeUserRole']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
  "/:id/role",
  AuthMiddleware.authorize('ADMIN'),
  validateRequest(userValidation.userIdParamSchema),
  validateRequest(userValidation.changeUserRoleSchema),
  userControllers.changeUserRole
);

/**
 * @description change user status
 * @param {string} path - /api/user/:id/status
 * @param {function} middleware - ['AuthMiddleware.authorize("ADMIN")', 'validateRequest(userValidation.userIdParamSchema)', 'validateRequest(userValidation.changeUserStatusSchema)']
 * @param {function} controller - ['changeUserStatus']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
  "/:id/status",
  AuthMiddleware.authorize('ADMIN'),
  validateRequest(userValidation.userIdParamSchema),
  validateRequest(userValidation.changeUserStatusSchema),
  userControllers.changeUserStatus
);

/**
 * @description get user profile
 * @param {string} path - /api/user/profile/:id
 * @param {function} middleware - ['validateRequest(userValidation.userIdParamSchema)']
 * @param {function} controller - ['getUserProfile']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
  "/profile/:id",
  validateRequest(userValidation.userIdParamSchema),
  userControllers.getUserProfile
);

/**
 * @description get user statistics
 * @param {string} path - /api/user/stats
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)']
 * @param {function} controller - ['getUserStats']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method GET
 */
router.get(
  "/stats",
  AuthMiddleware.authorize('ADMIN'),
  userControllers.getUserStats
);

/**
 * @description get users by role
 * @param {string} path - /api/user/role/:role
 * @param {function} middleware - ['validateRequest(userValidation.userRoleParamSchema)']
 * @param {function} controller - ['getUsersByRole']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
  "/role/:role",
  validateRequest(userValidation.userRoleParamSchema),
  userControllers.getUsersByRole
);

/**
 * @description search users
 * @param {string} path - /api/user/search
 * @param {function} middleware - ['validateRequest(userValidation.userSearchSchema)']
 * @param {function} controller - ['searchUsers']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
  "/search",
  validateRequest(userValidation.userSearchSchema),
  userControllers.searchUsers
);

/**
 * @description update user profile
 * @param {string} path - /api/user/profile/:id
 * @param {function} middleware - ['validateRequest(userValidation.userIdParamSchema)', 'validateRequest(userValidation.updateUserProfileSchema)']
 * @param {function} controller - ['updateUserProfile']
 * @returns {object} - router
 * @access private
 * @method PATCH
 */
router.patch(
  "/profile/:id",
  validateRequest(userValidation.userIdParamSchema),
  validateRequest(userValidation.updateUserProfileSchema),
  userControllers.updateUserProfile
);

/**
 * @description soft delete user
 * @param {string} path - /api/user/:id/deactivate
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(userValidation.userIdParamSchema)']
 * @param {function} controller - ['softDeleteUser']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
  "/:id/deactivate",
  AuthMiddleware.authorize('ADMIN'),
  validateRequest(userValidation.userIdParamSchema),
  userControllers.softDeleteUser
);

/**
 * @description bulk update user status
 * @param {string} path - /api/user/bulk/status
 * @param {function} middleware - ['AuthMiddleware.authorize("ADMIN")', 'validateRequest(userValidation.bulkUpdateUserStatusSchema)']
 * @param {function} controller - ['bulkUpdateUserStatus']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
  "/bulk/status",
  AuthMiddleware.authorize('ADMIN'),
  validateRequest(userValidation.bulkUpdateUserStatusSchema),
  userControllers.bulkUpdateUserStatus
);

/**
 * @description get user activity logs
 * @param {string} path - /api/user/activity/:id
 * @param {function} middleware - ['validateRequest(userValidation.userIdParamSchema)']
 * @param {function} controller - ['getUserActivity']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
  "/activity/:id",
  validateRequest(userValidation.userIdParamSchema),
  userControllers.getUserActivity
);

export const userRoutes = router;