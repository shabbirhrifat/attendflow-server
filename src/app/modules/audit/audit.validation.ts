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
  hours: z.string().transform(Number).min(1).max(168).default(24), // Max 7 days
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// Query parameters for recent activity
const recentActivityQuerySchema = z.object({
  hours: z.string().transform(Number).min(1).max(168).default(24),
  limit: z.string().transform(Number).min(1).max(500).default(100),
});

// Query parameters for audit stats
const auditStatsQuerySchema = z.object({
  days: z.string().transform(Number).min(1).max(365).default(30),
});

export const AuditValidation = {
  auditLogQuery: auditLogQuerySchema,
  cleanupLogs: cleanupLogsSchema,
  failedLoginsQuery: failedLoginsQuerySchema,
  recentActivityQuery: recentActivityQuerySchema,
  auditStatsQuery: auditStatsQuerySchema,
};
