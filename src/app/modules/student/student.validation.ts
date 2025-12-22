import { z } from "zod";

/** Validation schema for creating Student profile */
// INDUSTRY STANDARD: Only include fields that are actually provided during creation
// Auto-generated fields (studentId) and optional relationships should NOT be required
const createStudentSchema = z.object({
    body: z.object({
        userId: z.string().min(1, 'User ID is required').optional(),
        name: z.string().min(2, 'Name is required and must be at least 2 characters'),
        email: z.string().email('Invalid email format').min(1, 'Email is required'), // REQUIRED for all students
        password: z.string().min(8, 'Password must be at least 8 characters').optional(), // Optional, will use default if not provided
        batchId: z.string().min(1, 'Batch ID is optional').optional(), // Can be assigned later
        departmentId: z.string().min(1, 'Department ID is optional').optional(), // Can be assigned later
        semester: z.number().int().min(1).max(10).optional().default(1),
        gpa: z.number().min(0).max(4).optional().default(0.0),
        credits: z.number().int().min(0).optional().default(0),
        // NOTE: studentId is AUTO-GENERATED and should NOT be in create form
    }),
});

/** Validation schema for updating Student profile */
const updateStudentSchema = z.object({
    body: z.object({
        studentId: z.string().min(1, 'Student ID is required').optional(),
        batchId: z.string().min(1, 'Batch ID is required').optional(),
        departmentId: z.string().min(1, 'Department ID is required').optional(),
        semester: z.number().int().min(1).max(10).optional(),
        gpa: z.number().min(0).max(4).optional(),
        credits: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
    }),
});

/** Validation schema for student ID in params */
const studentIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Student ID is required'),
    }),
});

/** Validation schema for student filters in query */
const studentFiltersSchema = z.object({
    query: z.object({
        batchId: z.string().optional(),
        departmentId: z.string().optional(),
        semester: z.string().regex(/^\d+$/, 'Semester must be a number').optional(),
        isActive: z.string().regex(/^(true|false)$/, 'isActive must be true or false').optional(),
        status: z.enum(['all', 'active', 'inactive']).optional(),
        search: z.string().optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

/** Validation schema for creating Batch */
const createBatchSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Batch name is required'),
        year: z.number().int().min(2000).max(2100),
        description: z.string().optional(),
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format'),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format'),
        isActive: z.boolean().optional().default(true),
    }),
});

/** Validation schema for updating Batch */
const updateBatchSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Batch name is required').optional(),
        year: z.number().int().min(2000).max(2100).optional(),
        description: z.string().optional(),
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format').optional(),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format').optional(),
        isActive: z.boolean().optional(),
    }),
});

/** Validation schema for creating Department */
const createDepartmentSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Department name is required'),
        code: z.string().min(2).max(10),
        description: z.string().optional(),
        headId: z.string().optional(),
        isActive: z.boolean().optional().default(true),
    }),
});

/** Validation schema for updating Department */
const updateDepartmentSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Department name is required').optional(),
        code: z.string().min(2).max(10).optional(),
        description: z.string().optional(),
        headId: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
});

/** Validation schema for student leave request */
const createLeaveRequestSchema = z.object({
    body: z.object({
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format'),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format'),
        reason: z.string().min(5, 'Reason must be at least 5 characters'),
    }),
});

/** Validation schema for updating student profile */
const updateStudentProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').optional(),
        username: z.string().min(3, 'Username must be at least 3 characters').optional(),
        avatar: z.string().url('Invalid avatar URL').optional(),
        phone: z.string().regex(/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
        address: z.string().optional(),
        dateOfBirth: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid date format').optional(),
    }),
});

/** Validation schema for attendance view */
const attendanceViewSchema = z.object({
    query: z.object({
        courseId: z.string().optional(),
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format').optional(),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format').optional(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    }),
});

/** Validation schema for user ID in params */
const userIdParamSchema = z.object({
    params: z.object({
        userId: z.string().min(1, 'User ID is required'),
    }),
});

export const studentValidation = {
    createStudentSchema,
    updateStudentSchema,
    studentIdParamSchema,
    userIdParamSchema,
    studentFiltersSchema,
    createBatchSchema,
    updateBatchSchema,
    createDepartmentSchema,
    updateDepartmentSchema,
    createLeaveRequestSchema,
    updateStudentProfileSchema,
    attendanceViewSchema,
};
