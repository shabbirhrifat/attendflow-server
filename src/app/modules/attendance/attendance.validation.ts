import { z } from "zod";

// Attendance status enum
const attendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

// QR Code status enum
const qrCodeStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'USED']);

// Create attendance validation schema
const createAttendanceSchema = z.object({
    body: z.object({
        userId: z.string().min(1, 'User ID is required'),
        courseId: z.string().min(1, 'Course ID is required'),
        date: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid date format'),
        status: attendanceStatusEnum.default('PRESENT'),
        checkIn: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid check-in time format').optional(),
        checkOut: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid check-out time format').optional(),
        notes: z.string().optional(),
    }),
});

// Update attendance validation schema
const updateAttendanceSchema = z.object({
    body: z.object({
        status: attendanceStatusEnum.optional(),
        checkIn: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid check-in time format').optional(),
        checkOut: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid check-out time format').optional(),
        notes: z.string().optional(),
    }),
});

// Bulk attendance marking validation schema
const bulkAttendanceSchema = z.object({
    body: z.object({
        courseId: z.string().min(1, 'Course ID is required'),
        date: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid date format'),
        attendances: z.array(z.object({
            userId: z.string().min(1, 'User ID is required'),
            status: attendanceStatusEnum,
            notes: z.string().optional(),
        })).min(1, 'At least one attendance record is required'),
    }),
});

// QR Code creation validation schema
const createQRCodeSchema = z.object({
    body: z.object({
        courseId: z.string().min(1, 'Course ID is required'),
        teacherId: z.string().min(1, 'Teacher ID is required'),
        validFrom: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid valid from date format'),
        validUntil: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid valid until date format'),
        maxUses: z.number().int().min(1).default(1),
        location: z.string().optional(),
        description: z.string().optional(),
    }),
});

// QR Code check-in validation schema
const qrCodeCheckInSchema = z.object({
    body: z.object({
        qrCode: z.string().min(1, 'QR code is required'),
        userId: z.string().min(1, 'User ID is required'),
        location: z.string().optional(),
    }),
});


// Attendance session creation validation schema
const createAttendanceSessionSchema = z.object({
    body: z.object({
        courseId: z.string().min(1, 'Course ID is required'),
        teacherId: z.string().min(1, 'Teacher ID is required'),
        startTime: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start time format'),
        endTime: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end time format').optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
    }),
});


// ID parameter validation schema
const idParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'ID is required'),
    }),
});

// Attendance filters validation schema
const attendanceFiltersSchema = z.object({
    query: z.object({
        courseId: z.string().optional(),
        userId: z.string().optional(),
        status: attendanceStatusEnum.optional(),
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format').optional(),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format').optional(),
        batchId: z.string().optional(),
        departmentId: z.string().optional(),
        reportType: z.string().optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        sort: z.string().optional(),
    }),
});

// QR Code filters validation schema
const qrCodeFiltersSchema = z.object({
    query: z.object({
        courseId: z.string().optional(),
        teacherId: z.string().optional(),
        status: qrCodeStatusEnum.optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    }),
});

// Session filters validation schema
const sessionFiltersSchema = z.object({
    query: z.object({
        courseId: z.string().optional(),
        teacherId: z.string().optional(),
        isActive: z.string().regex(/^(true|false)$/, 'isActive must be true or false').optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    }),
});

export const attendanceValidation = {
    createAttendanceSchema,
    updateAttendanceSchema,
    bulkAttendanceSchema,
    createQRCodeSchema,
    qrCodeCheckInSchema,
    createAttendanceSessionSchema,
    idParamSchema,
    attendanceFiltersSchema,
    qrCodeFiltersSchema,
    sessionFiltersSchema,
};
