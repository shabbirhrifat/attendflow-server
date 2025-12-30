import { StudentModel, BatchModel, DepartmentModel } from './student.model';
import {
    IStudentCreate,
    IStudentUpdate,
    IStudentWithUser,
    IStudentProfile,
    IStudentAttendanceView,
    IStudentLeaveRequest,
    IStudentProfileUpdate,
    IStudentFilters,
    IStudentAttendanceSummary,
    IStudentDashboard
} from './student.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/prisma';
import { generateStudentId, generateStudentUserId } from '../../utils/idGenerator';
import { hashInfo } from '../../utils/hashInfo';

/** Create a new Student profile */
const createStudent = async (data: IStudentCreate): Promise<IStudentWithUser> => {
    // Validate required fields
    if (!data.email) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required for all students');
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingEmail) {
        throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
    }

    // Generate user ID and create user if not provided
    let userId = data.userId;
    let user;

    if (userId) {
        // Check if user exists and has STUDENT role
        user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
        }

        if (user.role !== 'STUDENT') {
            throw new AppError(StatusCodes.BAD_REQUEST, 'User must have STUDENT role');
        }

        // Check if student profile already exists for this user
        const existingStudent = await StudentModel.findUnique({
            where: { userId },
        });

        if (existingStudent) {
            throw new AppError(StatusCodes.CONFLICT, 'Student profile already exists for this user');
        }
    } else {
        // Create new user with generated ID
        userId = generateStudentUserId(data.name);

        // Hash password before creating user
        const hashedPassword = await hashInfo(data.password || 'changeme123');

        user = await prisma.user.create({
            data: {
                id: userId,
                name: data.name,
                email: data.email, // Use provided email (REQUIRED)
                username: userId,
                password: hashedPassword, // Use hashed password
                role: 'STUDENT',
                status: 'ACTIVE',
                departmentId: data.departmentId, // Optional - can be null
            }
        });
    }

    // AUTO-GENERATE studentId (not provided by user)
    const studentId = await generateStudentId();

    // Validate batch exists (only if provided)
    if (data.batchId) {
        const batch = await BatchModel.findUnique({
            where: { id: data.batchId },
        });

        if (!batch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }
    }

    // Validate department exists (only if provided)
    if (data.departmentId) {
        const department = await DepartmentModel.findUnique({
            where: { id: data.departmentId },
        });

        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }
    }

    const student = await StudentModel.create({
        data: {
            userId,
            studentId, // Always auto-generated
            batchId: data.batchId, // Optional
            departmentId: data.departmentId, // Optional
            semester: data.semester || 1,
            gpa: data.gpa || 0.0,
            credits: data.credits || 0,
        },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return student;
};

/** Get a Student by ID */
const getStudentById = async (id: string): Promise<IStudentWithUser | null> => {
    const student = await StudentModel.findUnique({
        where: { id },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return student;
};

/** Get a Student by User ID */
const getStudentByUserId = async (userId: string): Promise<IStudentWithUser | null> => {
    const student = await StudentModel.findUnique({
        where: { userId },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return student;
};

/** Get all Students with query builder support */
const getAllStudents = async (query: any): Promise<{ data: IStudentWithUser[]; meta: any }> => {
    const queryBuilder = new QueryBuilder(query);

    // Build query with search, filter, sort, pagination, and field selection
    queryBuilder.search(['studentId']).filter().sort().paginate().fields();

    const queryOptions = queryBuilder.getQueryOptions();

    // Execute query
    const [students, total] = await Promise.all([
        StudentModel.findMany({
            where: {
                ...queryOptions.where,
                ...(query.batchId && query.batchId !== 'all' && { batchId: query.batchId }),
                ...(query.departmentId && query.departmentId !== 'all' && { departmentId: query.departmentId }),
                ...(query.semester && { semester: parseInt(query.semester) }),
                ...(() => {
                    let isActiveFilter;
                    if (query.status === 'active') {
                        isActiveFilter = true;
                    } else if (query.status === 'inactive') {
                        isActiveFilter = false;
                    } else if (query.isActive !== undefined) {
                        isActiveFilter = query.isActive === 'true';
                    }
                    return isActiveFilter !== undefined ? { isActive: isActiveFilter } : {};
                })(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        year: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        }),
        StudentModel.count({
            where: {
                ...queryOptions.where,
                ...(query.batchId && query.batchId !== 'all' && { batchId: query.batchId }),
                ...(query.departmentId && query.departmentId !== 'all' && { departmentId: query.departmentId }),
                ...(query.semester && { semester: parseInt(query.semester) }),
                ...(() => {
                    let isActiveFilter;
                    if (query.status === 'active') {
                        isActiveFilter = true;
                    } else if (query.status === 'inactive') {
                        isActiveFilter = false;
                    } else if (query.isActive !== undefined) {
                        isActiveFilter = query.isActive === 'true';
                    }
                    return isActiveFilter !== undefined ? { isActive: isActiveFilter } : {};
                })(),
            },
        }),
    ]);

    const meta = queryBuilder.getPaginationMeta(total);

    return {
        data: students as unknown as IStudentWithUser[],
        meta,
    };
};

/** Update a Student */
const updateStudent = async (id: string, data: IStudentUpdate): Promise<IStudentWithUser | null> => {
    // Check if student exists
    const existingStudent = await StudentModel.findUnique({
        where: { id },
    });

    if (!existingStudent) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // If batchId is being updated, check if it exists
    if (data.batchId && data.batchId !== existingStudent.batchId) {
        const batch = await BatchModel.findUnique({
            where: { id: data.batchId },
        });
        if (!batch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }
    }

    // If departmentId is being updated, check if it exists
    if (data.departmentId && data.departmentId !== existingStudent.departmentId) {
        const department = await DepartmentModel.findUnique({
            where: { id: data.departmentId },
        });
        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }
    }

    const updatedStudent = await StudentModel.update({
        where: { id },
        data: data as any,
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return updatedStudent;
};

/** Delete a Student */
const deleteStudent = async (id: string): Promise<void> => {
    // Check if student exists
    const existingStudent = await StudentModel.findUnique({
        where: { id },
    });

    if (!existingStudent) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    await StudentModel.delete({
        where: { id },
    });
};

/** Get Student Profile with complete information */
const getStudentProfile = async (id: string): Promise<IStudentProfile | null> => {
    const student = await StudentModel.findUnique({
        where: { id },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    if (!student) {
        return null;
    }

    // Get course enrollments
    const courseEnrollments = await prisma.courseEnrollment.findMany({
        where: {
            studentId: student.id,
        },
        select: {
            id: true,
        },
    });

    // Get attendance records
    const attendanceRecords = await prisma.attendance.findMany({
        where: {
            userId: student.userId,
        },
        select: {
            id: true,
        },
    });

    // Get leave records
    const leaves = await prisma.leaveRequest.findMany({
        where: {
            userId: student.userId,
        },
        select: {
            id: true,
            status: true,
        },
    });

    // Calculate statistics
    const totalCourses = courseEnrollments.length;
    const totalAttendances = attendanceRecords.length;
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter((leave: any) => leave.status === 'APPROVED').length;
    const pendingLeaves = leaves.filter((leave: any) => leave.status === 'PENDING').length;

    // Calculate attendance percentage
    let attendancePercentage = 0;
    if (totalAttendances > 0) {
        const presentAttendances = await prisma.attendance.count({
            where: {
                userId: student.userId,
                status: 'PRESENT',
            },
        });
        attendancePercentage = Math.round((presentAttendances / totalAttendances) * 100);
    }

    const studentProfile = student;

    return {
        ...studentProfile,
        totalCourses,
        totalAttendances,
        totalLeaves,
        attendancePercentage,
        approvedLeaves,
        pendingLeaves,
    } as IStudentProfile;
};

/** Get Student Attendance Records */
const getStudentAttendance = async (
    studentId: string,
    query: any
): Promise<{ data: IStudentAttendanceView[]; meta: any }> => {
    // Get student by ID
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    const queryBuilder = new QueryBuilder(query);
    queryBuilder.filter().sort().paginate();

    const queryOptions = queryBuilder.getQueryOptions();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
        userId: student.userId,
    };

    if (query.courseId) {
        whereClause.courseId = query.courseId;
    }

    if (query.status) {
        whereClause.status = query.status;
    }

    if (query.startDate && query.endDate) {
        whereClause.date = {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
        };
    }

    // Execute query
    const [attendances, total] = await Promise.all([
        prisma.attendance.findMany({
            where: whereClause,
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        code: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
            skip,
            take: limit,
        }),
        prisma.attendance.count({ where: whereClause }),
    ]);

    const meta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };

    return {
        data: attendances as IStudentAttendanceView[],
        meta,
    };
};

/** Get Student Attendance Summary */
const getStudentAttendanceSummary = async (studentId: string): Promise<IStudentAttendanceSummary> => {
    // Get student by ID
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Get attendance counts
    const [
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
    ] = await Promise.all([
        prisma.attendance.count({
            where: { userId: student.userId },
        }),
        prisma.attendance.count({
            where: { userId: student.userId, status: 'PRESENT' },
        }),
        prisma.attendance.count({
            where: { userId: student.userId, status: 'ABSENT' },
        }),
        prisma.attendance.count({
            where: { userId: student.userId, status: 'LATE' },
        }),
        prisma.attendance.count({
            where: { userId: student.userId, status: 'EXCUSED' },
        }),
    ]);

    const attendancePercentage = totalClasses > 0
        ? Math.round((presentCount / totalClasses) * 100)
        : 0;

    // Get monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      status,
      COUNT(*) as count
    FROM attendances 
    WHERE userId = ${student.userId} 
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
};

/** Submit Leave Request */
const submitLeaveRequest = async (
    studentId: string,
    leaveData: IStudentLeaveRequest
): Promise<any> => {
    // Get student by ID
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Check if there's an overlapping leave request
    const overlappingLeave = await prisma.leaveRequest.findFirst({
        where: {
            userId: student.userId,
            OR: [
                {
                    AND: [
                        { startDate: { lte: leaveData.startDate } },
                        { endDate: { gte: leaveData.startDate } },
                    ],
                },
                {
                    AND: [
                        { startDate: { lte: leaveData.endDate } },
                        { endDate: { gte: leaveData.endDate } },
                    ],
                },
                {
                    AND: [
                        { startDate: { gte: leaveData.startDate } },
                        { endDate: { lte: leaveData.endDate } },
                    ],
                },
            ],
            status: { in: ['PENDING', 'APPROVED'] },
        },
    });

    if (overlappingLeave) {
        throw new AppError(StatusCodes.CONFLICT, 'You already have a leave request for this period');
    }

    const leave = await prisma.leaveRequest.create({
        data: {
            userId: student.userId,
            startDate: leaveData.startDate,
            endDate: leaveData.endDate,
            reason: leaveData.reason,
            status: 'PENDING',
        },
    });

    return leave;
};

/** Update Student Profile */
const updateStudentProfile = async (
    studentId: string,
    data: IStudentProfileUpdate
): Promise<any> => {
    // Get student by ID
    const student = await StudentModel.findUnique({
        where: { id: studentId },
        include: {
            user: true,
        },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Note: Email update is handled separately through user management
    // For now, we'll only update the other profile fields

    // If username is being updated, check if it's already taken
    if (data.username && data.username !== student.user.username) {
        const usernameExists = await prisma.user.findUnique({
            where: { username: data.username },
        });
        if (usernameExists) {
            throw new AppError(StatusCodes.CONFLICT, 'Username already exists');
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: student.userId },
        data: data as any,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

/** Get Student Dashboard Data */
const getStudentDashboard = async (studentId: string): Promise<IStudentDashboard> => {
    // Get student profile
    const profile = await getStudentProfile(studentId);
    if (!profile) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Get recent attendance (last 10 records)
    const recentAttendance = await prisma.attendance.findMany({
        where: { userId: profile.user.id },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    code: true,
                },
            },
        },
        orderBy: {
            date: 'desc',
        },
        take: 10,
    });

    // Get upcoming classes (enrolled courses)
    const upcomingClasses = await prisma.courseEnrollment.findMany({
        where: {
            studentId: profile.id,
        },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    code: true,
                },
            },
        },
        take: 5,
    });

    // Get leave summary
    const [totalLeaves, approvedLeaves, pendingLeaves, rejectedLeaves] = await Promise.all([
        prisma.leaveRequest.count({
            where: { userId: profile.user.id },
        }),
        prisma.leaveRequest.count({
            where: { userId: profile.user.id, status: 'APPROVED' },
        }),
        prisma.leaveRequest.count({
            where: { userId: profile.user.id, status: 'PENDING' },
        }),
        prisma.leaveRequest.count({
            where: { userId: profile.user.id, status: 'REJECTED' },
        }),
    ]);

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
        where: { recipientId: profile.user.id },
        orderBy: {
            createdAt: 'desc',
        },
        take: 5,
    });

    return {
        profile,
        recentAttendance: recentAttendance as IStudentAttendanceView[],
        upcomingClasses: upcomingClasses.map(enrollment => ({
            id: enrollment.course.id,
            title: enrollment.course.title,
            code: enrollment.course.code,
            nextClass: new Date(), // This would be calculated based on course schedule
        })),
        leaveSummary: {
            total: totalLeaves,
            approved: approvedLeaves,
            pending: pendingLeaves,
            rejected: rejectedLeaves,
        },
        notifications: notifications.map(notification => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type.toString(),
            createdAt: notification.createdAt,
            isRead: notification.readStatus,
        })),
    };
};

/** Assign Student to Batch */
const assignStudentToBatch = async (studentId: string, batchId: string): Promise<any> => {
    // Check if student exists
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Check if batch exists
    const batch = await BatchModel.findUnique({
        where: { id: batchId },
    });

    if (!batch) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
    }

    // Update student with batch
    const updatedStudent = await StudentModel.update({
        where: { id: studentId },
        data: { batchId },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return updatedStudent;
};

/** Remove Student from Batch */
const removeStudentFromBatch = async (studentId: string): Promise<any> => {
    // Check if student exists
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Update student to remove batch
    const updatedStudent = await StudentModel.update({
        where: { id: studentId },
        data: { batchId: undefined },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return updatedStudent;
};

/** Assign Student to Department */
const assignStudentToDepartment = async (studentId: string, departmentId: string): Promise<any> => {
    // Check if student exists
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Check if department exists
    const department = await DepartmentModel.findUnique({
        where: { id: departmentId },
    });

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update student with department
    const updatedStudent = await StudentModel.update({
        where: { id: studentId },
        data: { departmentId },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return updatedStudent;
};

/** Remove Student from Department */
const removeStudentFromDepartment = async (studentId: string): Promise<any> => {
    // Check if student exists
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Update student to remove department
    const updatedStudent = await StudentModel.update({
        where: { id: studentId },
        data: { departmentId: undefined },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return updatedStudent;
};

/** Assign Student to Course */
const assignStudentToCourse = async (studentId: string, courseId: string): Promise<any> => {
    // Check if student exists
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
        where: { id: courseId },
    });

    if (!course) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
            studentId_courseId: {
                studentId: student.userId,
                courseId,
            },
        },
    });

    if (existingEnrollment) {
        throw new AppError(StatusCodes.CONFLICT, 'Student already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
        data: {
            studentId: student.userId,
            courseId,
        },
        include: {
            course: true,
        },
    });

    return enrollment;
};

/** Remove Student from Course */
const removeStudentFromCourse = async (studentId: string, courseId: string): Promise<any> => {
    // Check if student exists
    const student = await StudentModel.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Check if enrollment exists
    const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
            studentId: student.userId,
            courseId,
        },
    });

    if (!enrollment) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Enrollment not found');
    }

    // Delete enrollment
    await prisma.courseEnrollment.delete({
        where: {
            id: enrollment.id,
        },
    });

    return { message: 'Student removed from course successfully' };
};

/** Bulk Assign Students to Batch */
const bulkAssignStudentsToBatch = async (studentIds: string[], batchId: string): Promise<{ count: number; students: any[] }> => {
    // Check if batch exists
    const batch = await BatchModel.findUnique({
        where: { id: batchId },
    });

    if (!batch) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
    }

    // Update multiple students
    const result = await prisma.student.updateMany({
        where: {
            id: { in: studentIds }
        },
        data: {
            batchId
        }
    });

    // Get updated students
    const updatedStudents = await StudentModel.findMany({
        where: {
            id: { in: studentIds }
        },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return {
        count: result.count,
        students: updatedStudents,
    };
};

/** Bulk Assign Students to Department */
const bulkAssignStudentsToDepartment = async (studentIds: string[], departmentId: string): Promise<{ count: number; students: any[] }> => {
    // Check if department exists
    const department = await DepartmentModel.findUnique({
        where: { id: departmentId },
    });

    if (!department) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
    }

    // Update multiple students
    const result = await prisma.student.updateMany({
        where: {
            id: { in: studentIds }
        },
        data: {
            departmentId
        }
    });

    // Get updated students
    const updatedStudents = await StudentModel.findMany({
        where: {
            id: { in: studentIds }
        },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return {
        count: result.count,
        students: updatedStudents,
    };
};

/** Get Student Statistics */
const getStudentStats = async (): Promise<any> => {
    const [
        totalStudents,
        activeStudents,
        inactiveStudents,
        studentsByDepartment,
        studentsByBatch,
        studentsBySemester
    ] = await Promise.all([
        prisma.student.count(),
        prisma.student.count({ where: { user: { status: 'ACTIVE' } } }),
        prisma.student.count({ where: { user: { status: 'INACTIVE' } } }),
        prisma.student.groupBy({
            by: ['departmentId'],
            _count: { _all: true },
        }),
        prisma.student.groupBy({
            by: ['batchId'],
            _count: { _all: true },
        }),
        prisma.student.groupBy({
            by: ['semester'],
            _count: { _all: true },
        }),
    ]);

    // Get department names for the stats
    const departments = await prisma.department.findMany({
        where: { id: { in: studentsByDepartment.map(d => d.departmentId).filter((id): id is string => id !== null) } },
        select: { id: true, name: true }
    });

    // Get batch names for the stats
    const batches = await prisma.batch.findMany({
        where: { id: { in: studentsByBatch.map(b => b.batchId).filter((id): id is string => id !== null) } },
        select: { id: true, name: true }
    });

    return {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        byDepartment: studentsByDepartment.map(d => ({
            departmentId: d.departmentId,
            name: departments.find(dept => dept.id === d.departmentId)?.name || 'Unknown',
            count: d._count._all,
        })),
        byBatch: studentsByBatch.map(b => ({
            batchId: b.batchId,
            name: batches.find(batch => batch.id === b.batchId)?.name || 'Unknown',
            count: b._count._all,
        })),
        bySemester: studentsBySemester.map(s => ({
            semester: s.semester,
            count: s._count._all,
        })),
    };
};

/** Get Unassigned Students */
const getUnassignedStudents = async (): Promise<any[]> => {
    // Get students without batch or department
    const unassignedStudents = await StudentModel.findMany({
        where: {
            OR: [
                { batchId: undefined },
                { departmentId: undefined }
            ]
        },
        include: {
            user: true,
            batch: true,
            department: true,
        },
    });

    return unassignedStudents;
};

export const studentServices = {
    createStudent,
    getStudentById,
    getStudentByUserId,
    getAllStudents,
    updateStudent,
    deleteStudent,
    getStudentProfile,
    getStudentAttendance,
    getStudentAttendanceSummary,
    submitLeaveRequest,
    updateStudentProfile,
    getStudentDashboard,
    // Assignment methods
    assignStudentToBatch,
    removeStudentFromBatch,
    assignStudentToDepartment,
    removeStudentFromDepartment,
    assignStudentToCourse,
    removeStudentFromCourse,
    bulkAssignStudentsToBatch,
    bulkAssignStudentsToDepartment,
    getUnassignedStudents,
    getStudentStats,
};
