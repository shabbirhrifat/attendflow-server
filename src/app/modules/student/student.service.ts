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
import UserModel from '../user/user.model';
import { generateStudentId, generateStudentUserId } from '../../utils/idGenerator';
import { hashInfo } from '../../utils/hashInfo';
import { AttendanceModel } from '../attendance/attendance.model';
import { CourseEnrollmentModel } from '../course/course.model';
import { LeaveModel } from '../leave/leave.model';
import mongoose from 'mongoose';

/** Create a new Student profile */
const createStudent = async (data: IStudentCreate): Promise<IStudentWithUser> => {
    // Validate required fields
    if (!data.email) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required for all students');
    }

    // Check if email already exists
    const existingEmail = await UserModel.findByEmail(data.email);

    if (existingEmail) {
        throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
    }

    // Generate user ID and create user if not provided
    let userId = data.userId;
    let user;

    if (userId) {
        // Check if user exists and has STUDENT role
        user = await UserModel.findById(userId);

        if (!user) {
            throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
        }

        if (user.role !== 'STUDENT') {
            throw new AppError(StatusCodes.BAD_REQUEST, 'User must have STUDENT role');
        }

        // Check if student profile already exists for this user
        const existingStudent = await StudentModel.findByUserId(userId);

        if (existingStudent) {
            throw new AppError(StatusCodes.CONFLICT, 'Student profile already exists for this user');
        }
    } else {
        // Create new user with generated ID
        userId = generateStudentUserId(data.name);

        // Hash password before creating user
        const hashedPassword = await hashInfo(data.password || 'changeme123');

        user = await UserModel.model.create({
            _id: userId,
            name: data.name,
            email: data.email,
            username: userId,
            password: hashedPassword,
            role: 'STUDENT',
            status: 'ACTIVE',
            departmentId: data.departmentId,
        });
    }

    // AUTO-GENERATE studentId (not provided by user)
    const studentId = await generateStudentId();

    // Validate batch exists (only if provided)
    if (data.batchId) {
        const batch = await BatchModel.model.findById(data.batchId);

        if (!batch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }
    }

    // Validate department exists (only if provided)
    if (data.departmentId) {
        const department = await DepartmentModel.model.findById(data.departmentId);

        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }
    }

    const student = await StudentModel.model.create({
        userId,
        studentId,
        batchId: data.batchId,
        departmentId: data.departmentId,
        semester: data.semester || 1,
        gpa: data.gpa || 0.0,
        credits: data.credits || 0,
    });

    // Populate user, batch, department
    const populatedStudent = await StudentModel.model.findById(student._id)
        .populate('user')
        .populate('batch')
        .populate('department');

    return populatedStudent as unknown as IStudentWithUser;
};

/** Get a Student by ID */
const getStudentById = async (id: string): Promise<IStudentWithUser | null> => {
    const student = await StudentModel.model.findById(id)
        .populate('user')
        .populate('batch')
        .populate('department');

    return student as unknown as IStudentWithUser;
};

/** Get a Student by User ID */
const getStudentByUserId = async (userId: string): Promise<IStudentWithUser | null> => {
    const student = await StudentModel.model.findOne({ userId })
        .populate('user')
        .populate('batch')
        .populate('department');

    return student as unknown as IStudentWithUser;
};

/** Get all Students with query builder support */
const getAllStudents = async (query: any): Promise<{ data: IStudentWithUser[]; meta: any }> => {
    const queryBuilder = new QueryBuilder(query);

    // Build query with search, filter, sort, pagination, and field selection
    queryBuilder.search(['studentId']).filter().sort().paginate().fields();

    const queryOptions = queryBuilder.getQueryOptions();

    // Build filter
    const filter: any = {
        ...queryOptions.filter,
        ...(query.batchId && query.batchId !== 'all' && { batchId: query.batchId }),
        ...(query.departmentId && query.departmentId !== 'all' && { departmentId: query.departmentId }),
        ...(query.semester && { semester: parseInt(query.semester) }),
    };

    // Handle status filter
    if (query.status === 'active') {
        filter.isActive = true;
    } else if (query.status === 'inactive') {
        filter.isActive = false;
    } else if (query.isActive !== undefined) {
        filter.isActive = query.isActive === 'true';
    }

    // Execute query
    const [students, total] = await Promise.all([
        StudentModel.model.find(filter)
            .populate('user', 'id name email phone avatar')
            .populate('batch', 'id name year')
            .populate('department', 'id name code')
            .sort(queryOptions.sort || { name: 1 })
            .skip(queryOptions.skip || 0)
            .limit(queryOptions.limit || 10)
            .lean(),
        StudentModel.model.countDocuments(filter),
    ]);

    const meta = {
        page: queryOptions.page || 1,
        limit: queryOptions.limit || 10,
        total,
        totalPages: Math.ceil(total / (queryOptions.limit || 10)),
    };

    return {
        data: students as unknown as IStudentWithUser[],
        meta,
    };
};

/** Update a Student */
const updateStudent = async (id: string, data: IStudentUpdate): Promise<IStudentWithUser | null> => {
    // Check if student exists
    const existingStudent = await StudentModel.model.findById(id);

    if (!existingStudent) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // If batchId is being updated, check if it exists
    if (data.batchId && data.batchId !== existingStudent.batchId?.toString()) {
        const batch = await BatchModel.model.findById(data.batchId);
        if (!batch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }
    }

    // If departmentId is being updated, check if it exists
    if (data.departmentId && data.departmentId !== existingStudent.departmentId?.toString()) {
        const department = await DepartmentModel.model.findById(data.departmentId);
        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }
    }

    const updatedStudent = await StudentModel.model.findByIdAndUpdate(id, data, { new: true })
        .populate('user')
        .populate('batch')
        .populate('department');

    return updatedStudent as unknown as IStudentWithUser;
};

/** Delete a Student */
const deleteStudent = async (id: string): Promise<void> => {
    // Check if student exists
    const existingStudent = await StudentModel.model.findById(id);

    if (!existingStudent) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    await StudentModel.model.findByIdAndDelete(id);
};

/** Get Student Profile with complete information */
const getStudentProfile = async (id: string): Promise<IStudentProfile | null> => {
    const student = await StudentModel.model.findById(id)
        .populate('user')
        .populate('batch')
        .populate('department')
        .lean();

    if (!student) {
        return null;
    }

    // Get course enrollments count
    const totalCourses = await CourseEnrollmentModel.model.countDocuments({ studentId: id });

    // Get attendance records count
    const totalAttendances = await AttendanceModel.model.countDocuments({ userId: student.userId });

    // Get leave records
    const leaves = await LeaveModel.model.find({ userId: student.userId })
        .select('id status')
        .lean();

    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter((leave: any) => leave.status === 'APPROVED').length;
    const pendingLeaves = leaves.filter((leave: any) => leave.status === 'PENDING').length;

    // Calculate attendance percentage
    let attendancePercentage = 0;
    if (totalAttendances > 0) {
        const presentAttendances = await AttendanceModel.model.countDocuments({
            userId: student.userId,
            status: 'PRESENT',
        });
        attendancePercentage = Math.round((presentAttendances / totalAttendances) * 100);
    }

    return {
        ...student,
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
    const student = await StudentModel.model.findById(studentId);

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {
        userId: student.userId,
    };

    if (query.courseId) {
        filter.courseId = query.courseId;
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.startDate && query.endDate) {
        filter.date = {
            $gte: new Date(query.startDate),
            $lte: new Date(query.endDate),
        };
    }

    // Execute query
    const [attendances, total] = await Promise.all([
        AttendanceModel.model.find(filter)
            .populate('course', 'id title code')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AttendanceModel.model.countDocuments(filter),
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
    const student = await StudentModel.model.findById(studentId);

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Get attendance counts using aggregation
    const stats = await AttendanceModel.model.aggregate([
        { $match: { userId: student.userId } },
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

    const result = stats[0] || {
        totalClasses: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
    };

    const attendancePercentage = result.totalClasses > 0
        ? Math.round((result.presentCount / result.totalClasses) * 100)
        : 0;

    // Get monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await AttendanceModel.model.aggregate([
        {
            $match: {
                userId: student.userId,
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
    const monthlyBreakdown = monthlyData.reduce((acc: any[], item) => {
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
                [item._id.status.toLowerCase()]: item.count,
            });
        }

        return acc;
    }, []);

    return {
        totalClasses: result.totalClasses,
        presentCount: result.presentCount,
        absentCount: result.absentCount,
        lateCount: result.lateCount,
        excusedCount: result.excusedCount,
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
    const student = await StudentModel.model.findById(studentId);

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Check if there's an overlapping leave request
    const overlappingLeave = await LeaveModel.model.findOne({
        userId: student.userId,
        $or: [
            {
                $and: [
                    { startDate: { $lte: leaveData.startDate } },
                    { endDate: { $gte: leaveData.startDate } },
                ],
            },
            {
                $and: [
                    { startDate: { $lte: leaveData.endDate } },
                    { endDate: { $gte: leaveData.endDate } },
                ],
            },
            {
                $and: [
                    { startDate: { $gte: leaveData.startDate } },
                    { endDate: { $lte: leaveData.endDate } },
                ],
            },
        ],
    });

    if (overlappingLeave) {
        throw new AppError(StatusCodes.CONFLICT, 'You have an overlapping leave request');
    }

    const leave = await LeaveModel.model.create({
        userId: student.userId,
        studentId: studentId,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        reason: leaveData.reason,
        type: leaveData.type,
        documents: leaveData.documents,
    });

    return leave;
};

/** Get Student Dashboard Data */
const getStudentDashboard = async (studentId: string): Promise<IStudentDashboard> => {
    const student = await StudentModel.model.findById(studentId)
        .populate('batch')
        .populate('department')
        .lean();

    if (!student) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Student not found');
    }

    // Get attendance summary
    const attendanceSummary = await getStudentAttendanceSummary(studentId);

    // Get recent attendance
    const recentAttendance = await AttendanceModel.model.find({
        userId: student.userId,
    })
        .populate('course', 'id title code')
        .sort({ date: -1 })
        .limit(5)
        .lean();

    // Get pending leaves
    const pendingLeaves = await LeaveModel.model.find({
        userId: student.userId,
        status: 'PENDING',
    })
        .sort({ createdAt: -1 })
        .lean();

    // Get enrolled courses
    const enrollments = await CourseEnrollmentModel.model.find({
        studentId: studentId,
    })
        .populate('course', 'id title code credits')
        .lean();

    return {
        student: student as any,
        attendanceSummary,
        recentAttendance: recentAttendance as any,
        pendingLeaves: pendingLeaves as any,
        enrolledCourses: enrollments.map((e: any) => e.course) as any,
    };
};

// Export all student services
export const StudentService = {
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
    getStudentDashboard,
};

export default StudentService;
