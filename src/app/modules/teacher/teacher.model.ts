import prisma from '../../config/prisma';

// Teacher model operations
export const TeacherModel = {
    // Create a new teacher profile
    create: async (data: any) => {
        return await prisma.teacher.create({
            data,
            include: {
                department: true,
            },
        });
    },

    // Find teacher by ID
    findById: async (id: string) => {
        return await prisma.teacher.findUnique({
            where: { id },
            include: {
                department: true,
                courses: {
                    include: {
                        batch: true,
                        department: true,
                    },
                },
            },
        });
    },

    // Find teacher by user ID
    findByUserId: async (userId: string) => {
        return await prisma.teacher.findUnique({
            where: { userId },
            include: {
                department: true,
                courses: {
                    include: {
                        batch: true,
                        department: true,
                    },
                },
            },
        });
    },

    // Find teacher by employee ID
    findByEmployeeId: async (employeeId: string) => {
        return await prisma.teacher.findUnique({
            where: { employeeId },
            include: {
                user: true,
                department: true,
            },
        });
    },

    // Get all teachers with optional filters
    findMany: async (filters: any = {}) => {
        const { departmentId, designation, specialization, isActive, status, search } = filters;

        const where: any = {};

        if (departmentId) where.departmentId = departmentId;
        if (designation) where.designation = { contains: designation, mode: 'insensitive' };
        if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };
        if (status === 'active') {
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        } else if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { employeeId: { contains: search, mode: 'insensitive' } },
            ];
        }

        return await prisma.teacher.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                department: true,
            },
        });
    },

    // Update teacher profile
    update: async (id: string, data: any) => {
        return await prisma.teacher.update({
            where: { id },
            data,
            include: {
                department: true,
            },
        });
    },

    // Delete teacher profile
    delete: async (id: string) => {
        return await prisma.teacher.delete({
            where: { id },
        });
    },

    // Get teacher statistics
    getStats: async () => {
        const totalTeachers = await prisma.teacher.count();
        const activeTeachers = await prisma.teacher.count({ where: { user: { status: 'ACTIVE' } } });
        const inactiveTeachers = await prisma.teacher.count({ where: { user: { status: 'INACTIVE' } } });

        const teachersByDepartment = await prisma.teacher.groupBy({
            by: ['departmentId'],
            _count: { _all: true },
        });

        const teachersByDesignation = await prisma.teacher.groupBy({
            by: ['designation'],
            _count: { _all: true },
        });

        // Get department names
        const departments = await prisma.department.findMany({
            where: { id: { in: teachersByDepartment.map(d => d.departmentId).filter(Boolean) as string[] } },
            select: { id: true, name: true }
        });

        // Transform teachersByDepartment to array
        const teachersByDepartmentArray = teachersByDepartment.map(d => {
            const department = departments.find(dept => dept.id === d.departmentId);
            return {
                departmentId: d.departmentId || 'unknown',
                departmentName: department?.name || 'Unknown',
                count: d._count._all,
                percentage: totalTeachers > 0 ? (d._count._all / totalTeachers) * 100 : 0
            };
        });

        // Transform teachersByDesignation to array
        const teachersByDesignationArray = teachersByDesignation.map(d => ({
            designation: d.designation || 'Unknown',
            count: d._count._all,
            percentage: totalTeachers > 0 ? (d._count._all / totalTeachers) * 100 : 0
        }));

        return {
            totalTeachers,
            activeTeachers,
            inactiveTeachers,
            teachersByDepartment: teachersByDepartmentArray,
            teachersByDesignation: teachersByDesignationArray,
        };
    },
};

// Class Schedule model operations
export const ClassScheduleModel = {
    // Create a new class schedule
    create: async (data: any) => {
        return await prisma.classSchedule.create({
            data,
            include: {
                course: true,
                batch: true,
            },
        });
    },

    // Find schedule by ID
    findById: async (id: string) => {
        return await prisma.classSchedule.findUnique({
            where: { id },
            include: {
                course: true,
                batch: true,
            },
        });
    },

    // Get schedules by teacher ID
    findByTeacherId: async (teacherId: string) => {
        return await prisma.classSchedule.findMany({
            where: { teacherId, isActive: true },
            include: {
                course: true,
                batch: true,
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' },
            ],
        });
    },

    // Get schedules by course ID
    findByCourseId: async (courseId: string) => {
        return await prisma.classSchedule.findMany({
            where: { courseId, isActive: true },
            include: {
                teacher: true,
                batch: true,
            },
        });
    },

    // Get today's schedule for a teacher
    getTodaySchedule: async (teacherId: string) => {
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayOfWeek = today === 0 ? 7 : today; // Convert Sunday to 7

        return await prisma.classSchedule.findMany({
            where: {
                teacherId,
                dayOfWeek,
                isActive: true,
            },
            include: {
                course: true,
                batch: true,
            },
            orderBy: { startTime: 'asc' },
        });
    },

    // Update class schedule
    update: async (id: string, data: any) => {
        return await prisma.classSchedule.update({
            where: { id },
            data,
            include: {
                course: true,
                batch: true,
            },
        });
    },

    // Delete class schedule
    delete: async (id: string) => {
        return await prisma.classSchedule.delete({
            where: { id },
        });
    },
};

// Subject model operations
export const SubjectModel = {
    // Create a new subject
    create: async (data: any) => {
        return await prisma.subject.create({
            data,
            include: {
                department: true,
            },
        });
    },

    // Find subject by ID
    findById: async (id: string) => {
        return await prisma.subject.findUnique({
            where: { id },
            include: {
                department: true,
                courses: true,
            },
        });
    },

    // Get all subjects with optional filters
    findMany: async (filters: any = {}) => {
        const { departmentId, isActive, search } = filters;

        const where: any = {};

        if (departmentId) where.departmentId = departmentId;
        if (isActive !== undefined) where.isActive = isActive;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        return await prisma.subject.findMany({
            where,
            include: {
                department: true,
            },
        });
    },

    // Update subject
    update: async (id: string, data: any) => {
        return await prisma.subject.update({
            where: { id },
            data,
            include: {
                department: true,
            },
        });
    },

    // Delete subject
    delete: async (id: string) => {
        return await prisma.subject.delete({
            where: { id },
        });
    },
};


// Attendance model operations for teachers
export const TeacherAttendanceModel = {
    // Mark attendance for a student
    markAttendance: async (data: any) => {
        const { studentId, courseId, date, status, checkIn, checkOut, notes, markedBy } = data;

        return await prisma.attendance.upsert({
            where: {
                userId_courseId_date: {
                    userId: studentId,
                    courseId,
                    date: new Date(date),
                },
            },
            update: {
                status,
                checkIn: checkIn ? new Date(checkIn) : null,
                checkOut: checkOut ? new Date(checkOut) : null,
                notes,
                markedBy,
            },
            create: {
                userId: studentId,
                courseId,
                date: new Date(date),
                status,
                checkIn: checkIn ? new Date(checkIn) : null,
                checkOut: checkOut ? new Date(checkOut) : null,
                notes,
                markedBy,
            },
            include: {
                course: true,
                marker: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    },

    // Bulk mark attendance
    bulkMarkAttendance: async (courseId: string, date: Date, attendances: any[], markedBy: string) => {
        const results = [];

        for (const attendance of attendances) {
            const result = await prisma.attendance.upsert({
                where: {
                    userId_courseId_date: {
                        userId: attendance.studentId,
                        courseId,
                        date: new Date(date),
                    },
                },
                update: {
                    status: attendance.status,
                    checkIn: attendance.checkIn ? new Date(attendance.checkIn) : null,
                    checkOut: attendance.checkOut ? new Date(attendance.checkOut) : null,
                    notes: attendance.notes,
                    markedBy,
                },
                create: {
                    userId: attendance.studentId,
                    courseId,
                    date: new Date(date),
                    status: attendance.status,
                    checkIn: attendance.checkIn ? new Date(attendance.checkIn) : null,
                    checkOut: attendance.checkOut ? new Date(attendance.checkOut) : null,
                    notes: attendance.notes,
                    markedBy,
                },
                include: {
                    user: true,
                    course: true,
                },
            });

            results.push(result);
        }

        return results;
    },

    // Get attendance records for a course
    getCourseAttendance: async (courseId: string, filters: any = {}) => {
        const { startDate, endDate, status } = filters;

        const where: any = { courseId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        if (status) where.status = status;

        return await prisma.attendance.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                course: true,
                marker: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: [
                { date: 'desc' },
                { user: { name: 'asc' } },
            ],
        });
    },

    // Get attendance summary for a course
    getCourseAttendanceSummary: async (courseId: string, startDate?: Date, endDate?: Date) => {
        const where: any = { courseId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }

        const attendances = await prisma.attendance.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true },
                },
            },
        });

        // Calculate statistics
        const totalClasses = new Set(attendances.map((a: any) => a.date.toISOString())).size;
        const statusCounts = attendances.reduce((acc: Record<string, number>, attendance: any) => {
            acc[attendance.status] = (acc[attendance.status] || 0) + 1;
            return acc;
        }, {});

        // Group by student
        const studentBreakdown = attendances.reduce((acc: Record<string, any>, attendance: any) => {
            const studentId = attendance.userId;
            if (!acc[studentId]) {
                acc[studentId] = {
                    studentId,
                    name: attendance.user.name,
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                };
            }

            acc[studentId].total++;
            acc[studentId][attendance.status.toLowerCase()]++;

            return acc;
        }, {});

        // Calculate attendance percentage for each student
        const studentStats = Object.values(studentBreakdown).map((student: any) => ({
            studentId: student.studentId,
            name: student.name,
            attendancePercentage: totalClasses > 0 ? (student.present / totalClasses) * 100 : 0,
        }));

        return {
            courseId,
            totalClasses,
            presentCount: statusCounts.PRESENT || 0,
            absentCount: statusCounts.ABSENT || 0,
            lateCount: statusCounts.LATE || 0,
            excusedCount: statusCounts.EXCUSED || 0,
            attendancePercentage: totalClasses > 0 ? ((statusCounts.PRESENT || 0) / (totalClasses * Object.keys(studentBreakdown).length)) * 100 : 0,
            studentBreakdown: studentStats,
        };
    },
};

// Leave model operations for teachers
export const TeacherLeaveModel = {
    // Get pending leave requests for teacher approval
    getPendingLeaves: async (teacherId: string) => {
        return await prisma.leaveRequest.findMany({
            where: {
                status: 'PENDING',
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    },

    // Approve or reject leave request
    processLeaveRequest: async (leaveId: string, status: 'APPROVED' | 'REJECTED', approvedBy: string, rejectionReason?: string) => {
        return await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status,
                approvedBy,
                approvedAt: new Date(),
                rejectionReason,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                approver: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    },

    // Get leave requests processed by a teacher
    getProcessedLeaves: async (teacherId: string) => {
        return await prisma.leaveRequest.findMany({
            where: { approvedBy: teacherId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { approvedAt: 'desc' },
        });
    },
};
