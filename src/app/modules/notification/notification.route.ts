import { Router } from "express";
import { notificationControllers } from "./notification.controller";
import validateRequest from "../../middlewares/validateRequest";
import { notificationValidations } from "./notification.validation";
import { AuthMiddleware } from "../auth/auth.middleware";

const router = Router();

// All notification routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @description send notification to a single user
 * @param {string} path - /api/notification/send
 * @param {function} middleware - ['authenticate', 'authorize(ADMIN)', 'validateRequest(notificationValidations.sendNotification)']
 * @param {function} controller - ['sendNotification']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/send",
    AuthMiddleware.isAdmin,
    validateRequest(notificationValidations.sendNotification),
    notificationControllers.sendNotification
);

/**
 * @description send email notification
 * @param {string} path - /api/notification/send-email
 * @param {function} middleware - ['authenticate', 'authorize(ADMIN)', 'validateRequest(notificationValidations.emailNotification)']
 * @param {function} controller - ['sendEmailNotification']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/send-email",
    AuthMiddleware.isAdmin,
    validateRequest(notificationValidations.emailNotification),
    notificationControllers.sendEmailNotification
);

/**
 * @description send bulk notifications
 * @param {string} path - /api/notification/send-bulk
 * @param {function} middleware - ['authenticate', 'authorize(ADMIN)', 'validateRequest(notificationValidations.bulkNotification)']
 * @param {function} controller - ['sendBulkNotifications']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/send-bulk",
    AuthMiddleware.isAdmin,
    validateRequest(notificationValidations.bulkNotification),
    notificationControllers.sendBulkNotifications
);

/**
 * @description broadcast notification by role
 * @param {string} path - /api/notification/broadcast
 * @param {function} middleware - ['authenticate', 'authorize(ADMIN)', 'validateRequest(notificationValidations.broadcastNotification)']
 * @param {function} controller - ['broadcastNotification']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/broadcast",
    AuthMiddleware.isAdmin,
    validateRequest(notificationValidations.broadcastNotification),
    notificationControllers.broadcastNotification
);

/**
 * @description get notification statistics
 * @param {string} path - /api/notification/stats
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.getNotificationStats)']
 * @param {function} controller - ['getNotificationStats']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/stats",
    validateRequest(notificationValidations.getNotificationStats),
    notificationControllers.getNotificationStats
);

/**
 * @description mark all notifications as read for a user
 * @param {string} path - /api/notification/mark-all-read/:recipientId
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.recipientIdParam)']
 * @param {function} controller - ['markAllNotificationsAsRead']
 * @returns {object} - router
 * @access private
 * @method PATCH
 */
router.patch(
    "/mark-all-read/:recipientId",
    validateRequest(notificationValidations.recipientIdParam),
    notificationControllers.markAllNotificationsAsRead
);

/**
 * @description delete all read notifications for a user
 * @param {string} path - /api/notification/delete-all-read/:recipientId
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.recipientIdParam)']
 * @param {function} controller - ['deleteAllReadNotifications']
 * @returns {object} - router
 * @access private
 * @method DELETE
 */
router.delete(
    "/delete-all-read/:recipientId",
    validateRequest(notificationValidations.recipientIdParam),
    notificationControllers.deleteAllReadNotifications
);

/**
 * @description get all notifications
 * @param {string} path - /api/notification/
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.getNotifications)']
 * @param {function} controller - ['getAllNotifications']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/",
    validateRequest(notificationValidations.getNotifications),
    notificationControllers.getAllNotifications
);

/**
 * @description get a single notification by ID
 * @param {string} path - /api/notification/:id
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.getSingleNotification)']
 * @param {function} controller - ['getSingleNotification']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/:id",
    validateRequest(notificationValidations.getSingleNotification),
    notificationControllers.getSingleNotification
);

/**
 * @description update a notification
 * @param {string} path - /api/notification/:id
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.updateNotification)']
 * @param {function} controller - ['updateNotification']
 * @returns {object} - router
 * @access private
 * @method PATCH
 */
router.patch(
    "/:id",
    validateRequest(notificationValidations.updateNotification),
    notificationControllers.updateNotification
);

/**
 * @description mark notification as read/unread
 * @param {string} path - /api/notification/:id/read
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.markNotification)']
 * @param {function} controller - ['markNotificationAsRead']
 * @returns {object} - router
 * @access private
 * @method PATCH
 */
router.patch(
    "/:id/read",
    validateRequest(notificationValidations.markNotification),
    notificationControllers.markNotificationAsRead
);

/**
 * @description delete a notification
 * @param {string} path - /api/notification/:id
 * @param {function} middleware - ['authenticate', 'validateRequest(notificationValidations.getSingleNotification)']
 * @param {function} controller - ['deleteNotification']
 * @returns {object} - router
 * @access private
 * @method DELETE
 */
router.delete(
    "/:id",
    validateRequest(notificationValidations.getSingleNotification),
    notificationControllers.deleteNotification
);

/**
 * @description resend failed email notification
 * @param {string} path - /api/notification/:id/resend-email
 * @param {function} middleware - ['authenticate', 'authorize(ADMIN)', 'validateRequest(notificationValidations.getSingleNotification)']
 * @param {function} controller - ['resendFailedEmail']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/:id/resend-email",
    AuthMiddleware.isAdmin,
    validateRequest(notificationValidations.getSingleNotification),
    notificationControllers.resendFailedEmail
);

export const notificationRoutes = router;