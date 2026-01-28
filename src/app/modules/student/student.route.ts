import { Router } from "express";
import { studentControllers } from "./student.controller";
import validateRequest from "../../middlewares/validateRequest";
import { studentValidation } from "./student.validation";
import AuthorizeRequest from "../../middlewares/auth";

const router = Router();

/**
 * @description create a new student profile
 * @param {string} path - /api/student/create-student
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(studentValidation.createStudentSchema)']
 * @param {function} controller - ['createStudent']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/create-student",
    AuthorizeRequest('ADMIN'),
    validateRequest(studentValidation.createStudentSchema),
    studentControllers.createStudent
);

/**
 * @description get student statistics
 * @param {string} path - /api/student/stats
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)']
 * @param {function} controller - ['getStudentStats']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method GET
 */
router.get(
    "/stats",
    AuthorizeRequest('ADMIN'),
    studentControllers.getStudentStats
);

/**
 * @description get a single student by ID
 * @param {string} path - /api/student/:id
 * @param {function} middleware - ['validateRequest(studentValidation.studentIdParamSchema)']
 * @param {function} controller - ['getSingleStudent']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/:id",
    validateRequest(studentValidation.studentIdParamSchema),
    studentControllers.getSingleStudent
);

/**
 * @description get a student by user ID
 * @param {string} path - /api/student/user/:userId
 * @param {function} middleware - ['validateRequest(studentValidation.userIdParamSchema)']
 * @param {function} controller - ['getStudentByUserId']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/user/:userId",
    validateRequest(studentValidation.userIdParamSchema),
    studentControllers.getStudentByUserId
);

/**
 * @description get all students with filtering
 * @param {string} path - /api/student/
 * @param {function} middleware - ['validateRequest(studentValidation.studentFiltersSchema)']
 * @param {function} controller - ['getAllStudents']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/",
    validateRequest(studentValidation.studentFiltersSchema),
    studentControllers.getAllStudents
);

/**
 * @description update a student
 * @param {string} path - /api/student/:id
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(studentValidation.studentIdParamSchema)', 'validateRequest(studentValidation.updateStudentSchema)']
 * @param {function} controller - ['updateStudent']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
    "/:id",
    AuthorizeRequest('ADMIN'),
    validateRequest(studentValidation.studentIdParamSchema),
    validateRequest(studentValidation.updateStudentSchema),
    studentControllers.updateStudent
);

/**
 * @description delete a student
 * @param {string} path - /api/student/:id
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(studentValidation.studentIdParamSchema)']
 * @param {function} controller - ['deleteStudent']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method DELETE
 */
router.delete(
    "/:id",
    AuthorizeRequest('ADMIN'),
    validateRequest(studentValidation.studentIdParamSchema),
    studentControllers.deleteStudent
);

/**
 * @description get student profile
 * @param {string} path - /api/student/profile/:id
 * @param {function} middleware - ['validateRequest(studentValidation.studentIdParamSchema)']
 * @param {function} controller - ['getStudentProfile']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/profile/:id",
    validateRequest(studentValidation.studentIdParamSchema),
    studentControllers.getStudentProfile
);

/**
 * @description get student attendance records
 * @param {string} path - /api/student/:id/attendance
 * @param {function} middleware - ['validateRequest(studentValidation.studentIdParamSchema)', 'validateRequest(studentValidation.attendanceViewSchema)']
 * @param {function} controller - ['getStudentAttendance']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/:id/attendance",
    validateRequest(studentValidation.studentIdParamSchema),
    validateRequest(studentValidation.attendanceViewSchema),
    studentControllers.getStudentAttendance
);

/**
 * @description get student attendance by user ID
 * @param {string} path - /api/student/user/:userId/attendance
 * @param {function} middleware - ['validateRequest(studentValidation.userIdParamSchema)', 'validateRequest(studentValidation.attendanceViewSchema)']
 * @param {function} controller - ['getStudentAttendanceByUserId']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/user/:userId/attendance",
    validateRequest(studentValidation.userIdParamSchema),
    validateRequest(studentValidation.attendanceViewSchema),
    studentControllers.getStudentAttendanceByUserId
);

/**
 * @description get student attendance summary
 * @param {string} path - /api/student/:id/attendance-summary
 * @param {function} middleware - ['validateRequest(studentValidation.studentIdParamSchema)']
 * @param {function} controller - ['getStudentAttendanceSummary']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/:id/attendance-summary",
    validateRequest(studentValidation.studentIdParamSchema),
    studentControllers.getStudentAttendanceSummary
);

/**
 * @description submit leave request
 * @param {string} path - /api/student/:id/leave-request
 * @param {function} middleware - ['validateRequest(studentValidation.studentIdParamSchema)', 'validateRequest(studentValidation.createLeaveRequestSchema)']
 * @param {function} controller - ['submitLeaveRequest']
 * @returns {object} - router
 * @access private
 * @method POST
 */
router.post(
    "/:id/leave-request",
    validateRequest(studentValidation.studentIdParamSchema),
    validateRequest(studentValidation.createLeaveRequestSchema),
    studentControllers.submitLeaveRequest
);

/**
 * @description update student profile
 * @param {string} path - /api/student/profile/:id
 * @param {function} middleware - ['validateRequest(studentValidation.studentIdParamSchema)', 'validateRequest(studentValidation.updateStudentProfileSchema)']
 * @param {function} controller - ['updateStudentProfile']
 * @returns {object} - router
 * @access private
 * @method PATCH
 */
router.patch(
    "/profile/:id",
    validateRequest(studentValidation.studentIdParamSchema),
    validateRequest(studentValidation.updateStudentProfileSchema),
    studentControllers.updateStudentProfile
);

/**
 * @description get student dashboard data
 * @param {string} path - /api/student/dashboard/:id
 * @param {function} middleware - ['validateRequest(studentValidation.studentIdParamSchema)']
 * @param {function} controller - ['getStudentDashboard']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/dashboard/:id",
    validateRequest(studentValidation.studentIdParamSchema),
    studentControllers.getStudentDashboard
);

/**
 * @description get student dashboard by user ID
 * @param {string} path - /api/student/user/:userId/dashboard
 * @param {function} middleware - ['validateRequest(studentValidation.userIdParamSchema)']
 * @param {function} controller - ['getStudentDashboardByUserId']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/user/:userId/dashboard",
    validateRequest(studentValidation.userIdParamSchema),
    studentControllers.getStudentDashboardByUserId
);

/**
 * @description get student profile by user ID
 * @param {string} path - /api/student/user/:userId/profile
 * @param {function} middleware - ['validateRequest(studentValidation.userIdParamSchema)']
 * @param {function} controller - ['getStudentProfileByUserId']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/user/:userId/profile",
    validateRequest(studentValidation.userIdParamSchema),
    studentControllers.getStudentProfileByUserId
);

export const studentRoutes = router;