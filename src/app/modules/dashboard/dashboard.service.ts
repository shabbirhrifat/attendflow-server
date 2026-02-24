import {
    IDashboardOverview,
    IClassLevelStats,
    ISubjectLevelStats,
    ITeacherPerformanceData,
    IAttendanceStats,
    ILeaveStats,
    IAttendanceReportData,
} from './dashboard.interface';
import prisma from '../../config/prisma';
import { AttendanceModel } from '../attendance/attendance.model';
import { StudentModel } from '../student/student.model';
import { TeacherModel } from '../teacher/teacher.model';

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
            prisma.student.count({
                where: batchId ? { batchId } : {},
            }),
            prisma.teacher.count({
                where: departmentId ? { departmentId } : {},
            }),
            prisma.course.count({
                where: {
                    ...(batchId && { batchId }),
                },
            }),
            prisma.department.count({
                where: departmentId ? { id: departmentId } : {},
            }),
            prisma.batch.count({
                where: batchId ? { id: batchId } : {},
            }),
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
        const { courseId, batchId, departmentId, startDate, endDate, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = filters || {};

        let whereClause = '1=1';
        const params: any[] = [];

        if (courseId) {
            whereClause += ` AND c.id = $${params.length + 1}`;
            params.push(courseId);
        }
        if (batchId) {
            whereClause += ` AND b.id = $${params.length + 1}`;
            params.push(batchId);
        }
        if (departmentId) {
            whereClause += ` AND d.id = $${params.length + 1}`;
            params.push(departmentId);
        }

        const offset = (page - 1) * limit;

        // Get courses with related data
        const coursesQuery = `
            SELECT 
                c.id as courseId,
                c.title as courseName,
                c.code as courseCode,
                b.id as batchId,
                b.name as batchName,
                COUNT(DISTINCT ce.user_id) as totalStudents,
                AVG(CASE WHEN a.status = 'PRESENT' THEN 100 ELSE 0 END) as averageAttendance
            FROM courses c
            JOIN batches b ON c.batch_id = b.id
            JOIN course_enrollments ce ON c.id = ce.course_id
            LEFT JOIN attendances a ON ce.user_id = a.user_id AND c.id = a.course_id
            ${startDate || endDate ? `WHERE (a.date >= $${params.length + 1} AND a.date <= $${params.length + 2})` : ''}
            ${startDate ? params.push(startDate) : ''}
            ${endDate ? params.push(endDate) : ''}
            ${whereClause}
            GROUP BY c.id, c.title, c.code, b.id, b.name
            ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const courses = await prisma.$queryRawUnsafe(coursesQuery, ...params) as any[];

        // Process attendance distribution for each course
        const coursesWithDistribution = await Promise.all(courses.map(async (course: any) => {
            const attendanceDistributionQuery = `
                SELECT 
                    COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
                    COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
                    COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late,
                    COUNT(CASE WHEN status = 'EXCUSED' THEN 1 END) as excused
                FROM attendances
                WHERE course_id = $1
                GROUP BY status
            `;

            const distributionResult = await prisma.$queryRawUnsafe(attendanceDistributionQuery, course.courseId) as any[];
            const distribution = distributionResult.reduce((acc: any, item: any) => {
                acc[item.status.toLowerCase()] = Number(item.count);
                return acc;
            }, { present: 0, absent: 0, late: 0, excused: 0 });

            const totalClasses = Object.values(distribution).reduce((sum: number, count: any) => sum + Number(count), 0);
            const attendanceRate = totalClasses > 0 ? (Number(distribution.present) / totalClasses) * 100 : 0;

            // Get monthly trend
            const monthlyTrendQuery = `
                SELECT 
                    TO_CHAR(date, 'YYYY-MM') as month,
                    AVG(CASE WHEN status = 'PRESENT' THEN 100 ELSE 0 END) as attendanceRate
                FROM attendances
                WHERE course_id = $1
                    ${startDate || endDate ? `AND (date >= $${params.length + 1} AND date <= $${params.length + 2})` : ''}
                GROUP BY TO_CHAR(date, 'YYYY-MM')
                ORDER BY month
                LIMIT 6
            `;

            const monthlyTrendParams = [course.courseId];
            if (startDate) monthlyTrendParams.push(startDate);
            if (endDate) monthlyTrendParams.push(endDate);

            const monthlyTrend = await prisma.$queryRawUnsafe(monthlyTrendQuery, ...monthlyTrendParams) as any[];

            return {
                courseId: course.courseId,
                courseName: course.courseName,
                batchId: course.batchId,
                batchName: course.batchName,
                totalStudents: Number(course.totalStudents),
                averageAttendance: Number(Number(course.averageAttendance).toFixed(2)),
                attendanceDistribution: {
                    above90: attendanceRate >= 90 ? 1 : 0,
                    between75And90: attendanceRate >= 75 && attendanceRate < 90 ? 1 : 0,
                    between60And75: attendanceRate >= 60 && attendanceRate < 75 ? 1 : 0,
                    below60: attendanceRate < 60 ? 1 : 0,
                },
                monthlyTrend: monthlyTrend.map((item: any) => ({
                    month: item.month,
                    attendanceRate: Number(Number(item.attendancerate).toFixed(2)),
                })),
            };
        }));

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
        const { subjectId, batchId, departmentId, startDate, endDate, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = filters || {};

        let whereClause = '1=1';
        const params: any[] = [];

        if (subjectId) {
            whereClause += ` AND s.id = $${params.length + 1}`;
            params.push(subjectId);
        }
        if (batchId) {
            whereClause += ` AND b.id = $${params.length + 1}`;
            params.push(batchId);
        }
        if (departmentId) {
            whereClause += ` AND d.id = $${params.length + 1}`;
            params.push(departmentId);
        }

        const offset = (page - 1) * limit;

        // Get subjects with related data
        const subjectsQuery = `
            SELECT 
                s.id as subjectId,
                s.name as subjectName,
                s.code as subjectCode,
                d.id as departmentId,
                d.name as departmentName,
                COUNT(DISTINCT c.id) as totalCourses,
                COUNT(DISTINCT ce.user_id) as totalStudents,
                AVG(CASE WHEN a.status = 'PRESENT' THEN 100 ELSE 0 END) as averageAttendance,
                AVG(CASE WHEN gpa IS NOT NULL THEN gpa ELSE 0 END) as averagePerformance
            FROM subjects s
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN courses c ON s.id = c.subject_id
            LEFT JOIN course_enrollments ce ON c.id = ce.course_id
            LEFT JOIN attendances a ON ce.user_id = a.user_id AND c.id = a.course_id
            LEFT JOIN students st ON ce.user_id = st.user_id
            ${whereClause}
            GROUP BY s.id, s.name, s.code, d.id, d.name
            ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const subjects = await prisma.$queryRawUnsafe(subjectsQuery, ...params) as any[];

        // Process data for each subject
        const subjectsWithData = await Promise.all(subjects.map(async (subject: any) => {
            // Get top performing courses for this subject
            const topCoursesQuery = `
                SELECT 
                    c.id as courseId,
                    c.title as courseName,
                    AVG(CASE WHEN a.status = 'PRESENT' THEN 100 ELSE 0 END) as attendanceRate
                FROM courses c
                JOIN attendances a ON c.id = a.course_id
                WHERE c.subject_id = $1
                GROUP BY c.id, c.title
                ORDER BY attendanceRate DESC
                LIMIT 3
            `;

            const topCourses = await prisma.$queryRawUnsafe(topCoursesQuery, subject.subjectId) as any[];

            return {
                subjectId: subject.subjectId,
                subjectName: subject.subjectName,
                departmentId: subject.departmentId,
                departmentName: subject.departmentName,
                totalCourses: Number(subject.totalCourses),
                totalStudents: Number(subject.totalStudents),
                averageAttendance: Number(Number(subject.averageattendance).toFixed(2)),
                averagePerformance: Number(Number(subject.averageperformance).toFixed(2)),
                topPerformingCourses: topCourses.map((course: any) => ({
                    courseId: course.courseId,
                    courseName: course.coursename,
                    attendanceRate: Number(Number(course.attendancerate).toFixed(2)),
                })),
            };
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
        const { teacherId, courseId, batchId, departmentId, startDate, endDate, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = filters || {};

        let whereClause = '1=1';
        const params: any[] = [];

        if (teacherId) {
            whereClause += ` AND t.id = $${params.length + 1}`;
            params.push(teacherId);
        }
        if (courseId) {
            whereClause += ` AND c.id = $${params.length + 1}`;
            params.push(courseId);
        }
        if (batchId) {
            whereClause += ` AND b.id = $${params.length + 1}`;
            params.push(batchId);
        }
        if (departmentId) {
            whereClause += ` AND d.id = $${params.length + 1}`;
            params.push(departmentId);
        }

        const offset = (page - 1) * limit;

        // Get teachers with performance data
        const teachersQuery = `
            SELECT 
                t.id as teacherId,
                u.name as teacherName,
                d.id as departmentId,
                d.name as departmentName,
                COUNT(DISTINCT c.id) as totalCourses,
                COUNT(DISTINCT ce.user_id) as totalStudents,
                AVG(CASE WHEN a.status = 'PRESENT' THEN 100 ELSE 0 END) as averageAttendance,
                AVG(CASE WHEN st.gpa IS NOT NULL THEN st.gpa ELSE 0 END) as studentPerformance,
                COUNT(DISTINCT a.id) / COUNT(DISTINCT c.id) as attendanceMarkingConsistency,
                COUNT(CASE WHEN lr.status = 'APPROVED' THEN 1 ELSE 0 END) / COUNT(DISTINCT lr.id) as leaveApprovalRate
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN courses c ON t.id = c.teacher_id
            LEFT JOIN course_enrollments ce ON c.id = ce.course_id
            LEFT JOIN attendances a ON ce.user_id = a.user_id AND c.id = a.course_id
            LEFT JOIN students st ON ce.user_id = st.user_id
            LEFT JOIN leave_requests lr ON t.id = lr.teacher_id
            ${whereClause}
            GROUP BY t.id, u.name, d.id, d.name
            ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
            LIMIT ${limit} OFFSET ${offset}
        `;

        const teachers = await prisma.$queryRawUnsafe(teachersQuery, ...params) as any[];

        // Process monthly performance for each teacher
        const teachersWithMonthlyData = await Promise.all(teachers.map(async (teacher: any) => {
            // Get monthly performance trend
            const monthlyTrendQuery = `
                SELECT 
                    TO_CHAR(a.date, 'YYYY-MM') as month,
                    AVG(CASE WHEN a.status = 'PRESENT' THEN 100 ELSE 0 END) as attendanceRate,
                    AVG(CASE WHEN st.gpa IS NOT NULL THEN st.gpa ELSE 0 END) as performanceScore
                FROM attendances a
                JOIN course_enrollments ce ON a.course_id = ce.course_id
                JOIN courses c ON ce.course_id = c.id AND c.teacher_id = $1
                JOIN students st ON ce.user_id = st.user_id
                WHERE a.date >= $1 AND a.date <= $2
                GROUP BY TO_CHAR(a.date, 'YYYY-MM')
                ORDER BY month
                LIMIT 6
            `;

            const monthlyTrendParams = [teacher.teacherId];
            if (startDate) monthlyTrendParams.push(startDate);
            if (endDate) monthlyTrendParams.push(endDate);

            const monthlyTrend = await prisma.$queryRawUnsafe(monthlyTrendQuery, ...monthlyTrendParams) as any[];

            return {
                teacherId: teacher.teacherId,
                teacherName: teacher.teachername,
                departmentId: teacher.departmentId,
                departmentName: teacher.departmentname,
                totalCourses: Number(teacher.totalcourses),
                totalStudents: Number(teacher.totalstudents),
                averageAttendance: Number(Number(teacher.averageattendance).toFixed(2)),
                studentPerformance: Number(Number(teacher.studentperformance).toFixed(2)),
                attendanceMarkingConsistency: Number(Number(teacher.attendancemarkingconsistency).toFixed(2)),
                leaveApprovalRate: Number(Number(teacher.leaveapprovalrate).toFixed(2)),
                monthlyPerformance: monthlyTrend.map((item: any) => ({
                    month: item.month,
                    attendanceRate: Number(Number(item.attendancerate).toFixed(2)),
                    performanceScore: Number(Number(item.performancescore).toFixed(2)),
                })),
            };
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
        const { startDate, endDate, departmentId, batchId } = filters || {};

        let whereClause = '1=1';
        const params: any[] = [];

        if (startDate) {
            whereClause += ` AND date >= $${params.length + 1}`;
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ` AND date <= $${params.length + 1}`;
            params.push(endDate);
        }

        // Get attendance counts
        const attendanceQuery = `
            SELECT 
                COUNT(*) as totalClasses,
                COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as presentCount,
                COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absentCount,
                COUNT(CASE WHEN status = 'LATE' THEN 1 END) as lateCount,
                COUNT(CASE WHEN status = 'EXCUSED' THEN 1 END) as excusedCount
            FROM attendances a
            WHERE ${whereClause}
        `;

        const attendanceResult = await prisma.$queryRawUnsafe(attendanceQuery, ...params) as any[];
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
        const monthlyBreakdownQuery = `
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as month,
                status,
                COUNT(*) as count
            FROM attendances a
            WHERE ${whereClause}
            GROUP BY TO_CHAR(date, 'YYYY-MM'), status
            ORDER BY month
        `;

        const monthlyBreakdownParams = [...params];
        if (startDate) monthlyBreakdownParams.push(startDate);
        if (endDate) monthlyBreakdownParams.push(endDate);

        const monthlyData = await prisma.$queryRawUnsafe(monthlyBreakdownQuery, ...monthlyBreakdownParams) as any[];

        const monthlyBreakdown = monthlyData.reduce((acc: any[], item: any) => {
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
                    [item.status.toLowerCase() as string]: Number(item.count),
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
        const { startDate, endDate, departmentId, batchId } = filters || {};

        let whereClause = '1=1';
        const params: any[] = [];

        if (startDate) {
            whereClause += ` AND "startDate" >= $${params.length + 1}`;
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ` AND "startDate" <= $${params.length + 1}`;
            params.push(endDate);
        }

        // Get leave counts
        const leaveQuery = `
            SELECT 
                COUNT(*) as totalLeaves,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pendingLeaves,
                COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approvedLeaves,
                COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejectedLeaves
            FROM leave_requests l
            WHERE ${whereClause}
        `;

        const leaveResult = await prisma.$queryRawUnsafe(leaveQuery, ...params) as any[];
        const leave = leaveResult[0] || {
            totalLeaves: 0,
            pendingLeaves: 0,
            approvedLeaves: 0,
            rejectedLeaves: 0,
        };

        // Get leave by type
        const leaveByTypeQuery = `
            SELECT 
                type as leaveType,
                COUNT(*) as count
            FROM leave_requests l
            WHERE ${whereClause}
            GROUP BY type
        `;

        const leaveByTypeResult = await prisma.$queryRawUnsafe(leaveByTypeQuery, ...params) as any[];
        const leaveByType = leaveByTypeResult.reduce((acc: Record<string, number>, item: any) => {
            acc[item.leavetype] = Number(item.count);
            return acc;
        }, {});

        // Get monthly trend
        const monthlyTrendQuery = `
            SELECT
                TO_CHAR("startDate", 'YYYY-MM') as month,
                COUNT(*) as count
            FROM leave_requests l
            WHERE ${whereClause}
            GROUP BY TO_CHAR("startDate", 'YYYY-MM')
            ORDER BY month
        `;

        const monthlyTrendParams = [...params];
        if (startDate) monthlyTrendParams.push(startDate);
        if (endDate) monthlyTrendParams.push(endDate);

        const monthlyTrend = await prisma.$queryRawUnsafe(monthlyTrendQuery, ...monthlyTrendParams) as any[];

        return {
            totalLeaves: leave.totalLeaves,
            pendingLeaves: leave.pendingleaves,
            approvedLeaves: leave.approvedleaves,
            rejectedLeaves: leave.rejectedleaves,
            leaveByType,
            monthlyTrend: monthlyTrend.map((item: any) => ({
                month: item.month,
                count: Number(item.count),
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
        const offset = (page - 1) * limit;

        // Get students with low attendance
        const lowAttendanceQuery = `
            SELECT 
                st.id as studentId,
                u.name as studentName,
                COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0 / COUNT(*) as attendancePercentage
            FROM students st
            JOIN users u ON st.user_id = u.id
            LEFT JOIN attendances a ON st.user_id = a.user_id
            GROUP BY st.id, u.name
            HAVING COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0 / COUNT(*) < ${threshold}
            ORDER BY attendancePercentage ASC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const lowAttendanceStudents = await prisma.$queryRawUnsafe(lowAttendanceQuery) as any[];

        return lowAttendanceStudents.map((student: any) => ({
            studentId: student.studentid,
            studentName: student.studentname,
            attendancePercentage: Number(Number(student.attendancepercentage).toFixed(2)),
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
        const { startDate, endDate, departmentIds, batchIds, courseIds } = filters;

        // Get overall attendance stats for the summary
        const stats = await this.getAttendanceStats({
            startDate,
            endDate,
            departmentId: departmentIds?.[0], // Simplification for now
            batchId: batchIds?.[0],
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