import { Router } from "express";
import { attendanceControllers } from "./attendance.controller";
import { AttendanceSessionController } from "./attendanceSession.controller";
import validateRequest from "../../middlewares/validateRequest";
import { attendanceValidation } from "./attendance.validation";
import { AuthMiddleware } from "../auth/auth.middleware";

const router = Router();

// All attendance routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @description get attendance dashboard data
 * @param {string} path - /api/attendance/dashboard
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN, ADMIN)']
 * @param {function} controller - ['getAttendanceDashboard']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN', 'ADMIN']
 * @method GET
 */
router.get(
    "/dashboard",
AuthMiddleware.authorize('TEACHER', 'ADMIN'),
    attendanceControllers.getAttendanceDashboard
);

/**
 * @description bulk mark attendance for multiple students
 * @param {string} path - /api/attendance/bulk-mark
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN, ADMIN)', 'validateRequest(attendanceValidation.bulkAttendanceSchema)']
 * @param {function} controller - ['bulkMarkAttendance']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN', 'ADMIN']
 * @method POST
 */
router.post(
    "/bulk-mark",
AuthMiddleware.authorize('TEACHER', 'ADMIN'),
    validateRequest(attendanceValidation.bulkAttendanceSchema),
    attendanceControllers.bulkMarkAttendance
);

/**
 * @description create attendance session
 * @param {string} path - /api/attendance/session
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN, ADMIN)', 'validateRequest(attendanceValidation.createAttendanceSessionSchema)']
 * @param {function} controller - ['createAttendanceSession']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN', 'ADMIN']
 * @method POST
 */
router.post(
    "/session",
AuthMiddleware.authorize('TEACHER', 'ADMIN'),
    validateRequest(attendanceValidation.createAttendanceSessionSchema),
    attendanceControllers.createAttendanceSession
);

// New session management routes for HTTP-based attendance flow
// POST /api/v1/attendance/sessions - Create attendance session
router.post(
    "/sessions",
AuthMiddleware.authorize('TEACHER', 'ADMIN'),
    validateRequest(attendanceValidation.createAttendanceSessionSchema),
    AttendanceSessionController.createAttendanceSession
);

// GET /api/v1/attendance/sessions/active - Get active session
router.get(
    "/sessions/active",
    AttendanceSessionController.getActiveSession
);

// GET /api/v1/attendance/sessions - Get attendance sessions with filters
router.get(
    "/sessions",
    validateRequest(attendanceValidation.sessionFiltersSchema),
    AttendanceSessionController.getAttendanceSessions
);

/**
 * @description get attendance summary for a course
 * @param {string} path - /api/attendance/course/:id/summary
 * @param {function} middleware - ['validateRequest(attendanceValidation.idParamSchema)']
 * @param {function} controller - ['getCourseAttendanceSummary']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/course/:id/summary",
    validateRequest(attendanceValidation.idParamSchema),
    attendanceControllers.getCourseAttendanceSummary
);

/**
 * @description get attendance summary for a student
 * @param {string} path - /api/attendance/student/:userId/summary
 * @param {function} middleware - ['validateRequest(attendanceValidation.idParamSchema)']
 * @param {function} controller - ['getStudentAttendanceSummary']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/student/:userId/summary",
    validateRequest(attendanceValidation.idParamSchema),
    attendanceControllers.getStudentAttendanceSummary
);

/**
 * @description record attendance for a student
 * @param {string} path - /api/attendance
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN, ADMIN)', 'validateRequest(attendanceValidation.createAttendanceSchema)']
 * @param {function} controller - ['recordAttendance']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN', 'ADMIN']
 * @method POST
 */
router.post(
    "/",
AuthMiddleware.authorize('TEACHER', 'ADMIN'),
    validateRequest(attendanceValidation.createAttendanceSchema),
    attendanceControllers.recordAttendance
);

/**
 * @description get attendance records with filters
 * @param {string} path - /api/attendance
 * @param {function} middleware - ['validateRequest(attendanceValidation.attendanceFiltersSchema)']
 * @param {function} controller - ['getAttendances']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/",
    validateRequest(attendanceValidation.attendanceFiltersSchema),
    attendanceControllers.getAttendances
);

/**
 * @description update attendance record
 * @param {string} path - /api/attendance/:id
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN, ADMIN)', 'validateRequest(attendanceValidation.idParamSchema)', 'validateRequest(attendanceValidation.updateAttendanceSchema)']
 * @param {function} controller - ['updateAttendance']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN', 'ADMIN']
 * @method PATCH
 */
router.patch(
    "/:id",
AuthMiddleware.authorize('TEACHER', 'ADMIN'),
    validateRequest(attendanceValidation.idParamSchema),
    validateRequest(attendanceValidation.updateAttendanceSchema),
    attendanceControllers.updateAttendance
);

/**
 * @description get attendance by ID
 * @param {string} path - /api/attendance/:id
 * @param {function} middleware - ['validateRequest(attendanceValidation.idParamSchema)']
 * @param {function} controller - ['getAttendanceById']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/:id",
    validateRequest(attendanceValidation.idParamSchema),
    attendanceControllers.getAttendanceById
);

// GET /api/v1/attendance/sessions/:sessionId/stats - Get session statistics for polling
router.get(
    "/sessions/:sessionId/stats",
    validateRequest(attendanceValidation.idParamSchema),
    AttendanceSessionController.getSessionStats
);

// POST /api/v1/attendance/sessions/:id/end - End attendance session
router.post(
    "/sessions/:id/end",
    validateRequest(attendanceValidation.idParamSchema),
    AttendanceSessionController.endSession
);

// GET /api/v1/attendance/sessions/:id - Get attendance session by ID
router.get(
    "/sessions/:id",
    validateRequest(attendanceValidation.idParamSchema),
    AttendanceSessionController.getAttendanceSessionById
);

export const attendanceRoutes = router;
