/**
 * Assignment Module - Service Layer
 * 
 * Handles the business logic for assigning relationships between entities
 * INDUSTRY STANDARD: Core entities are created independently, relationships assigned later
 */

import prisma from '../../config/prisma';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import {
    IAssignTeacherToDepartment,
    IAssignStudentToBatch,
    IAssignStudentToDepartment,
    IAssignTeacherToCourse,
    IAssignCourseToDepartment,
    IAssignCourseToBatch,
    IAssignStudentToCourse,
    IAssignDepartmentHead,
    IAssignmentResponse
} from './assignment.interface';

// ==================== TEACHER ASSIGNMENTS ====================

/**
 * Assign teacher to department
 * Validates both entities exist before assignment
 */
export const assignTeacherToDepartment = async (
    data: IAssignTeacherToDepartment
): Promise<IAssignmentResponse> => {
    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({
        where: { id: data.teacherId },
        include: { user: true },
    });

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
    });

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update teacher with department
    const updatedTeacher = await prisma.teacher.update({
        where: { id: data.teacherId },
        data: { departmentId: data.departmentId },
        include: { user: true, department: true },
    });

    // Also update user's departmentId for consistency
    await prisma.user.update({
        where: { id: teacher.userId },
        data: { departmentId: data.departmentId },
    });

    return {
        success: true,
        message: 'Teacher assigned to department successfully',
        data: updatedTeacher,
    };
};

/**
 * Unassign teacher from department
 */
export const unassignTeacherFromDepartment = async (
    teacherId: string
): Promise<IAssignmentResponse> => {
    const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
    });

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    const updatedTeacher = await prisma.teacher.update({
        where: { id: teacherId },
        data: { departmentId: null },
        include: { user: true },
    });

    // Also update user's departmentId
    await prisma.user.update({
        where: { id: teacher.userId },
        data: { departmentId: null },
    });

    return {
        success: true,
        message: 'Teacher unassigned from department successfully',
        data: updatedTeacher,
    };
};

// ==================== STUDENT ASSIGNMENTS ====================

/**
 * Assign student to batch
 */
export const assignStudentToBatch = async (
    data: IAssignStudentToBatch
): Promise<IAssignmentResponse> => {
    // Validate student exists
    const student = await prisma.student.findUnique({
        where: { id: data.studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Validate batch exists
    const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
    });

    if (!batch) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
    }

    // Update student with batch
    const updatedStudent = await prisma.student.update({
        where: { id: data.studentId },
        data: { batchId: data.batchId },
        include: { user: true, batch: true, department: true },
    });

    return {
        success: true,
        message: 'Student assigned to batch successfully',
        data: updatedStudent,
    };
};

/**
 * Assign student to department
 */
export const assignStudentToDepartment = async (
    data: IAssignStudentToDepartment
): Promise<IAssignmentResponse> => {
    // Validate student exists
    const student = await prisma.student.findUnique({
        where: { id: data.studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
    });

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update student with department
    const updatedStudent = await prisma.student.update({
        where: { id: data.studentId },
        data: { departmentId: data.departmentId },
        include: { user: true, batch: true, department: true },
    });

    // Also update user's departmentId for consistency
    await prisma.user.update({
        where: { id: student.userId },
        data: { departmentId: data.departmentId },
    });

    return {
        success: true,
        message: 'Student assigned to department successfully',
        data: updatedStudent,
    };
};

// ==================== COURSE ASSIGNMENTS ====================

/**
 * Assign teacher to course
 */
export const assignTeacherToCourse = async (
    data: IAssignTeacherToCourse
): Promise<IAssignmentResponse> => {
    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({
        where: { id: data.teacherId },
        include: { user: true },
    });

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    // Validate course exists
    const course = await prisma.course.findUnique({
        where: { id: data.courseId },
    });

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Update course with teacher
    const updatedCourse = await prisma.course.update({
        where: { id: data.courseId },
        data: { teacherId: teacher.userId }, // Use userId for course.teacherId
        include: {
            teacher: true,
            teacherProfile: true,
            batch: true,
            department: true,
        },
    });

    return {
        success: true,
        message: 'Teacher assigned to course successfully',
        data: updatedCourse,
    };
};

/**
 * Assign course to department
 */
export const assignCourseToDepartment = async (
    data: IAssignCourseToDepartment
): Promise<IAssignmentResponse> => {
    // Validate course exists
    const course = await prisma.course.findUnique({
        where: { id: data.courseId },
    });

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
    });

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update course with department
    const updatedCourse = await prisma.course.update({
        where: { id: data.courseId },
        data: { departmentId: data.departmentId },
        include: {
            teacher: true,
            batch: true,
            department: true,
        },
    });

    return {
        success: true,
        message: 'Course assigned to department successfully',
        data: updatedCourse,
    };
};

/**
 * Assign course to batch
 */
export const assignCourseToBatch = async (
    data: IAssignCourseToBatch
): Promise<IAssignmentResponse> => {
    // Validate course exists
    const course = await prisma.course.findUnique({
        where: { id: data.courseId },
    });

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Validate batch exists
    const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
    });

    if (!batch) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
    }

    // Update course with batch
    const updatedCourse = await prisma.course.update({
        where: { id: data.courseId },
        data: { batchId: data.batchId },
        include: {
            teacher: true,
            batch: true,
            department: true,
        },
    });

    return {
        success: true,
        message: 'Course assigned to batch successfully',
        data: updatedCourse,
    };
};

/**
 * Assign student to course (enrollment)
 */
export const assignStudentToCourse = async (
    data: IAssignStudentToCourse
): Promise<IAssignmentResponse> => {
    // Validate student exists
    const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        include: { user: true },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Validate course exists
    const course = await prisma.course.findUnique({
        where: { id: data.courseId },
    });

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId: student.userId,
                courseId: data.courseId,
            },
        },
    });

    if (existingEnrollment) {
        throw new AppError(StatusCodes.CONFLICT, 'Student is already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
        data: {
            studentId: student.userId, // Use userId for enrollment
            courseId: data.courseId,
        },
        include: {
            student: true,
            course: true,
        },
    });

    return {
        success: true,
        message: 'Student enrolled in course successfully',
        data: enrollment,
    };
};

/**
 * Unenroll student from course
 */
export const unenrollStudentFromCourse = async (
    studentId: string,
    courseId: string
): Promise<IAssignmentResponse> => {
    // Validate student exists
    const student = await prisma.student.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Delete enrollment
    await prisma.courseEnrollment.delete({
        where: {
            studentId_courseId: {
                studentId: student.userId,
                courseId: courseId,
            },
        },
    });

    return {
        success: true,
        message: 'Student unenrolled from course successfully',
    };
};

// ==================== DEPARTMENT HEAD ASSIGNMENT ====================

/**
 * Assign department head
 */
export const assignDepartmentHead = async (
    data: IAssignDepartmentHead
): Promise<IAssignmentResponse> => {
    // Validate department exists
    const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
    });

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({
        where: { id: data.teacherId },
        include: { user: true },
    });

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    // Update department with head
    const updatedDepartment = await prisma.department.update({
        where: { id: data.departmentId },
        data: { headId: teacher.userId }, // Use userId for headId
    });

    return {
        success: true,
        message: 'Department head assigned successfully',
        data: updatedDepartment,
    };
};

// Export all services
export const AssignmentService = {
    assignTeacherToDepartment,
    unassignTeacherFromDepartment,
    assignStudentToBatch,
    assignStudentToDepartment,
    assignTeacherToCourse,
    assignCourseToDepartment,
    assignCourseToBatch,
    assignStudentToCourse,
    unenrollStudentFromCourse,
    assignDepartmentHead,
};
