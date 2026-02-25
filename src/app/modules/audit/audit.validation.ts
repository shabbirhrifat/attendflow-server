/**
 * Audit Log Module - Validation Schemas
 *
 * Zod validation schemas for audit log endpoints
 */

import { z } from 'zod';
import { AuditAction } from './audit.interface';

// Query parameters for filtering audit logs
const auditLogQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  success: z.string().transform((val) => val === 'true').optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// Cleanup old logs body schema
const cleanupLogsSchema = z.object({
  body: z.object({
    daysToKeep: z.number().min(1).max(365).default(90),
  }),
});

// Query parameters for failed logins
const failedLoginsQuerySchema = z.object({
  hours: z.string().default('24').transform((val) => {
    const num = Number(val);
    if (num < 1 || num > 168) throw new Error('Hours must be between 1 and 168');
    return num;
  }),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// Query parameters for recent activity
const recentActivityQuerySchema = z.object({
  hours: z.string().default('24').transform((val) => {
    const num = Number(val);
    if (num < 1 || num > 168) throw new Error('Hours must be between 1 and 168');
    return num;
  }),
  limit: z.string().default('100').transform((val) => {
    const num = Number(val);
    if (num < 1 || num > 500) throw new Error('Limit must be between 1 and 500');
    return num;
  }),
});

// Query parameters for audit stats
const auditStatsQuerySchema = z.object({
  days: z.string().default('30').transform((val) => {
    const num = Number(val);
    if (num < 1 || num > 365) throw new Error('Days must be between 1 and 365');
    return num;
  }),
});

export const AuditValidation = {
  auditLogQuery: auditLogQuerySchema,
  cleanupLogs: cleanupLogsSchema,
  failedLoginsQuery: failedLoginsQuerySchema,
  recentActivityQuery: recentActivityQuerySchema,
  auditStatsQuery: auditStatsQuerySchema,
};
