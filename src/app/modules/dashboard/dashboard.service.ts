import {
    IDashboardOverview,
    IClassLevelStats,
    ISubjectLevelStats,
    ITeacherPerformanceData,
    IAttendanceStats,
    ILeaveStats,
    IAttendanceReportData,
} from './dashboard.interface';
import { StudentModel } from '../student/student.model';
import { TeacherModel } from '../teacher/teacher.model';
import { CourseModel } from '../course/course.model';
import { DepartmentModel, BatchModel, SubjectModel } from '../organization/organization.model';
import { LeaveModel } from '../leave/leave.model';
import { AttendanceModel } from '../attendance/attendance.model';
import { CourseEnrollmentModel } from '../course/course.model';
import mongoose from 'mongoose';

// Dashboard Service
export const DashboardService = {
    // Dashboard Overview
    async getDashboardOverview(filters?: {
        startDate?: Date;
        endDate?: Date;
        departmentId?: string;
        batchId?: string;
    }): Promise<IDashboardOverview> {
        const { startDate, endDate, departmentId, batchId } = filters || {};

        // Get basic counts
        const [
            totalStudents,
            totalTeachers,
            totalCourses,
            totalDepartments,
            totalBatches,
        ] = await Promise.all([
            StudentModel.model.countDocuments(batchId ? { batchId } : {}),
            TeacherModel.model.countDocuments(departmentId ? { departmentId } : {}),
            CourseModel.model.countDocuments(batchId ? { batchId } : {}),
            DepartmentModel.model.countDocuments(departmentId ? { _id: departmentId } : {}),
            BatchModel.model.countDocuments(batchId ? { _id: batchId } : {}),
        ]);

        // Get attendance stats
        const attendanceStats = await this.getAttendanceStats({
            startDate,
            endDate,
            departmentId,
            batchId,
        });

        // Get leave stats
        const leaveStats = await this.getLeaveStats({
            startDate,
            endDate,
            departmentId,
            batchId,
        });

        // Get low attendance alerts (computed on the fly)
        const lowAttendanceAlerts = await this.getLowAttendanceAlerts({
            threshold: 75, // Default threshold
            page: 1,
            limit: 5, // Limit to recent alerts
        });

        // Get recent reports (computed on the fly)
        const recentReports = await this.getRecentReports(5);

        return {
            totalStudents,
            totalTeachers,
            totalCourses,
            totalDepartments,
            attendanceStats,
            leaveStats,
            lowAttendanceAlerts,
            recentReports,
        };
    },

    // Class Level Statistics
    async getClassLevelStats(filters?: {
        courseId?: string;
        batchId?: string;
        departmentId?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ data: IClassLevelStats[]; meta: any }> {
        const { courseId, batchId, departmentId, startDate, endDate, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters || {};

        const matchStage: any = {};
        if (courseId) matchStage.$and = [{ $expr: { $eq: ['$_id', { $toObjectId: courseId }] } }];
        if (batchId) matchStage.batchId = batchId;

        const sortStage: any = {};
        sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Aggregation pipeline for courses with stats
        const attendanceMatchConditions: any[] = [
            { $eq: ['$courseId', '$$courseId'] },
        ];
        if (startDate) {
            attendanceMatchConditions.push({ $gte: ['$date', startDate] });
        }
        if (endDate) {
            attendanceMatchConditions.push({ $lte: ['$date', endDate] });
        }

        const courses = await CourseModel.model.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'batches',
                    localField: 'batchId',
                    foreignField: '_id',
                    as: 'batch',
                },
            },
            { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'courseenrollments',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'enrollments',
                },
            },
            {
                $addFields: {
                    totalStudents: { $size: '$enrollments' },
                },
            },
            {
                $lookup: {
                    from: 'attendances',
                    let: { courseId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: attendanceMatchConditions,
                                },
                            },
                        },
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    as: 'attendanceStats',
                },
            },
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);

        // Process courses with attendance distribution
        const coursesWithDistribution = courses.map((course: any) => {
            const stats = course.attendanceStats?.reduce((acc: any, item: any) => {
                acc[item._id.toLowerCase()] = item.count;
                return acc;
            }, { present: 0, absent: 0, late: 0, excused: 0 }) || { present: 0, absent: 0, late: 0, excused: 0 };

            const totalClasses = Object.values(stats).reduce((sum: number, count: any) => sum + (count as number), 0);
            const attendanceRate = totalClasses > 0 ? (stats.present / totalClasses) * 100 : 0;

            return {
                courseId: course._id?.toString(),
                courseName: course.title,
                batchId: course.batchId?.toString(),
                batchName: course.batch?.name,
                totalStudents: course.totalStudents || 0,
                averageAttendance: Number(attendanceRate.toFixed(2)),
                attendanceDistribution: {
                    above90: attendanceRate >= 90 ? 1 : 0,
                    between75And90: attendanceRate >= 75 && attendanceRate < 90 ? 1 : 0,
                    between60And75: attendanceRate >= 60 && attendanceRate < 75 ? 1 : 0,
                    below60: attendanceRate < 60 ? 1 : 0,
                },
                monthlyTrend: [], // Would need separate aggregation
            };
        });

        return {
            data: coursesWithDistribution,
            meta: {
                page,
                limit,
                total: coursesWithDistribution.length,
                totalPages: Math.ceil(coursesWithDistribution.length / limit),
            },
        };
    },

    // Subject Level Statistics
    async getSubjectLevelStats(filters?: {
        subjectId?: string;
        batchId?: string;
        departmentId?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ data: ISubjectLevelStats[]; meta: any }> {
        const { subjectId, batchId, departmentId, startDate, endDate, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters || {};

        const matchStage: any = { isActive: true };
        if (subjectId) matchStage._id = mongoose.Types.ObjectId.createFromHexString(subjectId);
        if (departmentId) matchStage.departmentId = mongoose.Types.ObjectId.createFromHexString(departmentId);

        const sortStage: any = {};
        sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const subjects = await SubjectModel.model.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'departmentId',
                    foreignField: '_id',
                    as: 'department',
                },
            },
            { $unwind: '$department' },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: 'subjectId',
                    as: 'courses',
                },
            },
            {
                $addFields: {
                    totalCourses: { $size: '$courses' },
                },
            },
            {
                $lookup: {
                    from: 'courseenrollments',
                    let: { courseIds: '$courses._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$courseId', '$$courseIds'],
                                },
                            },
                        },
                    ],
                    as: 'enrollments',
                },
            },
            {
                $addFields: {
                    totalStudents: { $size: { $setUnion: '$enrollments.studentId' } },
                },
            },
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);

        const subjectsWithData = subjects.map((subject: any) => ({
            subjectId: subject._id?.toString(),
            subjectName: subject.name,
            departmentId: subject.departmentId?.toString(),
            departmentName: subject.department?.name,
            totalCourses: subject.totalCourses || 0,
            totalStudents: subject.enrollments?.length || 0,
            averageAttendance: 0,
            averagePerformance: 0,
            topPerformingCourses: [],
        }));

        return {
            data: subjectsWithData,
            meta: {
                page,
                limit,
                total: subjectsWithData.length,
                totalPages: Math.ceil(subjectsWithData.length / limit),
            },
        };
    },

    // Teacher Performance Data
    async getTeacherPerformanceData(filters?: {
        teacherId?: string;
        courseId?: string;
        batchId?: string;
        departmentId?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ data: ITeacherPerformanceData[]; meta: any }> {
        const { teacherId, courseId, batchId, departmentId, startDate, endDate, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters || {};

        const matchStage: any = { isActive: true };
        if (teacherId) matchStage._id = mongoose.Types.ObjectId.createFromHexString(teacherId);
        if (departmentId) matchStage.departmentId = mongoose.Types.ObjectId.createFromHexString(departmentId);

        const sortStage: any = {};
        sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const teachers = await TeacherModel.model.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'departmentId',
                    foreignField: '_id',
                    as: 'department',
                },
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: 'teacherId',
                    as: 'courses',
                },
            },
            {
                $addFields: {
                    totalCourses: { $size: '$courses' },
                },
            },
            {
                $lookup: {
                    from: 'courseenrollments',
                    let: { courseIds: '$courses._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$courseId', '$$courseIds'],
                                },
                            },
                        },
                    ],
                    as: 'enrollments',
                },
            },
            {
                $addFields: {
                    totalStudents: { $size: '$enrollments' },
                },
            },
            { $sort: sortStage },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);

        const teachersWithMonthlyData = teachers.map((teacher: any) => ({
            teacherId: teacher._id?.toString(),
            teacherName: teacher.user?.name,
            departmentId: teacher.departmentId?.toString(),
            departmentName: teacher.department?.name,
            totalCourses: teacher.totalCourses || 0,
            totalStudents: teacher.enrollments?.length || 0,
            averageAttendance: 0,
            studentPerformance: 0,
            attendanceMarkingConsistency: 0,
            leaveApprovalRate: 0,
            monthlyPerformance: [],
        }));

        return {
            data: teachersWithMonthlyData,
            meta: {
                page,
                limit,
                total: teachersWithMonthlyData.length,
                totalPages: Math.ceil(teachersWithMonthlyData.length / limit),
            },
        };
    },

    // Helper methods
    async getAttendanceStats(filters?: {
        startDate?: Date;
        endDate?: Date;
        departmentId?: string;
        batchId?: string;
    }): Promise<IAttendanceStats> {
        const { startDate, endDate } = filters || {};

        const matchStage: any = {};
        if (startDate) matchStage.$gte = startDate;
        if (endDate) matchStage.$lte = endDate;

        const dateFilter = Object.keys(matchStage).length > 0 ? { date: matchStage } : {};

        // Get attendance counts using aggregation
        const attendanceResult = await AttendanceModel.model.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalClasses: { $sum: 1 },
                    presentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
                    },
                    absentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] },
                    },
                    lateCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] },
                    },
                    excusedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'EXCUSED'] }, 1, 0] },
                    },
                },
            },
        ]);

        const attendance = attendanceResult[0] || {
            totalClasses: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            excusedCount: 0,
        };

        const attendancePercentage = attendance.totalClasses > 0
            ? Math.round((attendance.presentCount / attendance.totalClasses) * 100)
            : 0;

        // Get monthly breakdown
        const monthlyData = await AttendanceModel.model.aggregate([
            { $match: dateFilter },
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

        const monthlyBreakdown = monthlyData.reduce((acc: any[], item: any) => {
            const existingMonth = acc.find((m: any) => m.month === item._id.month);
            if (existingMonth) {
                existingMonth[item._id.status.toLowerCase() as string] = item.count;
            } else {
                acc.push({
                    month: item._id.month,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    [item._id.status.toLowerCase() as string]: item.count,
                });
            }
            return acc;
        }, []);

        return {
            totalClasses: attendance.totalClasses,
            presentCount: attendance.presentCount,
            absentCount: attendance.absentCount,
            lateCount: attendance.lateCount,
            excusedCount: attendance.excusedCount,
            attendancePercentage,
            monthlyBreakdown,
        };
    },

    async getLeaveStats(filters?: {
        startDate?: Date;
        endDate?: Date;
        departmentId?: string;
        batchId?: string;
    }): Promise<ILeaveStats> {
        const { startDate, endDate } = filters || {};

        const matchStage: any = {};
        if (startDate) matchStage.$gte = startDate;
        if (endDate) matchStage.$lte = endDate;

        const dateFilter = Object.keys(matchStage).length > 0 ? { startDate: matchStage } : {};

        // Get leave counts using aggregation
        const leaveResult = await LeaveModel.model.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalLeaves: { $sum: 1 },
                    pendingLeaves: {
                        $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
                    },
                    approvedLeaves: {
                        $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] },
                    },
                    rejectedLeaves: {
                        $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] },
                    },
                },
            },
        ]);

        const leave = leaveResult[0] || {
            totalLeaves: 0,
            pendingLeaves: 0,
            approvedLeaves: 0,
            rejectedLeaves: 0,
        };

        // Get leave by type
        const leaveByTypeResult = await LeaveModel.model.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                },
            },
        ]);

        const leaveByType = leaveByTypeResult.reduce((acc: Record<string, number>, item: any) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);

        // Get monthly trend
        const monthlyTrend = await LeaveModel.model.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        month: { $dateToString: { format: '%Y-%m', date: '$startDate' } },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { '_id.month': 1 },
            },
        ]);

        return {
            totalLeaves: leave.totalLeaves,
            pendingLeaves: leave.pendingLeaves,
            approvedLeaves: leave.approvedLeaves,
            rejectedLeaves: leave.rejectedLeaves,
            leaveByType,
            monthlyTrend: monthlyTrend.map((item: any) => ({
                month: item._id.month,
                count: item.count,
            })),
        };
    },

    async getLowAttendanceAlerts(filters?: {
        threshold?: number;
        page?: number;
        limit?: number;
    }): Promise<Array<{
        studentId: string;
        studentName: string;
        attendancePercentage: number;
        threshold: number;
    }>> {
        const { threshold = 75, page = 1, limit = 10 } = filters || {};

        // Aggregation to find students with low attendance
        const lowAttendanceStudents = await AttendanceModel.model.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalClasses: { $sum: 1 },
                    presentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
                    },
                },
            },
            {
                $addFields: {
                    attendancePercentage: {
                        $multiply: [
                            { $divide: ['$presentCount', '$totalClasses'] },
                            100,
                        ],
                    },
                },
            },
            {
                $match: {
                    attendancePercentage: { $lt: threshold },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            { $sort: { attendancePercentage: 1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);

        return lowAttendanceStudents.map((student: any) => ({
            studentId: student._id?.toString(),
            studentName: student.user?.name || 'Unknown',
            attendancePercentage: Number(student.attendancePercentage.toFixed(2)),
            threshold,
        }));
    },

    async getRecentReports(limit: number = 5): Promise<Array<{
        id: string;
        title: string;
        type: string;
        createdAt: Date;
    }>> {
        // Since we don't store reports in the database, we'll return empty array
        return [];
    },

    async getAttendanceReport(filters: {
        reportType: string;
        startDate?: Date;
        endDate?: Date;
        departmentIds?: string[];
        batchIds?: string[];
        courseIds?: string[];
    }): Promise<IAttendanceReportData> {
        const { startDate, endDate } = filters;

        // Get overall attendance stats for the summary
        const stats = await this.getAttendanceStats({
            startDate,
            endDate,
        });

        // Get trend data (last 30 days)
        const trend = stats.monthlyBreakdown?.map(item => ({
            date: item.month + "-01",
            percentage: Math.round((item.present / (item.present + item.absent + item.late + item.excused || 1)) * 100),
            present: item.present,
            absent: item.absent,
            late: item.late,
            excused: item.excused,
        })) || [];

        // Return the report data
        return {
            summary: {
                totalClasses: stats.totalClasses,
                averagePercentage: stats.attendancePercentage,
                totalPresent: stats.presentCount,
                totalAbsent: stats.absentCount,
                totalLate: stats.lateCount,
                totalExcused: stats.excusedCount,
            },
            trend,
            byDepartment: [], // To be implemented with proper aggregation
            statusDistribution: {
                present: stats.presentCount,
                absent: stats.absentCount,
                late: stats.lateCount,
                excused: stats.excusedCount,
            },
            topStudents: [], // To be implemented
            bottomStudents: [], // To be implemented
            detailedData: [], // To be implemented
        };
    },
};

export default DashboardService;
