import { z } from 'zod';

// Teacher profile validation schemas
// INDUSTRY STANDARD: Only include fields that are actually provided during creation
// Auto-generated fields (employeeId) and optional relationships (departmentId) should NOT be required
export const createTeacherValidationSchema = z.object({
    userId: z.string().cuid('Invalid user ID').optional(),
    name: z.string().min(2, 'Name is required and must be at least 2 characters'),
    email: z.string().email('Invalid email format').min(1, 'Email is required'), // REQUIRED for all teachers
    password: z.string().min(8, 'Password must be at least 8 characters').optional(), // Optional, will use default if not provided
    departmentId: z.string().cuid('Invalid department ID').optional(), // Department can be assigned later
    designation: z.string().optional(),
    specialization: z.string().optional(),
    // NOTE: employeeId is AUTO-GENERATED and should NOT be in create form
});

export const updateTeacherValidationSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required').optional(),
    departmentId: z.string().cuid('Invalid department ID').optional(),
    designation: z.string().optional(),
    specialization: z.string().optional(),
    isActive: z.boolean().optional(),
});

// Teacher filters validation
export const teacherFiltersValidationSchema = z.object({
    departmentId: z.string().cuid('Invalid department ID').optional(),
    designation: z.string().optional(),
    specialization: z.string().optional(),
    isActive: z.boolean().optional(),
    status: z.enum(['all', 'active', 'inactive']).optional(),
    search: z.string().optional(),
    dateRange: z.object({
        start: z.string().datetime('Invalid start date'),
        end: z.string().datetime('Invalid end date'),
    }).optional(),
});

// Attendance marking validation
export const markAttendanceValidationSchema = z.object({
    studentId: z.string().cuid('Invalid student ID'),
    courseId: z.string().cuid('Invalid course ID'),
    date: z.string().datetime('Invalid date format'),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    checkIn: z.string().datetime('Invalid check-in time').optional(),
    checkOut: z.string().datetime('Invalid check-out time').optional(),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Bulk attendance marking validation
export const bulkMarkAttendanceValidationSchema = z.object({
    courseId: z.string().cuid('Invalid course ID'),
    date: z.string().datetime('Invalid date format'),
    attendances: z.array(z.object({
        studentId: z.string().cuid('Invalid student ID'),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        checkIn: z.string().datetime('Invalid check-in time').optional(),
        checkOut: z.string().datetime('Invalid check-out time').optional(),
        notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
    })).min(1, 'At least one attendance record is required'),
});

// Leave approval validation
export const leaveApprovalValidationSchema = z.object({
    leaveId: z.string().cuid('Invalid leave ID'),
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().max(500, 'Rejection reason must be less than 500 characters').optional(),
});

// Class schedule validation
export const createClassScheduleValidationSchema = z.object({
    courseId: z.string().cuid('Invalid course ID'),
    batchId: z.string().cuid('Invalid batch ID'),
    dayOfWeek: z.number().int().min(1, 'Day of week must be between 1 and 7').max(7, 'Day of week must be between 1 and 7'),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM format'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM format'),
    room: z.string().max(50, 'Room must be less than 50 characters').optional(),
    semester: z.number().int().min(1, 'Semester must be at least 1').optional(),
});

// Subject validation
export const createSubjectValidationSchema = z.object({
    name: z.string().min(1, 'Subject name is required').max(100, 'Subject name must be less than 100 characters'),
    code: z.string().min(1, 'Subject code is required').max(20, 'Subject code must be less than 20 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    credits: z.number().int().min(0, 'Credits must be at least 0').max(10, 'Credits must be at most 10').optional(),
    departmentId: z.string().cuid('Invalid department ID'),
});

export const updateSubjectValidationSchema = z.object({
    name: z.string().min(1, 'Subject name is required').max(100, 'Subject name must be less than 100 characters').optional(),
    code: z.string().min(1, 'Subject code is required').max(20, 'Subject code must be less than 20 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    credits: z.number().int().min(0, 'Credits must be at least 0').max(10, 'Credits must be at most 10').optional(),
    departmentId: z.string().cuid('Invalid department ID').optional(),
    isActive: z.boolean().optional(),
});


// Teacher course assignment validation
export const teacherCourseAssignmentValidationSchema = z.object({
    teacherId: z.string().cuid('Invalid teacher ID'),
    courseId: z.string().cuid('Invalid course ID'),
    semester: z.number().int().min(1, 'Semester must be at least 1').optional(),
});

// Teacher department assignment validation
export const teacherDepartmentAssignmentValidationSchema = z.object({
    teacherId: z.string().cuid('Invalid teacher ID'),
    departmentId: z.string().cuid('Invalid department ID'),
});

// Bulk teacher assignment validation
export const bulkTeacherAssignmentValidationSchema = z.object({
    teacherIds: z.array(z.string().cuid('Invalid teacher ID')).min(1, 'At least one teacher ID is required'),
    departmentId: z.string().cuid('Invalid department ID'),
});

// Query parameter validation
export const attendanceQueryValidationSchema = z.object({
    courseId: z.string().cuid('Invalid course ID').optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
    page: z.number().int().min(1, 'Page must be at least 1').optional(),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').optional(),
});

export const classScheduleQueryValidationSchema = z.object({
    teacherId: z.string().cuid('Invalid teacher ID').optional(),
    courseId: z.string().cuid('Invalid course ID').optional(),
    batchId: z.string().cuid('Invalid batch ID').optional(),
    dayOfWeek: z.number().int().min(1, 'Day of week must be between 1 and 7').max(7, 'Day of week must be between 1 and 7').optional(),
    semester: z.number().int().min(1, 'Semester must be at least 1').optional(),
    isActive: z.boolean().optional(),
});

export const leaveQueryValidationSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    page: z.number().int().min(1, 'Page must be at least 1').optional(),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').optional(),
});

// Parameter validation schemas
export const teacherIdParamSchema = z.object({
    params: z.object({
        teacherId: z.string().cuid('Invalid teacher ID'),
    }),
});

export const courseIdParamSchema = z.object({
    params: z.object({
        courseId: z.string().cuid('Invalid course ID'),
    }),
});

export const leaveIdParamSchema = z.object({
    params: z.object({
        leaveId: z.string().cuid('Invalid leave ID'),
    }),
});

export const scheduleIdParamSchema = z.object({
    params: z.object({
        scheduleId: z.string().cuid('Invalid schedule ID'),
    }),
});

export const subjectIdParamSchema = z.object({
    params: z.object({
        subjectId: z.string().cuid('Invalid subject ID'),
    }),
});

export const userIdParamSchema = z.object({
    params: z.object({
        userId: z.string().cuid('Invalid user ID'),
    }),
});

// Export all validation schemas
export const TeacherValidation = {
    createTeacher: createTeacherValidationSchema,
    updateTeacher: updateTeacherValidationSchema,
    teacherFilters: teacherFiltersValidationSchema,
    markAttendance: markAttendanceValidationSchema,
    bulkMarkAttendance: bulkMarkAttendanceValidationSchema,
    leaveApproval: leaveApprovalValidationSchema,
    createClassSchedule: createClassScheduleValidationSchema,
    createSubject: createSubjectValidationSchema,
    updateSubject: updateSubjectValidationSchema,
    teacherCourseAssignment: teacherCourseAssignmentValidationSchema,
    teacherDepartmentAssignment: teacherDepartmentAssignmentValidationSchema,
    bulkTeacherAssignment: bulkTeacherAssignmentValidationSchema,
    attendanceQuery: attendanceQueryValidationSchema,
    classScheduleQuery: classScheduleQueryValidationSchema,
    leaveQuery: leaveQueryValidationSchema,
    teacherIdParam: teacherIdParamSchema,
    courseIdParam: courseIdParamSchema,
    leaveIdParam: leaveIdParamSchema,
    scheduleIdParam: scheduleIdParamSchema,
    subjectIdParam: subjectIdParamSchema,
    userIdParam: userIdParamSchema,
};
