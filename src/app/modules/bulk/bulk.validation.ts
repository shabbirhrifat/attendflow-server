/**
 * Bulk Operations Module - Validation Schemas
 *
 * Zod validation schemas for bulk operation endpoints
 */

import { z } from 'zod';
import { BulkEntityType } from './bulk.interface';

const bulkCreateSchema = z.object({
  body: z.object({
    entityType: z.nativeEnum(BulkEntityType),
    data: z.array(z.any()).min(1),
    options: z.object({
      continueOnError: z.boolean().optional(),
      skipDuplicates: z.boolean().optional(),
    }).optional(),
  }),
});

const bulkUpdateSchema = z.object({
  body: z.object({
    entityType: z.nativeEnum(BulkEntityType),
    ids: z.array(z.string()).min(1),
    data: z.object({}).passthrough(),
  }),
});

const bulkDeleteSchema = z.object({
  body: z.object({
    entityType: z.nativeEnum(BulkEntityType),
    ids: z.array(z.string()).min(1),
  }),
});

const bulkMarkAttendanceSchema = z.object({
  body: z.object({
    courseId: z.string(),
    date: z.string().datetime(),
    attendance: z.array(z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      notes: z.string().optional(),
    })).min(1),
  }),
});

export const BulkValidation = {
  bulkCreate: bulkCreateSchema,
  bulkUpdate: bulkUpdateSchema,
  bulkDelete: bulkDeleteSchema,
  bulkMarkAttendance: bulkMarkAttendanceSchema,
};
