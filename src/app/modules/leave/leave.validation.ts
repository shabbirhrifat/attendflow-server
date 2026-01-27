import { z } from "zod";

// Leave status enum
const leaveStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// Leave type enum
const leaveTypeEnum = z.enum(['SICK', 'PERSONAL', 'VACATION', 'ACADEMIC', 'EMERGENCY']);

// Create leave validation schema
const createLeaveSchema = z.object({
    body: z.object({
        userId: z.string().min(1, 'User ID is required'),
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format'),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format'),
        reason: z.string().min(5, 'Reason must be at least 5 characters'),
    }).refine((data) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return endDate >= startDate;
    }, {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
    }),
});

// Update leave validation schema
const updateLeaveSchema = z.object({
    body: z.object({
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format').optional(),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format').optional(),
        reason: z.string().min(5, 'Reason must be at least 5 characters').optional(),
    }).refine((data) => {
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            return endDate >= startDate;
        }
        return true;
    }, {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
    }),
});

// Approve/Reject leave validation schema
const approveRejectLeaveSchema = z.object({
    body: z.object({
        status: leaveStatusEnum,
        rejectionReason: z.string().optional(),
    }),
});

// Leave Request creation validation schema
const createLeaveRequestSchema = z.object({
    body: z.object({
        userId: z.string().min(1, 'User ID is required'),
        studentId: z.string().optional(),
        teacherId: z.string().optional(),
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format'),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format'),
        reason: z.string().min(5, 'Reason must be at least 5 characters'),
        type: leaveTypeEnum.default('PERSONAL'),
        documents: z.string().optional(),
        isPaid: z.boolean().default(false),
    }).refine((data) => {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return endDate >= startDate;
    }, {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
    }),
});

// Leave Request update validation schema
const updateLeaveRequestSchema = z.object({
    body: z.object({
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format').optional(),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format').optional(),
        reason: z.string().min(5, 'Reason must be at least 5 characters').optional(),
        type: leaveTypeEnum.optional(),
        documents: z.string().optional(),
        isPaid: z.boolean().optional(),
    }).refine((data) => {
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            return endDate >= startDate;
        }
        return true;
    }, {
        message: 'End date must be after or equal to start date',
        path: ['endDate'],
    }),
});

// Leave Balance creation validation schema
const createLeaveBalanceSchema = z.object({
    body: z.object({
        userId: z.string().min(1, 'User ID is required'),
        studentId: z.string().optional(),
        teacherId: z.string().optional(),
        academicYear: z.string().min(1, 'Academic year is required'),
        sickLeave: z.number().int().min(0).default(0),
        personalLeave: z.number().int().min(0).default(0),
        vacationLeave: z.number().int().min(0).default(0),
    }),
});

// Leave Balance update validation schema
const updateLeaveBalanceSchema = z.object({
    body: z.object({
        sickLeave: z.number().int().min(0).optional(),
        personalLeave: z.number().int().min(0).optional(),
        vacationLeave: z.number().int().min(0).optional(),
        usedSick: z.number().int().min(0).optional(),
        usedPersonal: z.number().int().min(0).optional(),
        usedVacation: z.number().int().min(0).optional(),
    }),
});

// Leave Policy creation validation schema
const createLeavePolicySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Policy name is required'),
        description: z.string().optional(),
        academicYear: z.string().min(1, 'Academic year is required'),
        maxSickLeave: z.number().int().min(0).default(5),
        maxPersonalLeave: z.number().int().min(0).default(3),
        maxVacationLeave: z.number().int().min(0).default(10),
        requireDocuments: z.boolean().default(false),
        minAdvanceDays: z.number().int().min(0).default(1),
        maxConsecutiveDays: z.number().int().min(1).default(7),
        isActive: z.boolean().default(true),
    }),
});

// Leave Policy update validation schema
const updateLeavePolicySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Policy name is required').optional(),
        description: z.string().optional(),
        maxSickLeave: z.number().int().min(0).optional(),
        maxPersonalLeave: z.number().int().min(0).optional(),
        maxVacationLeave: z.number().int().min(0).optional(),
        requireDocuments: z.boolean().optional(),
        minAdvanceDays: z.number().int().min(0).optional(),
        maxConsecutiveDays: z.number().int().min(1).optional(),
        isActive: z.boolean().optional(),
    }),
});


// ID parameter validation schema
const idParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'ID is required'),
    }),
});

// Leave filters validation schema
const leaveFiltersSchema = z.object({
    query: z.object({
        userId: z.string().optional(),
        studentId: z.string().optional(),
        teacherId: z.string().optional(),
        status: leaveStatusEnum.optional(),
        type: leaveTypeEnum.optional(),
        leaveType: leaveTypeEnum.optional(),
        startDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid start date format').optional(),
        endDate: z.string().refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid end date format').optional(),
        academicYear: z.string().optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

// Leave Balance filters validation schema
const leaveBalanceFiltersSchema = z.object({
    query: z.object({
        userId: z.string().optional(),
        studentId: z.string().optional(),
        teacherId: z.string().optional(),
        academicYear: z.string().optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    }),
});

// Leave Policy filters validation schema
const leavePolicyFiltersSchema = z.object({
    query: z.object({
        academicYear: z.string().optional(),
        isActive: z.string().regex(/^(true|false)$/, 'isActive must be true or false').optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    }),
});

export const leaveValidation = {
    createLeaveSchema,
    updateLeaveSchema,
    approveRejectLeaveSchema,
    createLeaveRequestSchema,
    updateLeaveRequestSchema,
    createLeaveBalanceSchema,
    updateLeaveBalanceSchema,
    createLeavePolicySchema,
    updateLeavePolicySchema,
    idParamSchema,
    leaveFiltersSchema,
    leaveBalanceFiltersSchema,
    leavePolicyFiltersSchema,
};
