/**
 * Assignment Module - Service Layer
 *
 * Handles the business logic for assigning relationships between entities
 * INDUSTRY STANDARD: Core entities are created independently, relationships assigned later
 */

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
import { TeacherModel } from '../teacher/teacher.model';
import { StudentModel } from '../student/student.model';
import { DepartmentModel, BatchModel } from '../organization/organization.model';
import { CourseModel, CourseEnrollmentModel } from '../course/course.model';
import UserModel from '../user/user.model';

// ==================== TEACHER ASSIGNMENTS ====================

/**
 * Assign teacher to department
 * Validates both entities exist before assignment
 */
export const assignTeacherToDepartment = async (
    data: IAssignTeacherToDepartment
): Promise<IAssignmentResponse> => {
    // Validate teacher exists
    const teacher = await TeacherModel.model.findById(data.teacherId);

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    // Validate department exists
    const department = await DepartmentModel.model.findById(data.departmentId);

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update teacher with department
    const updatedTeacher = await TeacherModel.model.findByIdAndUpdate(
        data.teacherId,
        { departmentId: data.departmentId },
        { new: true }
    );

    if (!updatedTeacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update teacher');
    }

    // Also update user's departmentId for consistency
    const teacherObj = teacher.toObject ? teacher.toObject() : teacher;
    await UserModel.model.findByIdAndUpdate(
        teacherObj.userId,
        { departmentId: data.departmentId }
    );

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
    const teacher = await TeacherModel.findById(teacherId);

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    const updatedTeacher = await TeacherModel.model.findByIdAndUpdate(
        teacherId,
        { departmentId: null },
        { new: true }
    );

    if (!updatedTeacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update teacher');
    }

    // Also update user's departmentId
    const teacherObj = teacher.toObject ? teacher.toObject() : teacher;
    await UserModel.model.findByIdAndUpdate(
        teacherObj.userId,
        { departmentId: null }
    );

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
    const student = await StudentModel.findById(data.studentId);

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Validate batch exists
    const batch = await BatchModel.model.findById(data.batchId);

    if (!batch) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
    }

    // Update student with batch
    const updatedStudent = await StudentModel.model.findByIdAndUpdate(
        data.studentId,
        { batchId: data.batchId },
        { new: true }
    );

    if (!updatedStudent) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update student');
    }

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
    const student = await StudentModel.findById(data.studentId);

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Validate department exists
    const department = await DepartmentModel.model.findById(data.departmentId);

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update student with department
    const updatedStudent = await StudentModel.model.findByIdAndUpdate(
        data.studentId,
        { departmentId: data.departmentId },
        { new: true }
    );

    if (!updatedStudent) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update student');
    }

    // Also update user's departmentId for consistency
    const studentObj = student.toObject ? student.toObject() : student;
    await UserModel.model.findByIdAndUpdate(
        studentObj.userId,
        { departmentId: data.departmentId }
    );

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
    const teacher = await TeacherModel.model.findById(data.teacherId);

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    // Validate course exists
    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Update course with teacher (using userId)
    const teacherObj = teacher.toObject ? teacher.toObject() : teacher;
    const updatedCourse = await CourseModel.model.findByIdAndUpdate(
        data.courseId,
        { teacherId: teacherObj.userId },
        { new: true }
    );

    if (!updatedCourse) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update course');
    }

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
    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Validate department exists
    const department = await DepartmentModel.model.findById(data.departmentId);

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update course with department
    const updatedCourse = await CourseModel.model.findByIdAndUpdate(
        data.courseId,
        { departmentId: data.departmentId },
        { new: true }
    );

    if (!updatedCourse) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update course');
    }

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
    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Validate batch exists
    const batch = await BatchModel.model.findById(data.batchId);

    if (!batch) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
    }

    // Update course with batch
    const updatedCourse = await CourseModel.model.findByIdAndUpdate(
        data.courseId,
        { batchId: data.batchId },
        { new: true }
    );

    if (!updatedCourse) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update course');
    }

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
    const student = await StudentModel.model.findById(data.studentId);

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Validate course exists
    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Check if enrollment already exists
    const studentObj = student.toObject ? student.toObject() : student;
    const existingEnrollment = await CourseEnrollmentModel.model.findOne({
        studentId: studentObj.userId,
        courseId: data.courseId,
    });

    if (existingEnrollment) {
        throw new AppError(StatusCodes.CONFLICT, 'Student is already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await CourseEnrollmentModel.create({
        studentId: studentObj.userId,
        courseId: data.courseId,
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
    const student = await StudentModel.model.findById(studentId);

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Delete enrollment
    const studentObj = student.toObject ? student.toObject() : student;
    await CourseEnrollmentModel.model.deleteOne({
        studentId: studentObj.userId,
        courseId: courseId,
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
    const department = await DepartmentModel.model.findById(data.departmentId);

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Validate teacher exists
    const teacher = await TeacherModel.model.findById(data.teacherId);

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    // Update department with head (using userId)
    const teacherObj = teacher.toObject ? teacher.toObject() : teacher;
    const updatedDepartment = await DepartmentModel.model.findByIdAndUpdate(
        data.departmentId,
        { headId: teacherObj.userId },
        { new: true }
    );

    if (!updatedDepartment) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Failed to update department');
    }

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
