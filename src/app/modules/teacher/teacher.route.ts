import { Router } from 'express';
import { TeacherController } from './teacher.controller';
import { TeacherValidation } from './teacher.validation';
import validateRequest from '../../middlewares/validateRequest';
import AuthorizeRequest from '../../middlewares/auth';

const router = Router();

/**
 * @description create a new teacher profile
 * @param {string} path - /api/teacher/
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.createTeacher)']
 * @param {function} controller - ['createTeacherProfile']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method POST
 */
router.post(
    '/',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.createTeacher),
    TeacherController.createTeacherProfile
);

/**
 * @description get teacher profile
 * @param {string} path - /api/teacher/:teacherId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['getTeacherProfile']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.getTeacherProfile
);

/**
 * @description update teacher profile
 * @param {string} path - /api/teacher/:teacherId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.updateTeacher)']
 * @param {function} controller - ['updateTeacherProfile']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method PUT
 */
router.put(
    '/:teacherId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.updateTeacher),
    TeacherController.updateTeacherProfile
);

/**
 * @description delete teacher profile
 * @param {string} path - /api/teacher/:teacherId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['deleteTeacherProfile']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method DELETE
 */
router.delete(
    '/:teacherId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.deleteTeacherProfile
);

/**
 * @description get all teachers with filtering
 * @param {string} path - /api/teacher/
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherFilters)']
 * @param {function} controller - ['getAllTeachers']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherFilters),
    TeacherController.getAllTeachers
);

/**
 * @description get teacher statistics
 * @param {string} path - /api/teacher/stats
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)']
 * @param {function} controller - ['getTeacherStats']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/stats',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    TeacherController.getTeacherStats
);

/**
 * @description mark attendance for a student
 * @param {string} path - /api/teacher/:teacherId/attendance/mark
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.markAttendance)']
 * @param {function} controller - ['markAttendance']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method POST
 */
router.post(
    '/:teacherId/attendance/mark',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.markAttendance),
    TeacherController.markAttendance
);

/**
 * @description bulk mark attendance
 * @param {string} path - /api/teacher/:teacherId/attendance/bulk
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.bulkMarkAttendance)']
 * @param {function} controller - ['bulkMarkAttendance']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method POST
 */
router.post(
    '/:teacherId/attendance/bulk',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.bulkMarkAttendance),
    TeacherController.bulkMarkAttendance
);

/**
 * @description get attendance for a course
 * @param {string} path - /api/teacher/:teacherId/courses/:courseId/attendance
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.courseIdParam)']
 * @param {function} controller - ['getCourseAttendance']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId/courses/:courseId/attendance',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.courseIdParam),
    TeacherController.getCourseAttendance
);

/**
 * @description get course attendance summary
 * @param {string} path - /api/teacher/:teacherId/courses/:courseId/attendance/summary
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.courseIdParam)']
 * @param {function} controller - ['getCourseAttendanceSummary']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId/courses/:courseId/attendance/summary',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.courseIdParam),
    TeacherController.getCourseAttendanceSummary
);

/**
 * @description get pending leave requests for teacher
 * @param {string} path - /api/teacher/:teacherId/leaves/pending
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['getPendingLeaveRequests']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId/leaves/pending',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.getPendingLeaveRequests
);

/**
 * @description approve/reject leave request
 * @param {string} path - /api/teacher/:teacherId/leaves/:leaveId/approve
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.leaveIdParam)', 'validateRequest(TeacherValidation.leaveApproval)']
 * @param {function} controller - ['processLeaveRequest']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method PUT
 */
router.put(
    '/:teacherId/leaves/:leaveId/approve',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.leaveIdParam),
    validateRequest(TeacherValidation.leaveApproval),
    TeacherController.processLeaveRequest
);

/**
 * @description get processed leave requests
 * @param {string} path - /api/teacher/:teacherId/leaves/processed
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['getProcessedLeaves']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId/leaves/processed',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.getProcessedLeaves
);

/**
 * @description create class schedule
 * @param {string} path - /api/teacher/:teacherId/schedules
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.createClassSchedule)']
 * @param {function} controller - ['createClassSchedule']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method POST
 */
router.post(
    '/:teacherId/schedules',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.createClassSchedule),
    TeacherController.createClassSchedule
);

/**
 * @description get teacher schedules
 * @param {string} path - /api/teacher/:teacherId/schedules
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['getTeacherSchedules']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId/schedules',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.getTeacherSchedules
);

/**
 * @description get today's schedule for teacher
 * @param {string} path - /api/teacher/:teacherId/schedules/today
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['getTodaySchedule']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId/schedules/today',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.getTodaySchedule
);

/**
 * @description update class schedule
 * @param {string} path - /api/teacher/:teacherId/schedules/:scheduleId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.scheduleIdParam)', 'validateRequest(TeacherValidation.createClassSchedule)']
 * @param {function} controller - ['updateClassSchedule']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method PUT
 */
router.put(
    '/:teacherId/schedules/:scheduleId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.scheduleIdParam),
    validateRequest(TeacherValidation.createClassSchedule),
    TeacherController.updateClassSchedule
);

/**
 * @description delete class schedule
 * @param {string} path - /api/teacher/:teacherId/schedules/:scheduleId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.scheduleIdParam)']
 * @param {function} controller - ['deleteClassSchedule']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method DELETE
 */
router.delete(
    '/:teacherId/schedules/:scheduleId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.scheduleIdParam),
    TeacherController.deleteClassSchedule
);

/**
 * @description create a new subject
 * @param {string} path - /api/teacher/subjects
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.createSubject)']
 * @param {function} controller - ['createSubject']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method POST
 */
router.post(
    '/subjects',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.createSubject),
    TeacherController.createSubject
);

/**
 * @description get all subjects with filtering
 * @param {string} path - /api/teacher/subjects
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)']
 * @param {function} controller - ['getAllSubjects']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/subjects',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    TeacherController.getAllSubjects
);

/**
 * @description get subject by ID
 * @param {string} path - /api/teacher/subjects/:subjectId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.subjectIdParam)']
 * @param {function} controller - ['getSubjectById']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/subjects/:subjectId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.subjectIdParam),
    TeacherController.getSubjectById
);

/**
 * @description update subject
 * @param {string} path - /api/teacher/subjects/:subjectId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.subjectIdParam)', 'validateRequest(TeacherValidation.updateSubject)']
 * @param {function} controller - ['updateSubject']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method PUT
 */
router.put(
    '/subjects/:subjectId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.subjectIdParam),
    validateRequest(TeacherValidation.updateSubject),
    TeacherController.updateSubject
);

/**
 * @description delete subject
 * @param {string} path - /api/teacher/subjects/:subjectId
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.subjectIdParam)']
 * @param {function} controller - ['deleteSubject']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method DELETE
 */
router.delete(
    '/subjects/:subjectId',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.subjectIdParam),
    TeacherController.deleteSubject
);

/**
 * @description get teacher dashboard data
 * @param {string} path - /api/teacher/:teacherId/dashboard
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['getTeacherDashboard']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/:teacherId/dashboard',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.getTeacherDashboard
);

/**
 * @description get teacher profile by user ID
 * @param {string} path - /api/teacher/user/:userId/profile
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(TeacherValidation.userIdParam)']
 * @param {function} controller - ['getTeacherProfileByUserId']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/user/:userId/profile',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(TeacherValidation.userIdParam),
    TeacherController.getTeacherProfileByUserId
);

/**
 * @description assign teacher to department
 * @param {string} path - /api/teacher/:teacherId/assign-department
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)', 'validateRequest(TeacherValidation.teacherDepartmentAssignment)']
 * @param {function} controller - ['assignTeacherToDepartment']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    '/:teacherId/assign-department',
    AuthorizeRequest('ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    validateRequest(TeacherValidation.teacherDepartmentAssignment),
    TeacherController.assignTeacherToDepartment
);

/**
 * @description remove teacher from department
 * @param {string} path - /api/teacher/:teacherId/remove-department
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(TeacherValidation.teacherIdParam)']
 * @param {function} controller - ['removeTeacherFromDepartment']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    '/:teacherId/remove-department',
    AuthorizeRequest('ADMIN'),
    validateRequest(TeacherValidation.teacherIdParam),
    TeacherController.removeTeacherFromDepartment
);

/**
 * @description bulk assign teachers to department
 * @param {string} path - /api/teacher/bulk-assign-department
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(TeacherValidation.bulkTeacherAssignment)']
 * @param {function} controller - ['bulkAssignTeachersToDepartment']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    '/bulk-assign-department',
    AuthorizeRequest('ADMIN'),
    validateRequest(TeacherValidation.bulkTeacherAssignment),
    TeacherController.bulkAssignTeachersToDepartment
);

/**
 * @description get unassigned teachers (teachers without department)
 * @param {string} path - /api/teacher/unassigned
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)']
 * @param {function} controller - ['getUnassignedTeachers']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method GET
 */
router.get(
    '/unassigned',
    AuthorizeRequest('ADMIN'),
    TeacherController.getUnassignedTeachers
);

export default router;
