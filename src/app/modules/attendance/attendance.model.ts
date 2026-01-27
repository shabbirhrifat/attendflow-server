import prisma from '../../config/prisma';
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
    AttendanceStatus
} from './attendance.interface';

// Attendance model operations
export const AttendanceModel = {
    // Create a new attendance record
    create: async (data: IAttendanceCreate) => {
        return await prisma.attendance.create({
            data: {
                userId: data.userId,
                courseId: data.courseId,
                date: data.date,
                status: data.status,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                notes: data.notes,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                course: {
                    select: { id: true, title: true, code: true },
                },
            },
        });
    },

    // Find attendance by ID
    findById: async (id: string) => {
        return await prisma.attendance.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                course: {
                    select: { id: true, title: true, code: true },
                },
            },
        });
    },

    // Find attendance by user, course, and date
    findByUserCourseDate: async (userId: string, courseId: string, date: Date) => {
        return await prisma.attendance.findUnique({
            where: {
                userId_courseId_date: {
                    userId,
                    courseId,
                    date: new Date(date),
                },
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                course: {
                    select: { id: true, title: true, code: true },
                },
            },
        });
    },

    // Get attendance records with filters
    findMany: async (filters: IAttendanceFilters) => {
        const { courseId, userId, status, startDate, endDate, page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc', sort } = filters;
        
        // Handle sort parameter format: "-createdAt" or "createdAt"
        let actualSortBy = sortBy;
        let actualSortOrder = sortOrder;
        
        if (sort) {
            if (sort.startsWith('-')) {
                actualSortBy = sort.substring(1);
                actualSortOrder = 'desc';
            } else {
                actualSortBy = sort;
                actualSortOrder = 'asc';
            }
        }

        const where: any = {};

        if (courseId) where.courseId = courseId;
        if (userId) where.userId = userId;
        if (status) where.status = status;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const numericPage = typeof page === 'string' ? parseInt(page, 10) : page;
        const numericLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        const skip = (numericPage - 1) * numericLimit;

        const [attendances, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    course: {
                        select: { id: true, title: true, code: true },
                    },
                },
                orderBy: { [actualSortBy]: actualSortOrder },
                skip,
                take: numericLimit,
            }),
            prisma.attendance.count({ where }),
        ]);

        return {
            data: attendances,
            meta: {
                page: numericPage,
                limit: numericLimit,
                total,
                totalPages: Math.ceil(total / numericLimit),
            },
        };
    },

    // Update attendance record
    update: async (id: string, data: IAttendanceUpdate) => {
        return await prisma.attendance.update({
            where: { id },
            data,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                course: {
                    select: { id: true, title: true, code: true },
                },
            },
        });
    },

    // Delete attendance record
    delete: async (id: string) => {
        return await prisma.attendance.delete({
            where: { id },
        });
    },

    // Bulk mark attendance
    bulkMark: async (data: IBulkAttendanceCreate) => {
        const { courseId, date, attendances, markedBy } = data;
        const results = [];

        for (const attendance of attendances) {
            const result = await prisma.attendance.upsert({
                where: {
                    userId_courseId_date: {
                        userId: attendance.userId,
                        courseId,
                        date: new Date(date),
                    },
                },
                update: {
                    status: attendance.status,
                    notes: attendance.notes,
                },
                create: {
                    userId: attendance.userId,
                    courseId,
                    date: new Date(date),
                    status: attendance.status,
                    notes: attendance.notes,
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    course: {
                        select: { id: true, title: true, code: true },
                    },
                },
            });

            results.push(result);
        }

        return results;
    },

    // Get attendance summary for a course
    getCourseSummary: async (courseId: string, startDate?: Date, endDate?: Date): Promise<IAttendanceSummary> => {
        const where: any = { courseId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }

        const [
            totalClasses,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
        ] = await Promise.all([
            prisma.attendance.count({ where }),
            prisma.attendance.count({ where: { ...where, status: 'PRESENT' } }),
            prisma.attendance.count({ where: { ...where, status: 'ABSENT' } }),
            prisma.attendance.count({ where: { ...where, status: 'LATE' } }),
            prisma.attendance.count({ where: { ...where, status: 'EXCUSED' } }),
        ]);

        const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

        // Get monthly breakdown (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as month,
                status,
                COUNT(*) as count
            FROM attendances 
            WHERE courseId = ${courseId}
                AND date >= ${sixMonthsAgo}
            GROUP BY TO_CHAR(date, 'YYYY-MM'), status
            ORDER BY month
        ` as { month: string; status: string; count: bigint }[];

        // Process monthly data
        const monthlyBreakdown = monthlyData.reduce((acc: any, item) => {
            const existingMonth = acc.find((m: any) => m.month === item.month);

            if (existingMonth) {
                existingMonth[item.status.toLowerCase() as string] = Number(item.count);
            } else {
                acc.push({
                    month: item.month,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    [item.status.toLowerCase()]: Number(item.count),
                });
            }

            return acc;
        }, []);

        return {
            totalClasses,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
            attendancePercentage,
            monthlyBreakdown,
        };
    },

    // Get attendance summary for a student
    getStudentSummary: async (userId: string, startDate?: Date, endDate?: Date): Promise<IAttendanceSummary> => {
        const where: any = { userId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }

        const [
            totalClasses,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
        ] = await Promise.all([
            prisma.attendance.count({ where }),
            prisma.attendance.count({ where: { ...where, status: 'PRESENT' } }),
            prisma.attendance.count({ where: { ...where, status: 'ABSENT' } }),
            prisma.attendance.count({ where: { ...where, status: 'LATE' } }),
            prisma.attendance.count({ where: { ...where, status: 'EXCUSED' } }),
        ]);

        const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

        // Get monthly breakdown (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await prisma.$queryRaw`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as month,
                status,
                COUNT(*) as count
            FROM attendances 
            WHERE userId = ${userId}
                AND date >= ${sixMonthsAgo}
            GROUP BY TO_CHAR(date, 'YYYY-MM'), status
            ORDER BY month
        ` as { month: string; status: string; count: bigint }[];

        // Process monthly data
        const monthlyBreakdown = monthlyData.reduce((acc: any, item) => {
            const existingMonth = acc.find((m: any) => m.month === item.month);

            if (existingMonth) {
                existingMonth[item.status.toLowerCase() as string] = Number(item.count);
            } else {
                acc.push({
                    month: item.month,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    [item.status.toLowerCase()]: Number(item.count),
                });
            }

            return acc;
        }, []);

        return {
            totalClasses,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
            attendancePercentage,
            monthlyBreakdown,
        };
    },
};

// Attendance Session model operations
export const AttendanceSessionModel = {
    // Create a new attendance session
    create: async (data: IAttendanceSessionCreate) => {
        return await prisma.attendanceSession.create({
            data: {
                courseId: data.courseId,
                teacherId: data.teacherId,
                date: data.startTime,
                startTime: data.startTime,
                endTime: data.endTime,
                location: data.location,
                notes: data.notes,
                isActive: true,
            },
            include: {
                course: true,
                teacher: true,
            },
        });
    },

    // Find attendance session by ID
    findById: async (id: string) => {
        return await prisma.attendanceSession.findUnique({
            where: { id },
            include: {
                course: true,
                teacher: true,
            },
        });
    },

    // Update attendance session
    update: async (id: string, data: Partial<IAttendanceSessionCreate>) => {
        return await prisma.attendanceSession.update({
            where: { id },
            data,
            include: {
                course: true,
                teacher: true,
            },
        });
    },

    // Delete attendance session
    delete: async (id: string) => {
        return await prisma.attendanceSession.delete({
            where: { id },
        });
    },
};

export default AttendanceModel;
