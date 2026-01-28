import { TeacherModel, ClassScheduleModel, SubjectModel, TeacherAttendanceModel, TeacherLeaveModel } from './teacher.model';
import {
    ITeacher,
    ITeacherCreate,
    ITeacherUpdate,
    ITeacherFilters,
    ITeacherWithUser,
    ITeacherProfile,
    ITeacherStats,
    IMarkAttendance,
    IBulkMarkAttendance,
    IAttendanceRecord,
    IClassScheduleView,
    ICreateClassSchedule,
    ILeaveApproval,
    ILeaveRequest,
    ISubjectCreate,
    ISubjectUpdate,
    ITeacherDashboard,
    ICourseStats,
    ICourseAttendanceSummary,
    ITeacherResponse
} from './teacher.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { generateTeacherId, generateTeacherUserId } from '../../utils/idGenerator';
import { hashInfo } from '../../utils/hashInfo';
import prisma from '../../config/prisma';
import QueryBuilder from '../../builder/QueryBuilder';

// Teacher profile services
export const createTeacherProfile = async (data: ITeacherCreate): Promise<ITeacherWithUser> => {
    try {
        // Validate required fields
        if (!data.email) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Email is required for all teachers');
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

        if (userId) {
            // Check if teacher profile already exists for this user
            const existingTeacher = await TeacherModel.findByUserId(userId);
            if (existingTeacher) {
                throw new AppError(StatusCodes.CONFLICT, 'Teacher profile already exists for this user');
            }
        } else {
            // Create new user with generated ID
            userId = generateTeacherUserId(data.name);

            // Hash password before creating user
            const hashedPassword = await hashInfo(data.password || 'changeme123');

            await prisma.user.create({
                data: {
                    id: userId,
                    name: data.name,
                    email: data.email, // Use provided email (REQUIRED)
                    username: userId,
                    password: hashedPassword, // Use hashed password
                    role: 'TEACHER',
                    status: 'ACTIVE',
                    departmentId: data.departmentId, // Optional - can be null
                }
            });
        }

        // AUTO-GENERATE employeeId (not provided by user)
        const employeeId = await generateTeacherId();

        const teacherData = {
            userId,
            employeeId, // Always auto-generated
            departmentId: data.departmentId, // Optional
            designation: data.designation,
            specialization: data.specialization,
        };

        return await TeacherModel.create(teacherData) as unknown as ITeacherWithUser;
    } catch (error) {
        throw error;
    }
};

export const getTeacherProfile = async (teacherId: string): Promise<ITeacherWithUser | null> => {
    try {
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher profile not found');
        }
        return teacher as unknown as ITeacherWithUser;
    } catch (error) {
        throw error;
    }
};

export const getTeacherProfileByUserId = async (userId: string): Promise<ITeacherWithUser | null> => {
    try {
        const teacher = await TeacherModel.findByUserId(userId);
        if (!teacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher profile not found');
        }
        return teacher as unknown as ITeacherWithUser;
    } catch (error) {
        throw error;
    }
};

export const updateTeacherProfile = async (teacherId: string, data: ITeacherUpdate): Promise<ITeacherWithUser> => {
    try {
        // Check if teacher exists
        const existingTeacher = await TeacherModel.findById(teacherId);
        if (!existingTeacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher profile not found');
        }

        // Check if employee ID is being updated and if it's already taken
        if (data.employeeId) {
            const existingEmployeeId = await TeacherModel.findByEmployeeId(data.employeeId);
            if (existingEmployeeId && existingEmployeeId.id !== teacherId) {
                throw new AppError(StatusCodes.CONFLICT, 'Employee ID already exists');
            }
        }

        return await TeacherModel.update(teacherId, data) as unknown as ITeacherWithUser;
    } catch (error) {
        throw error;
    }
};

export const deleteTeacherProfile = async (teacherId: string): Promise<void> => {
    try {
        const existingTeacher = await TeacherModel.findById(teacherId);
        if (!existingTeacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher profile not found');
        }

        await TeacherModel.delete(teacherId);
    } catch (error) {
        throw error;
    }
};

export const getAllTeachers = async (filters: any): Promise<{ data: ITeacher[]; meta: any }> => {
    try {
        const queryBuilder = new QueryBuilder(filters);

        // Build query with search, filter, sort, pagination, and field selection
        queryBuilder.search(['employeeId']).filter().sort().paginate().fields();

        const queryOptions = queryBuilder.getQueryOptions();

        // Execute query
        const [teachers, total] = await Promise.all([
            prisma.teacher.findMany({
                where: {
                    ...queryOptions.where,
                    ...(filters.departmentId && filters.departmentId !== 'all' && { departmentId: filters.departmentId }),
                    ...(() => {
                        let isActiveFilter;
                        if (filters.status === 'active') {
                            isActiveFilter = true;
                        } else if (filters.status === 'inactive') {
                            isActiveFilter = false;
                        } else if (filters.isActive !== undefined) {
                            isActiveFilter = filters.isActive === 'true';
                        }
                        return isActiveFilter !== undefined ? { user: { status: isActiveFilter ? 'ACTIVE' : 'INACTIVE' } } : {};
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
                            status: true,
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
                orderBy: queryOptions.orderBy,
                skip: queryOptions.skip,
                take: queryOptions.take,
            }),
            prisma.teacher.count({
                where: {
                    ...queryOptions.where,
                    ...(filters.departmentId && filters.departmentId !== 'all' && { departmentId: filters.departmentId }),
                    ...(() => {
                        let isActiveFilter;
                        if (filters.status === 'active') {
                            isActiveFilter = true;
                        } else if (filters.status === 'inactive') {
                            isActiveFilter = false;
                        } else if (filters.isActive !== undefined) {
                            isActiveFilter = filters.isActive === 'true';
                        }
                        return isActiveFilter !== undefined ? { user: { status: isActiveFilter ? 'ACTIVE' : 'INACTIVE' } } : {};
                    })(),
                },
            }),
        ]);

        const meta = queryBuilder.getPaginationMeta(total);

        return {
            data: teachers as unknown as ITeacher[],
            meta,
        };
    } catch (error) {
        throw error;
    }
};

export const getTeacherStats = async (): Promise<ITeacherStats> => {
    try {
        return await TeacherModel.getStats();
    } catch (error) {
        throw error;
    }
};

// Get individual teacher statistics
export const getTeacherStatistics = async (teacherId: string): Promise<{
    totalCourses: number;
    totalStudents: number;
    totalClasses: number;
    thisWeekClasses: number;
}> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher profile not found');
        }

        // Get all courses assigned to this teacher
        const classSchedules = await ClassScheduleModel.findByTeacherId(teacherId);

        // Get unique courses
        const uniqueCourses = new Set(classSchedules.map((schedule: any) => schedule.courseId));

        // Get total students (sum of students in all batches)
        const batches = classSchedules.map((schedule: any) => schedule.batchId).filter(Boolean);
        const uniqueBatches = [...new Set(batches)];

        // Calculate total students (this would need batch model to get student count)
        // For now, returning a placeholder
        let totalStudents = 0;
        // TODO: Query batch model to get actual student count

        // Get this week's classes (classes scheduled from start of week to today)
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const thisWeekClasses = classSchedules.filter((schedule: any) => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= startOfWeek && scheduleDate <= today;
        }).length;

        return {
            totalCourses: uniqueCourses.size,
            totalStudents,
            totalClasses: classSchedules.length,
            thisWeekClasses,
        };
    } catch (error) {
        throw error;
    }
};

// Attendance services
export const markAttendance = async (teacherId: string, data: IMarkAttendance): Promise<IAttendanceRecord> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to mark attendance');
        }

        // Mark attendance
        const attendance = await TeacherAttendanceModel.markAttendance({
            ...data,
            markedBy: teacherId,
        });

        // Transform to match IAttendanceRecord interface
        return {
            ...attendance,
            student: {
                id: attendance.userId,
                name: '', // Get from user data
                email: '', // Get from user data
                studentId: '', // Get from student data
            },
            course: {
                id: attendance.courseId,
                title: '', // Get from course data
                code: '', // Get from course data
            },
        } as IAttendanceRecord;
    } catch (error) {
        throw error;
    }
};

export const bulkMarkAttendance = async (teacherId: string, data: IBulkMarkAttendance): Promise<IAttendanceRecord[]> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to mark attendance');
        }

        // Bulk mark attendance
        const attendances = await TeacherAttendanceModel.bulkMarkAttendance(
            data.courseId,
            new Date(data.date),
            data.attendances,
            teacherId
        );

        // Transform to match IAttendanceRecord interface
        return attendances.map(attendance => ({
            ...attendance,
            student: {
                id: attendance.userId,
                name: '', // Get from user data
                email: '', // Get from user data
                studentId: '', // Get from student data
            },
            course: {
                id: attendance.courseId,
                title: '', // Get from course data
                code: '', // Get from course data
            },
        }));
    } catch (error) {
        throw error;
    }
};

export const getCourseAttendance = async (teacherId: string, courseId: string, filters: any = {}): Promise<IAttendanceRecord[]> => {
    try {
        // Verify teacher exists and has access to this course
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to view attendance');
        }

        // Get attendance records
        const attendance = await TeacherAttendanceModel.getCourseAttendance(courseId, filters);

        return attendance as unknown as IAttendanceRecord[];
    } catch (error) {
        throw error;
    }
};

export const getCourseAttendanceSummary = async (teacherId: string, courseId: string, startDate?: Date, endDate?: Date): Promise<ICourseAttendanceSummary> => {
    try {
        // Verify teacher exists and has access to this course
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to view attendance summary');
        }

        // Get attendance summary
        const summary = await TeacherAttendanceModel.getCourseAttendanceSummary(courseId, startDate, endDate);

        // Transform to match ICourseAttendanceSummary interface
        return {
            ...summary,
            courseTitle: '', // Get from course data
        } as ICourseAttendanceSummary;
    } catch (error) {
        throw error;
    }
};

// Leave management services
export const getPendingLeaveRequests = async (teacherId: string): Promise<ILeaveRequest[]> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to view leave requests');
        }

        // Get pending leave requests
        const leaveRequests = await TeacherLeaveModel.getPendingLeaves(teacherId);

        return leaveRequests;
    } catch (error) {
        throw error;
    }
};

export const processLeaveRequest = async (teacherId: string, data: ILeaveApproval): Promise<ILeaveRequest> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to process leave requests');
        }

        // Process leave request
        const processedLeave = await TeacherLeaveModel.processLeaveRequest(
            data.leaveId,
            data.status,
            teacherId,
            data.rejectionReason
        );

        // Transform to match ILeaveRequest interface
        return {
            ...processedLeave,
            user: {
                id: processedLeave.userId,
                name: '', // Get from user data
                email: '', // Get from user data
                studentId: '', // Get from student data
            },
        } as ILeaveRequest;
    } catch (error) {
        throw error;
    }
};

export const getProcessedLeaves = async (teacherId: string): Promise<ILeaveRequest[]> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to view processed leaves');
        }

        // Get processed leave requests
        const processedLeaves = await TeacherLeaveModel.getProcessedLeaves(teacherId);

        return processedLeaves;
    } catch (error) {
        throw error;
    }
};

// Class schedule services
export const createClassSchedule = async (teacherId: string, data: ICreateClassSchedule): Promise<IClassScheduleView> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to create class schedule');
        }

        // Create class schedule
        const schedule = await ClassScheduleModel.create({
            ...data,
            teacherId,
        });

        return schedule as unknown as IClassScheduleView;
    } catch (error) {
        throw error;
    }
};

export const getTeacherSchedules = async (teacherId: string): Promise<IClassScheduleView[]> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to view schedules');
        }

        // Get teacher's schedules
        const schedules = await ClassScheduleModel.findByTeacherId(teacherId);

        return schedules as unknown as IClassScheduleView[];
    } catch (error) {
        throw error;
    }
};

export const getTodaySchedule = async (teacherId: string): Promise<IClassScheduleView[]> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to view schedule');
        }

        // Get today's schedule
        const todaySchedule = await ClassScheduleModel.getTodaySchedule(teacherId);

        return todaySchedule as unknown as IClassScheduleView[];
    } catch (error) {
        throw error;
    }
};

export const updateClassSchedule = async (teacherId: string, scheduleId: string, data: Partial<ICreateClassSchedule>): Promise<IClassScheduleView> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to update class schedule');
        }

        // Update class schedule
        const updatedSchedule = await ClassScheduleModel.update(scheduleId, data);

        return updatedSchedule as unknown as IClassScheduleView;
    } catch (error) {
        throw error;
    }
};

export const deleteClassSchedule = async (teacherId: string, scheduleId: string): Promise<void> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized to delete class schedule');
        }

        // Delete class schedule
        await ClassScheduleModel.delete(scheduleId);
    } catch (error) {
        throw error;
    }
};

// Subject management services
export const createSubject = async (data: ISubjectCreate): Promise<any> => {
    try {
        return await SubjectModel.create(data);
    } catch (error) {
        throw error;
    }
};

export const getAllSubjects = async (filters: any = {}): Promise<{ data: any[]; meta: any }> => {
    try {
        const queryBuilder = new QueryBuilder(filters);

        // Build query with search, filter, sort, pagination, and field selection
        queryBuilder.search(['name', 'code']).filter().sort().paginate().fields();

        const queryOptions = queryBuilder.getQueryOptions();

        // Execute query
        const [subjects, total] = await Promise.all([
            prisma.subject.findMany({
                where: queryOptions.where,
                orderBy: queryOptions.orderBy,
                skip: queryOptions.skip,
                take: queryOptions.take,
            }),
            prisma.subject.count({
                where: queryOptions.where,
            }),
        ]);

        const meta = queryBuilder.getPaginationMeta(total);

        return {
            data: subjects,
            meta,
        };
    } catch (error) {
        throw error;
    }
};

export const getSubjectById = async (subjectId: string): Promise<any | null> => {
    try {
        const subject = await SubjectModel.findById(subjectId);
        if (!subject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }
        return subject;
    } catch (error) {
        throw error;
    }
};

export const updateSubject = async (subjectId: string, data: ISubjectUpdate): Promise<any> => {
    try {
        const existingSubject = await SubjectModel.findById(subjectId);
        if (!existingSubject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        return await SubjectModel.update(subjectId, data);
    } catch (error) {
        throw error;
    }
};

export const deleteSubject = async (subjectId: string): Promise<void> => {
    try {
        const existingSubject = await SubjectModel.findById(subjectId);
        if (!existingSubject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        await SubjectModel.delete(subjectId);
    } catch (error) {
        throw error;
    }
};


// Dashboard service
export const getTeacherDashboard = async (teacherId: string): Promise<ITeacherDashboard> => {
    try {
        // Verify teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher profile not found');
        }

        // Get today's schedule
        const todaySchedule = await ClassScheduleModel.getTodaySchedule(teacherId);

        // Get upcoming classes (next 7 days)
        const upcomingClasses = await ClassScheduleModel.findByTeacherId(teacherId); // Filter in service

        // Get recent attendance
        const recentAttendance = await TeacherAttendanceModel.getCourseAttendance('', { limit: 10 }); // Get recent attendance

        // Get pending leave requests
        const pendingLeaveRequests = await TeacherLeaveModel.getPendingLeaves(teacherId);

        // Create dashboard data
        const dashboard: ITeacherDashboard = {
            profile: teacher as unknown as ITeacherProfile, // Convert to profile format
            todaySchedule: todaySchedule as unknown as IClassScheduleView[],
            upcomingClasses: upcomingClasses as unknown as IClassScheduleView[],
            recentAttendance: recentAttendance.map(attendance => ({
                ...attendance,
                student: {
                    id: attendance.userId,
                    name: '', // Get from user data
                    email: '', // Get from user data
                    studentId: '', // Get from student data
                },
                course: {
                    id: attendance.courseId,
                    title: '', // Get from course data
                    code: '', // Get from course data
                },
            } as IAttendanceRecord)),
            pendingLeaveRequests,
            classStatistics: {
                totalClasses: 0, // Calculate from actual data
                totalStudents: 0, // Calculate from actual data
                averageAttendance: 0, // Calculate from actual data
            },
            notifications: [], // Get from notification service
        };

        return dashboard;
    } catch (error) {
        throw error;
    }
};

// Teacher assignment services
export const assignTeacherToDepartment = async (teacherId: string, departmentId: string): Promise<ITeacherWithUser> => {
    try {
        // Check if teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
        }

        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        // Update teacher with department
        const updatedTeacher = await TeacherModel.update(teacherId, { departmentId });

        return updatedTeacher as unknown as ITeacherWithUser;
    } catch (error) {
        throw error;
    }
};

export const removeTeacherFromDepartment = async (teacherId: string): Promise<ITeacherWithUser> => {
    try {
        // Check if teacher exists
        const teacher = await TeacherModel.findById(teacherId);
        if (!teacher) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Teacher not found');
        }

        // Remove teacher from department
        const updatedTeacher = await TeacherModel.update(teacherId, { departmentId: null });

        return updatedTeacher as unknown as ITeacherWithUser;
    } catch (error) {
        throw error;
    }
};

export const bulkAssignTeachersToDepartment = async (teacherIds: string[], departmentId: string): Promise<{ count: number; teachers: ITeacher[] }> => {
    try {
        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        // Update multiple teachers with department
        const result = await prisma.teacher.updateMany({
            where: {
                id: { in: teacherIds }
            },
            data: {
                departmentId
            }
        });

        // Get updated teachers
        const updatedTeachers = await TeacherModel.findMany({
            departmentId
        });

        return {
            count: result.count,
            teachers: updatedTeachers as unknown as ITeacher[]
        };
    } catch (error) {
        throw error;
    }
};

export const getUnassignedTeachers = async (): Promise<ITeacher[]> => {
    try {
        // Get teachers without department
        const unassignedTeachers = await TeacherModel.findMany({
            departmentId: null
        });

        return unassignedTeachers as unknown as ITeacher[];
    } catch (error) {
        throw error;
    }
};

// Export all services
export const TeacherService = {
    // Profile services
    createTeacherProfile,
    getTeacherProfile,
    getTeacherProfileByUserId,
    updateTeacherProfile,
    deleteTeacherProfile,
    getAllTeachers,
    getTeacherStats,
    getTeacherStatistics,

    // Attendance services
    markAttendance,
    bulkMarkAttendance,
    getCourseAttendance,
    getCourseAttendanceSummary,

    // Leave management services
    getPendingLeaveRequests,
    processLeaveRequest,
    getProcessedLeaves,

    // Class schedule services
    createClassSchedule,
    getTeacherSchedules,
    getTodaySchedule,
    updateClassSchedule,
    deleteClassSchedule,

    // Subject management services
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,

    // Dashboard service
    getTeacherDashboard,

    // Teacher assignment services
    assignTeacherToDepartment,
    removeTeacherFromDepartment,
    bulkAssignTeachersToDepartment,
    getUnassignedTeachers,
};
