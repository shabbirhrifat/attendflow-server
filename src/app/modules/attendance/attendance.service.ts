import { AttendanceModel, AttendanceSessionModel } from './attendance.model';
import {
    IAttendance,
    IAttendanceCreate,
    IAttendanceUpdate,
    IBulkAttendanceCreate,
    IAttendanceSession,
    IAttendanceSessionCreate,
    IAttendanceFilters,
    IAttendanceSummary,
    ICourseAttendanceStats,
    IStudentAttendanceStats,
    IAttendanceDashboard,
} from './attendance.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import UserModel from '../user/user.model';
import { CourseModel } from '../course/course.model';

/**
 * Record attendance for a student
 */
const recordAttendance = async (data: IAttendanceCreate): Promise<IAttendance> => {
    // Check if user exists
    const user = await UserModel.findById(data.userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Check if course exists
    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Check if attendance already exists for this user, course, and date
    const existingAttendance = await AttendanceModel.findByUserCourseDate(
        data.userId,
        data.courseId,
        data.date
    );

    if (existingAttendance) {
        throw new AppError(StatusCodes.CONFLICT, 'Attendance already recorded for this date');
    }

    const attendance = await AttendanceModel.create(data);
    return attendance as IAttendance;
};

/**
 * Update attendance record
 */
const updateAttendance = async (id: string, data: IAttendanceUpdate): Promise<IAttendance> => {
    // Check if attendance exists
    const existingAttendance = await AttendanceModel.findById(id);

    if (!existingAttendance) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Attendance record not found');
    }

    const updatedAttendance = await AttendanceModel.update(id, data);
    return updatedAttendance as IAttendance;
};

/**
 * Get attendance by ID
 */
const getAttendanceById = async (id: string): Promise<IAttendance | null> => {
    const attendance = await AttendanceModel.findById(id);

    if (!attendance) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Attendance record not found');
    }

    return attendance as IAttendance;
};

/**
 * Get attendance records with filters
 */
const getAttendances = async (filters: IAttendanceFilters) => {
    const { courseId, userId, startDate, endDate, status, page = 1, limit = 10 } = filters;

    const query: any = {};

    if (courseId) query.courseId = courseId;
    if (userId) query.userId = userId;
    if (status) query.status = status;

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const [attendances, total] = await Promise.all([
        AttendanceModel.model.find(query)
            .populate('course', 'id title code')
            .populate('user', 'id name email')
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        AttendanceModel.model.countDocuments(query),
    ]);

    return {
        data: attendances,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/**
 * Bulk mark attendance for multiple students
 */
const bulkMarkAttendance = async (data: IBulkAttendanceCreate) => {
    // Check if course exists
    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    const results = await AttendanceModel.bulkMark(data);
    return results;
};

/**
 * Get attendance summary for a course
 */
const getCourseAttendanceSummary = async (
    courseId: string,
    startDate?: Date,
    endDate?: Date
): Promise<IAttendanceSummary> => {
    // Check if course exists
    const course = await CourseModel.findById(courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    const summary = await AttendanceModel.getCourseSummary(courseId, startDate, endDate);
    return summary;
};

/**
 * Get attendance summary for a student
 */
const getStudentAttendanceSummary = async (
    userId: string,
    startDate?: Date,
    endDate?: Date
): Promise<IAttendanceSummary> => {
    // Check if user exists
    const user = await UserModel.findById(userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const summary = await AttendanceModel.getStudentSummary(userId, startDate, endDate);
    return summary;
};

/**
 * Create attendance session
 */
const createAttendanceSession = async (data: IAttendanceSessionCreate): Promise<IAttendanceSession> => {
    // Check if course exists
    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Check if teacher exists
    const teacher = await UserModel.findById(data.teacherId);

    if (!teacher) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
    }

    const session = await AttendanceSessionModel.create(data);
    return session;
};

/**
 * Get attendance dashboard data
 */
const getAttendanceDashboard = async (): Promise<IAttendanceDashboard> => {
    // Get today's attendance statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
        totalToday,
        presentToday,
        absentToday,
        lateToday,
        excusedToday,
    ] = await Promise.all([
        AttendanceModel.model.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
        AttendanceModel.model.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'PRESENT' }),
        AttendanceModel.model.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'ABSENT' }),
        AttendanceModel.model.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'LATE' }),
        AttendanceModel.model.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'EXCUSED' }),
    ]);

    // Get weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const [total, present] = await Promise.all([
            AttendanceModel.model.countDocuments({ date: { $gte: date, $lt: nextDate } }),
            AttendanceModel.model.countDocuments({ date: { $gte: date, $lt: nextDate }, status: 'PRESENT' }),
        ]);

        const attendance = total > 0 ? Math.round((present / total) * 100) : 0;
        weeklyTrend.push({
            day: date.toLocaleDateString('en', { weekday: 'short' }),
            attendance,
        });
    }

    // Get top and low performers (last 30 days) using aggregation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const studentStats = await AttendanceModel.model.aggregate([
        {
            $match: { date: { $gte: thirtyDaysAgo } }
        },
        {
            $group: {
                _id: '$userId',
                name: { $first: '$userId' }, // Will be populated
                totalClasses: { $sum: 1 },
                presentCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] }
                }
            }
        },
        {
            $match: { totalClasses: { $gte: 5 } }
        },
        {
            $sort: { attendanceRate: -1 }
        },
        {
            $limit: 10
        }
    ]);

    // Populate user names
    const populatedStats = await AttendanceModel.model.populate(studentStats, { path: '_id', model: 'User' });

    const topPerformers = populatedStats.slice(0, 5).map((student: any) => ({
        userId: student._id,
        name: student.name?.name || 'Unknown',
        attendance: Math.round((student.presentCount / student.totalClasses) * 100),
    }));

    const lowPerformers = populatedStats.slice(-5).reverse().map((student: any) => ({
        userId: student._id,
        name: student.name?.name || 'Unknown',
        attendance: Math.round((student.presentCount / student.totalClasses) * 100),
    }));

    return {
        totalSessions: 0, // Would be calculated from attendance sessions
        activeSessions: 0, // Would be calculated from active attendance sessions
        todayAttendance: {
            total: totalToday,
            present: presentToday,
            absent: absentToday,
            late: lateToday,
            excused: excusedToday,
        },
        weeklyTrend,
        topPerformers,
        lowPerformers,
    };
};

export const attendanceServices = {
    recordAttendance,
    updateAttendance,
    getAttendanceById,
    getAttendances,
    bulkMarkAttendance,
    getCourseAttendanceSummary,
    getStudentAttendanceSummary,
    createAttendanceSession,
    getAttendanceDashboard,
};