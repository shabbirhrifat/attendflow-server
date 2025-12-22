/**
 * Assignment Module - Validation Schemas
 * 
 * Validates assignment operations between entities
 */

import { z } from 'zod';

// Assign teacher to department
export const assignTeacherToDepartmentSchema = z.object({
    body: z.object({
        teacherId: z.string().cuid('Invalid teacher ID'),
        departmentId: z.string().cuid('Invalid department ID'),
    }),
});

// Assign student to batch
export const assignStudentToBatchSchema = z.object({
    body: z.object({
        studentId: z.string().cuid('Invalid student ID'),
        batchId: z.string().cuid('Invalid batch ID'),
    }),
});

// Assign student to department
export const assignStudentToDepartmentSchema = z.object({
    body: z.object({
        studentId: z.string().cuid('Invalid student ID'),
        departmentId: z.string().cuid('Invalid department ID'),
    }),
});

// Assign teacher to course
export const assignTeacherToCourseSchema = z.object({
    body: z.object({
        teacherId: z.string().cuid('Invalid teacher ID'),
        courseId: z.string().cuid('Invalid course ID'),
    }),
});

// Assign course to department
export const assignCourseToDepartmentSchema = z.object({
    body: z.object({
        courseId: z.string().cuid('Invalid course ID'),
        departmentId: z.string().cuid('Invalid department ID'),
    }),
});

// Assign course to batch
export const assignCourseToBatchSchema = z.object({
    body: z.object({
        courseId: z.string().cuid('Invalid course ID'),
        batchId: z.string().cuid('Invalid batch ID'),
    }),
});

// Assign student to course (enrollment)
export const assignStudentToCourseSchema = z.object({
    body: z.object({
        studentId: z.string().cuid('Invalid student ID'),
        courseId: z.string().cuid('Invalid course ID'),
    }),
});

// Assign department head
export const assignDepartmentHeadSchema = z.object({
    body: z.object({
        departmentId: z.string().cuid('Invalid department ID'),
        teacherId: z.string().cuid('Invalid teacher ID'),
    }),
});

// Export all validations
export const AssignmentValidation = {
    assignTeacherToDepartment: assignTeacherToDepartmentSchema,
    assignStudentToBatch: assignStudentToBatchSchema,
    assignStudentToDepartment: assignStudentToDepartmentSchema,
    assignTeacherToCourse: assignTeacherToCourseSchema,
    assignCourseToDepartment: assignCourseToDepartmentSchema,
    assignCourseToBatch: assignCourseToBatchSchema,
    assignStudentToCourse: assignStudentToCourseSchema,
    assignDepartmentHead: assignDepartmentHeadSchema,
};
