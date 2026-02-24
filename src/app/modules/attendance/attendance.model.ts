import { Attendance, AttendanceSession } from './attendance.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * Attendance Repository using MongoDB/Mongoose
 */
class AttendanceRepository extends BaseRepository<any> {
  constructor() {
    super(Attendance);
  }

  /**
   * Find attendance by user, course, and date
   */
  async findByUserCourseDate(userId: string, courseId: string, date: Date) {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    return await this.model.findOne({ userId, courseId, date: queryDate })
      .populate('user', 'id name email')
      .populate('course', 'id title code');
  }

  /**
   * Find attendances by user
   */
  async findByUser(userId: string, filters: any = {}) {
    const { courseId, status, startDate, endDate, page = 1, limit = 10, sort } = filters;
    const query: any = { userId };

    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = ((page as number) - 1) * (limit as number);

    // Handle sort parameter
    let sortOptions: any = { date: -1 };
    if (sort) {
      sortOptions = {};
      if (sort.startsWith('-')) {
        sortOptions[sort.substring(1)] = -1;
      } else {
        sortOptions[sort] = 1;
      }
    }

    const [attendances, total] = await Promise.all([
      this.model.find(query)
        .populate('user', 'id name email')
        .populate('course', 'id title code')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit as number)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      data: attendances,
      meta: {
        page: page as number,
        limit: limit as number,
        total,
        totalPages: Math.ceil(total / (limit as number)),
      },
    };
  }

  /**
   * Find attendances by course
   */
  async findByCourse(courseId: string, filters: any = {}) {
    const { userId, status, startDate, endDate, page = 1, limit = 10, sort } = filters;
    const query: any = { courseId };

    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = ((page as number) - 1) * (limit as number);

    // Handle sort parameter
    let sortOptions: any = { date: -1 };
    if (sort) {
      sortOptions = {};
      if (sort.startsWith('-')) {
        sortOptions[sort.substring(1)] = -1;
      } else {
        sortOptions[sort] = 1;
      }
    }

    const [attendances, total] = await Promise.all([
      this.model.find(query)
        .populate('user', 'id name email')
        .populate('course', 'id title code')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit as number)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      data: attendances,
      meta: {
        page: page as number,
        limit: limit as number,
        total,
        totalPages: Math.ceil(total / (limit as number)),
      },
    };
  }

  /**
   * Bulk mark attendance
   */
  async bulkMark(data: any) {
    const { courseId, date, attendances, markedBy } = data;
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const operations = attendances.map((attendance: any) => ({
      updateOne: {
        filter: { userId: attendance.userId, courseId, date: queryDate },
        update: {
          $set: {
            userId: attendance.userId,
            courseId,
            date: queryDate,
            status: attendance.status,
            notes: attendance.notes,
            markedBy,
          },
        },
        upsert: true,
      },
    }));

    await this.model.bulkWrite(operations);

    return await this.model.find({ courseId, date: queryDate })
      .populate('user', 'id name email')
      .populate('course', 'id title code');
  }

  /**
   * Get course summary with monthly breakdown
   */
  async getCourseSummary(courseId: string, startDate?: Date, endDate?: Date) {
    const matchQuery: any = { courseId };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = startDate;
      if (endDate) matchQuery.date.$lte = endDate;
    }

    // Aggregation for status counts
    const statusCounts = await this.model.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = statusCounts.reduce((acc: any, item: any) => {
      acc[item._id.toLowerCase()] = item.count;
      return acc;
    }, {});

    const totalClasses = await this.model.countDocuments(matchQuery);

    // Get unique dates to count total class days
    const uniqueDates = await this.model.distinct('date', matchQuery);

    // Monthly breakdown using aggregation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await this.model.aggregate([
      {
        $match: {
          courseId: mongoose.Types.ObjectId.createFromHexString(courseId),
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);

    // Process monthly data
    const monthlyBreakdown = monthlyData.reduce((acc: any[], item: any) => {
      const existingMonth = acc.find((m: any) => m.month === item._id.month);

      if (existingMonth) {
        existingMonth[item._id.status.toLowerCase()] = item.count;
      } else {
        acc.push({
          month: item._id.month,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          [item._id.status.toLowerCase()]: item.count,
        });
      }

      return acc;
    }, []);

    return {
      totalClasses: uniqueDates.length,
      presentCount: counts.present || 0,
      absentCount: counts.absent || 0,
      lateCount: counts.late || 0,
      excusedCount: counts.excused || 0,
      attendancePercentage: totalClasses > 0 ? Math.round(((counts.present || 0) / totalClasses) * 100) : 0,
      monthlyBreakdown,
    };
  }

  /**
   * Get student summary with monthly breakdown
   */
  async getStudentSummary(userId: string, startDate?: Date, endDate?: Date) {
    const matchQuery: any = { userId };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = startDate;
      if (endDate) matchQuery.date.$lte = endDate;
    }

    // Aggregation for status counts
    const statusCounts = await this.model.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = statusCounts.reduce((acc: any, item: any) => {
      acc[item._id.toLowerCase()] = item.count;
      return acc;
    }, {});

    const totalClasses = await this.model.countDocuments(matchQuery);

    // Monthly breakdown using aggregation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await this.model.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId.createFromHexString(userId),
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);

    // Process monthly data
    const monthlyBreakdown = monthlyData.reduce((acc: any[], item: any) => {
      const existingMonth = acc.find((m: any) => m.month === item._id.month);

      if (existingMonth) {
        existingMonth[item._id.status.toLowerCase()] = item.count;
      } else {
        acc.push({
          month: item._id.month,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          [item._id.status.toLowerCase()]: item.count,
        });
      }

      return acc;
    }, []);

    return {
      totalClasses,
      presentCount: counts.present || 0,
      absentCount: counts.absent || 0,
      lateCount: counts.late || 0,
      excusedCount: counts.excused || 0,
      attendancePercentage: totalClasses > 0 ? Math.round(((counts.present || 0) / totalClasses) * 100) : 0,
      monthlyBreakdown,
    };
  }

  /**
   * Get attendance statistics for a user across all courses
   */
  async getUserStats(userId: string) {
    const stats = await this.model.aggregate([
      { $match: { userId: mongoose.Types.ObjectId.createFromHexString(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } },
        },
      },
    ]);

    return stats[0] || { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
  }

  /**
   * Get attendance statistics for a course
   */
  async getCourseStats(courseId: string) {
    const stats = await this.model.aggregate([
      { $match: { courseId: mongoose.Types.ObjectId.createFromHexString(courseId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] } },
        },
      },
    ]);

    return stats[0] || { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
  }
}

/**
 * Attendance Session Repository using MongoDB/Mongoose
 */
class AttendanceSessionRepository extends BaseRepository<any> {
  constructor() {
    super(AttendanceSession);
  }

  /**
   * Find active sessions by course
   */
  async findActiveByCourse(courseId: string) {
    return await this.model.find({ courseId, isActive: true })
      .populate('course')
      .populate('teacher', 'id name email')
      .sort({ date: -1 });
  }

  /**
   * Find active sessions by teacher
   */
  async findActiveByTeacher(teacherId: string) {
    return await this.model.find({ teacherId, isActive: true })
      .populate('course')
      .populate('teacher', 'id name email')
      .sort({ date: -1 });
  }

  /**
   * Find session by course, date, and teacher
   */
  async findByCourseDateTeacher(courseId: string, date: Date, teacherId: string) {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    return await this.model.findOne({ courseId, date: queryDate, teacherId })
      .populate('course')
      .populate('teacher', 'id name email');
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, endTime?: Date) {
    return await this.model.findByIdAndUpdate(
      sessionId,
      {
        isActive: false,
        endTime: endTime || new Date(),
      },
      { new: true }
    ).populate('course').populate('teacher', 'id name email');
  }

  /**
   * Get today's sessions for a teacher
   */
  async getTodaySessions(teacherId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.model.find({
      teacherId,
      date: { $gte: today, $lt: tomorrow },
    })
    .populate('course')
    .populate('teacher', 'id name email')
    .sort({ startTime: 1 });
  }

  /**
   * Get active session for a course
   */
  async getActiveForCourse(courseId: string) {
    return await this.model.findOne({ courseId, isActive: true })
      .populate('course')
      .populate('teacher', 'id name email');
  }
}

// Create singleton instances
const attendanceRepository = new AttendanceRepository();
const attendanceSessionRepository = new AttendanceSessionRepository();

// Export for backward compatibility
export { Attendance, AttendanceSession };
export const AttendanceModel = attendanceRepository;
export const AttendanceSessionModel = attendanceSessionRepository;

export default attendanceRepository;
