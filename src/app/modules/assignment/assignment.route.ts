/**
 * Assignment Module - Routes
 * 
 * Defines API endpoints for assignment operations
 * INDUSTRY STANDARD: Separate assignment APIs to decouple relationships from entity creation
 */

import express from 'express';
import { AssignmentController } from './assignment.controller';
import { AssignmentValidation } from './assignment.validation';
import validateRequest from '../../middlewares/validateRequest';
import AuthorizeRequest from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

// ==================== TEACHER ASSIGNMENT ROUTES ====================

/**
 * @route   POST /api/v1/assignments/teacher-to-department
 * @desc    Assign teacher to department
 * @access  Admin
 */
router.post(
    '/teacher-to-department',
    AuthorizeRequest(UserRole.ADMIN),
    validateRequest(AssignmentValidation.assignTeacherToDepartment),
    AssignmentController.assignTeacherToDepartment
);

/**
 * @route   DELETE /api/v1/assignments/teacher-from-department/:teacherId
 * @desc    Unassign teacher from department
 * @access  Admin
 */
router.delete(
    '/teacher-from-department/:teacherId',
    AuthorizeRequest(UserRole.ADMIN),
    AssignmentController.unassignTeacherFromDepartment
);

// ==================== STUDENT ASSIGNMENT ROUTES ====================

/**
 * @route   POST /api/v1/assignments/student-to-batch
 * @desc    Assign student to batch
 * @access  Admin
 */
router.post(
    '/student-to-batch',
    AuthorizeRequest(UserRole.ADMIN),
    validateRequest(AssignmentValidation.assignStudentToBatch),
    AssignmentController.assignStudentToBatch
);

/**
 * @route   POST /api/v1/assignments/student-to-department
 * @desc    Assign student to department
 * @access  Admin
 */
router.post(
    '/student-to-department',
    AuthorizeRequest(UserRole.ADMIN),
    validateRequest(AssignmentValidation.assignStudentToDepartment),
    AssignmentController.assignStudentToDepartment
);

// ==================== COURSE ASSIGNMENT ROUTES ====================

/**
 * @route   POST /api/v1/assignments/teacher-to-course
 * @desc    Assign teacher to course
 * @access  Admin
 */
router.post(
    '/teacher-to-course',
    AuthorizeRequest(UserRole.ADMIN),
    validateRequest(AssignmentValidation.assignTeacherToCourse),
    AssignmentController.assignTeacherToCourse
);

/**
 * @route   POST /api/v1/assignments/course-to-department
 * @desc    Assign course to department
 * @access  Admin
 */
router.post(
    '/course-to-department',
    AuthorizeRequest(UserRole.ADMIN),
    validateRequest(AssignmentValidation.assignCourseToDepartment),
    AssignmentController.assignCourseToDepartment
);

/**
 * @route   POST /api/v1/assignments/course-to-batch
 * @desc    Assign course to batch
 * @access  Admin
 */
router.post(
    '/course-to-batch',
    AuthorizeRequest(UserRole.ADMIN),
    validateRequest(AssignmentValidation.assignCourseToBatch),
    AssignmentController.assignCourseToBatch
);

/**
 * @route   POST /api/v1/assignments/student-to-course
 * @desc    Enroll student in course
 * @access  Admin, Teacher
 */
router.post(
    '/student-to-course',
    AuthorizeRequest(UserRole.ADMIN, UserRole.TEACHER),
    validateRequest(AssignmentValidation.assignStudentToCourse),
    AssignmentController.assignStudentToCourse
);

/**
 * @route   DELETE /api/v1/assignments/student-from-course/:studentId/:courseId
 * @desc    Unenroll student from course
 * @access  Admin, Teacher
 */
router.delete(
    '/student-from-course/:studentId/:courseId',
    AuthorizeRequest(UserRole.ADMIN, UserRole.TEACHER),
    AssignmentController.unenrollStudentFromCourse
);

// ==================== DEPARTMENT HEAD ASSIGNMENT ====================

/**
 * @route   POST /api/v1/assignments/department-head
 * @desc    Assign department head
 * @access  Admin
 */
router.post(
    '/department-head',
    AuthorizeRequest(UserRole.ADMIN),
    validateRequest(AssignmentValidation.assignDepartmentHead),
    AssignmentController.assignDepartmentHead
);

export const AssignmentRoutes = router;
