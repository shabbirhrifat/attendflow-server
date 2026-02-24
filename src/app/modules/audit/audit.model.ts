import { AuditLog } from './audit.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * Audit Log Repository using MongoDB/Mongoose
 */
class AuditLogRepository extends BaseRepository<any> {
  constructor() {
    super(AuditLog);
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(userId: string, options: { limit?: number; skip?: number } = {}) {
    const { limit = 50, skip = 0 } = options;

    const [logs, total] = await Promise.all([
      this.model.find({ userId })
        .populate('user', 'id name email role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.model.countDocuments({ userId }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Find audit logs by action
   */
  async findByAction(action: string, options: { limit?: number; skip?: number } = {}) {
    const { limit = 50, skip = 0 } = options;

    const [logs, total] = await Promise.all([
      this.model.find({ action })
        .populate('user', 'id name email role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.model.countDocuments({ action }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Find audit logs by entity
   */
  async findByEntity(entity: string, entityId?: string, options: { limit?: number; skip?: number } = {}) {
    const { limit = 50, skip = 0 } = options;
    const query: any = { entity };

    if (entityId) {
      query.entityId = mongoose.Types.ObjectId.createFromHexString(entityId);
    }

    const [logs, total] = await Promise.all([
      this.model.find(query)
        .populate('user', 'id name email role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      data: logs,
      meta: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Find audit logs by date range
   */
  async findByDateRange(startDate: Date, endDate: Date, options: { limit?: number; skip?: number } = {}) {
    const { limit = 50, skip = 0 } = options;

    const query = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const [logs, total] = await Promise.all([
      this.model.find(query)
        .populate('user', 'id name email role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      data: logs,
      meta: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Create audit log
   */
  async createLog(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }) {
    return await this.model.create({
      ...data,
      userId: mongoose.Types.ObjectId.createFromHexString(data.userId),
      entityId: data.entityId ? mongoose.Types.ObjectId.createFromHexString(data.entityId) : undefined,
    });
  }

  /**
   * Get audit log statistics
   */
  async getStats(filters: { startDate?: Date; endDate?: Date; userId?: string } = {}) {
    const matchQuery: any = {};

    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }

    if (filters.userId) {
      matchQuery.userId = mongoose.Types.ObjectId.createFromHexString(filters.userId);
    }

    const stats = await this.model.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: ['$success', 1, 0] } },
          failed: { $sum: { $cond: [{ $not: '$success' }, 1, 0] } },
        },
      },
    ]);

    // Action breakdown
    const actionBreakdown = await this.model.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return {
      total: stats[0]?.total || 0,
      successful: stats[0]?.successful || 0,
      failed: stats[0]?.failed || 0,
      actionBreakdown: actionBreakdown.map((item: any) => ({
        action: item._id,
        count: item.count,
      })),
    };
  }

  /**
   * Delete old audit logs
   */
  async deleteOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.model.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
  }

  /**
   * Find failed login attempts
   */
  async findFailedLoginAttempts(ipAddress?: string, userId?: string, hours: number = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const query: any = {
      action: 'LOGIN_FAILED',
      createdAt: { $gte: cutoffDate },
    };

    if (ipAddress) query.ipAddress = ipAddress;
    if (userId) query.userId = mongoose.Types.ObjectId.createFromHexString(userId);

    return await this.model.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }
}

// Create singleton instance
const auditLogRepository = new AuditLogRepository();

// Export for backward compatibility
export { AuditLog };
export const AuditLogModel = auditLogRepository;

export default auditLogRepository;
