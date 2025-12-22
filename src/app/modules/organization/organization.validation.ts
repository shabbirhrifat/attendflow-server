import { z } from 'zod';

// Department validation schemas
export const createDepartmentValidationSchema = z.object({
    name: z.string().min(1, 'Department name is required').max(100, 'Department name must be less than 100 characters'),
    code: z.string().min(1, 'Department code is required').max(10, 'Department code must be less than 10 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    headId: z.string().cuid('Invalid department head ID').optional(),
});

export const updateDepartmentValidationSchema = z.object({
    name: z.string().min(1, 'Department name is required').max(100, 'Department name must be less than 100 characters').optional(),
    code: z.string().min(1, 'Department code is required').max(10, 'Department code must be less than 10 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    headId: z.string().cuid('Invalid department head ID').optional(),
    isActive: z.boolean().optional(),
});

// Department filters validation
export const departmentFiltersValidationSchema = z.object({
    isActive: z.boolean().optional(),
    status: z.enum(['all', 'active', 'inactive']).optional(),
    search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
    headId: z.string().cuid('Invalid department head ID').optional(),
});

// Semester validation schemas
export const createSemesterValidationSchema = z.object({
    name: z.string().min(1, 'Semester name is required').max(100, 'Semester name must be less than 100 characters'),
    year: z.number().int().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100'),
    departmentId: z.string().cuid('Invalid department ID'),
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
});

export const updateSemesterValidationSchema = z.object({
    name: z.string().min(1, 'Semester name is required').max(100, 'Semester name must be less than 100 characters').optional(),
    year: z.number().int().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100').optional(),
    departmentId: z.string().cuid('Invalid department ID').optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    isActive: z.boolean().optional(),
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

// Semester filters validation
export const semesterFiltersValidationSchema = z.object({
    departmentId: z.string().cuid('Invalid department ID').optional(),
    year: z.number().int().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100').optional(),
    isActive: z.boolean().optional(),
    search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
});

// Batch validation schemas
export const createBatchValidationSchema = z.object({
    name: z.string().min(1, 'Batch name is required').max(100, 'Batch name must be less than 100 characters'),
    year: z.number().int().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
});

export const updateBatchValidationSchema = z.object({
    name: z.string().min(1, 'Batch name is required').max(100, 'Batch name must be less than 100 characters').optional(),
    year: z.number().int().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional(),
    isActive: z.boolean().optional(),
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

// Batch filters validation
export const batchFiltersValidationSchema = z.object({
    year: z.coerce.number().int().min(2000, 'Year must be at least 2000').max(2100, 'Year must be at most 2100').optional(),
    isActive: z.boolean().optional(),
    status: z.enum(['all', 'active', 'inactive']).optional(),
    search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
});

// Subject validation schemas
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

// Subject filters validation
export const subjectFiltersValidationSchema = z.object({
    departmentId: z.string().cuid('Invalid department ID').optional(),
    isActive: z.boolean().optional(),
    search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
    credits: z.number().int().min(0, 'Credits must be at least 0').max(10, 'Credits must be at most 10').optional(),
});

// Query parameter validation
export const paginationQueryValidationSchema = z.object({
    page: z.number().int().min(1, 'Page must be at least 1').optional(),
    limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').optional(),
});

// Parameter validation schemas
export const departmentIdParamSchema = z.object({
    params: z.object({
        departmentId: z.string().cuid('Invalid department ID'),
    }),
});

export const semesterIdParamSchema = z.object({
    params: z.object({
        semesterId: z.string().cuid('Invalid semester ID'),
    }),
});

export const batchIdParamSchema = z.object({
    params: z.object({
        batchId: z.string().cuid('Invalid batch ID'),
    }),
});

export const subjectIdParamSchema = z.object({
    params: z.object({
        subjectId: z.string().cuid('Invalid subject ID'),
    }),
});

// Export all validation schemas
export const OrganizationValidation = {
    // Department validations
    createDepartment: createDepartmentValidationSchema,
    updateDepartment: updateDepartmentValidationSchema,
    departmentFilters: departmentFiltersValidationSchema,
    departmentIdParam: departmentIdParamSchema,

    // Semester validations
    createSemester: createSemesterValidationSchema,
    updateSemester: updateSemesterValidationSchema,
    semesterFilters: semesterFiltersValidationSchema,
    semesterIdParam: semesterIdParamSchema,

    // Batch validations
    createBatch: createBatchValidationSchema,
    updateBatch: updateBatchValidationSchema,
    batchFilters: batchFiltersValidationSchema,
    batchIdParam: batchIdParamSchema,

    // Subject validations
    createSubject: createSubjectValidationSchema,
    updateSubject: updateSubjectValidationSchema,
    subjectFilters: subjectFiltersValidationSchema,
    subjectIdParam: subjectIdParamSchema,

    // Query validations
    paginationQuery: paginationQueryValidationSchema,
};
