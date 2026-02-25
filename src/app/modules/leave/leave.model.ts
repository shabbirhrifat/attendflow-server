import { LeaveRequest, LeaveBalance, LeavePolicy } from './leave.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * Leave Request Repository using MongoDB/Mongoose
 */
class LeaveRequestRepository extends BaseRepository<any> {
  constructor() {
    super(LeaveRequest);
  }

  /**
   * Find leaves by user ID
   */
  async findByUserId(userId: string) {
    return await this.model.find({ userId })
      .populate('user', 'id name email')
      .sort({ createdAt: -1 });
  }

  /**
   * Find leaves by student ID
   */
  async findByStudentId(studentId: string) {
    return await this.model.find({ studentId })
      .populate('student')
      .populate('user', 'id name email')
      .sort({ createdAt: -1 });
  }

  /**
   * Find leaves by teacher ID
   */
  async findByTeacherId(teacherId: string) {
    return await this.model.find({ teacherId })
      .populate('teacher')
      .populate('user', 'id name email')
      .sort({ createdAt: -1 });
  }

  /**
   * Find leaves with filters
   */
  async findMany(filters: any = {}) {
    const { userId, status, leaveType, startDate, endDate, page = 1, limit = 10 } = filters;
    const query: any = {};

    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (leaveType) query.type = leaveType;

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const skip = ((page as number) - 1) * (limit as number);

    const [leaves, total] = await Promise.all([
      this.model.find(query)
        .populate('user', 'id name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit as number)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      data: leaves,
      meta: {
        page: page as number,
        limit: limit as number,
        total,
        totalPages: Math.ceil(total / (limit as number)),
      },
    };
  }

  /**
   * Update leave status (approve/reject)
   */
  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', approvedBy: string, rejectionReason?: string) {
    return await this.model.findByIdAndUpdate(
      id,
      {
        status,
        approvedBy,
        approvedAt: new Date(),
        ...(rejectionReason && { rejectionReason }),
      },
      { new: true }
    )
    .populate('user', 'id name email')
    .populate('approver', 'id name email');
  }

  /**
   * Get leave statistics
   */
  async getStats(filters: any = {}) {
    const { userId, startDate, endDate } = filters;
    const matchQuery: any = {};

    if (userId) matchQuery.userId = mongoose.Types.ObjectId.createFromHexString(userId);

    if (startDate || endDate) {
      matchQuery.startDate = {};
      if (startDate) matchQuery.startDate.$gte = new Date(startDate);
      if (endDate) matchQuery.startDate.$lte = new Date(endDate);
    }

    const [
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
    ] = await Promise.all([
      this.model.countDocuments(matchQuery),
      this.model.countDocuments({ ...matchQuery, status: 'PENDING' }),
      this.model.countDocuments({ ...matchQuery, status: 'APPROVED' }),
      this.model.countDocuments({ ...matchQuery, status: 'REJECTED' }),
    ]);

    // Get leave by type using aggregation
    const leaveByType = await this.model.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const leaveByTypeMap = leaveByType.reduce((acc: Record<string, number>, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Monthly trend using aggregation
    const monthlyTrend = await this.model.aggregate([
      {
        $match: {
          ...matchQuery,
          startDate: {
            $gte: filters.startDate || new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$startDate' } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id': 1 },
      },
    ]);

    return {
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      leaveByType: leaveByTypeMap,
      monthlyTrend: monthlyTrend.map((item: any) => ({
        month: item._id,
        count: item.count,
      })),
    };
  }

  /**
   * Get pending leaves
   */
  async getPending() {
    return await this.model.find({ status: 'PENDING' })
      .populate('user', 'id name email')
      .sort({ createdAt: 1 });
  }

  /**
   * Find leaves overlapping with date range
   */
  async findOverlapping(userId: string, startDate: Date, endDate: Date, excludeId?: string) {
    const query: any = {
      userId,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await this.model.find(query);
  }
}

/**
 * Leave Balance Repository using MongoDB/Mongoose
 */
class LeaveBalanceRepository extends BaseRepository<any> {
  constructor() {
    super(LeaveBalance);
  }

  /**
   * Find leave balance by user ID and academic year
   */
  async findByUserAndYear(userId: string, academicYear: string) {
    return await this.model.findOne({ userId, academicYear })
      .populate('user', 'id name email');
  }

  /**
   * Find leave balance by student ID
   */
  async findByStudentId(studentId: string) {
    return await this.model.findOne({ studentId })
      .populate('student')
      .populate('user', 'id name email');
  }

  /**
   * Find leave balance by teacher ID
   */
  async findByTeacherId(teacherId: string) {
    return await this.model.findOne({ teacherId })
      .populate('teacher')
      .populate('user', 'id name email');
  }

  /**
   * Update used leave counts
   */
  async updateUsedLeave(balanceId: string, leaveType: string, increment: number) {
    const updateField = `used${leaveType.charAt(0).toUpperCase() + leaveType.slice(1)}`;

    return await this.model.findByIdAndUpdate(
      balanceId,
      {
        $inc: { [updateField]: increment },
      },
      { new: true }
    );
  }

  /**
   * Get leave balance summary
   */
  async getBalanceSummary(userId: string, academicYear: string) {
    return await this.model.findOne({ userId, academicYear })
      .populate('user', 'id name email');
  }

  /**
   * Create or update leave balance
   */
  async upsert(userId: string, academicYear: string, data: any) {
    return await this.model.findOneAndUpdate(
      { userId, academicYear },
      data,
      { upsert: true, new: true }
    );
  }
}

/**
 * Leave Policy Repository using MongoDB/Mongoose
 */
class LeavePolicyRepository extends BaseRepository<any> {
  constructor() {
    super(LeavePolicy);
  }

  /**
   * Find active policies
   */
  async findActive() {
    return await this.model.find({ isActive: true })
      .sort({ academicYear: -1 });
  }

  /**
   * Find policy by academic year
   */
  async findByAcademicYear(academicYear: string) {
    return await this.model.findOne({ academicYear, isActive: true });
  }

  /**
   * Find current policy
   */
  async findCurrent() {
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    return await this.model.findOne({ academicYear, isActive: true });
  }

  /**
   * Get policy by name
   */
  async findByName(name: string) {
    return await this.model.findOne({ name });
  }
}

// Create singleton instances
const leaveRequestRepository = new LeaveRequestRepository();
const leaveBalanceRepository = new LeaveBalanceRepository();
const leavePolicyRepository = new LeavePolicyRepository();

// Export for backward compatibility
export { LeaveRequest, LeaveBalance, LeavePolicy };
export const LeaveModel = leaveRequestRepository;
export const LeaveRequestModel = leaveRequestRepository;
export const LeaveBalanceModel = leaveBalanceRepository;
export const LeavePolicyModel = leavePolicyRepository;

export default leaveRequestRepository;
