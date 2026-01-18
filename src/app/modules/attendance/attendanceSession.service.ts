import { AttendanceSessionModel } from './attendanceSession.model';
import {
    IAttendanceSession,
    IAttendanceSessionCreate,
    IAttendanceSessionFilters,
    IAttendanceSessionStats,
} from './attendance.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { CourseModel } from '../course';
import { TeacherModel } from '../teacher/teacher.model';

// Create attendance session
const createAttendanceSession = async (payload: IAttendanceSessionCreate): Promise<IAttendanceSession> => {
    // Validate course exists
    const courseExists = await CourseModel.findUnique({
        where: { id: payload.courseId },
    });
    if (!courseExists) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Course not found');
    }

    // Validate teacher exists
    const teacherExists = await TeacherModel.findById(payload.teacherId);
    if (!teacherExists) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Teacher not found');
    }

    // Create session data
    const sessionData = {
        courseId: payload.courseId,
        teacherId: teacherExists.userId,
        date: payload.date || new Date(),
        startTime: payload.startTime || new Date(),
        location: payload.location,
        notes: payload.notes,
    };

    const result = await AttendanceSessionModel.create(sessionData);

    return result;
};

// Get active session for a course and teacher
const getActiveSession = async (courseId: string, teacherId: string): Promise<IAttendanceSession | null> => {
    const sessions = await AttendanceSessionModel.findMany({
        courseId,
        teacherId,
        isActive: true,
        page: 1,
        limit: 1,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    return sessions.data.length > 0 ? sessions.data[0] : null;
};

// Get session statistics for teacher dashboard
const getSessionStats = async (sessionId: string): Promise<IAttendanceSessionStats> => {
    const session = await AttendanceSessionModel.findById(sessionId);
    if (!session) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Session not found');
    }

    const sessionStart = new Date(session.startTime);
    const sessionEnd = session.endTime || new Date();

    // Get attendance records for this session
    const { AttendanceModel } = require('./attendance.model');

    // Count attendance by status for this session's course and date
    const sessionDate = new Date(session.date);
    const startOfDay = new Date(sessionDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(sessionDate.setHours(23, 59, 59, 999));

    // Get all attendance records for this course on this date
    const attendanceRecords = await AttendanceModel.findMany({
        courseId: session.courseId,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
        page: 1,
        limit: 1000,
    });

    const attendances = attendanceRecords.data || [];

    return {
        sessionId: session.id,
        totalTokens: 0, // QR tokens removed
        totalCheckIns: attendances.length,
        uniqueStudents: attendances.length,
        sessionStart: session.startTime,
        sessionEnd: session.endTime,
        isActive: session.isActive,
        courseId: session.courseId,
    };
};

// End attendance session
const endSession = async (sessionId: string, teacherId: string): Promise<IAttendanceSession> => {
    const session = await AttendanceSessionModel.findById(sessionId);
    if (!session) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Session not found');
    }

    if (session.teacherId !== teacherId) {
        throw new AppError(StatusCodes.FORBIDDEN, 'Only the session creator can end this session');
    }

    if (!session.isActive) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Session is already ended');
    }

    const result = await AttendanceSessionModel.update(sessionId, {
        endTime: new Date(),
        isActive: false,
    });

    return result;
};

// Get attendance sessions with filters
const getAttendanceSessions = async (filters: IAttendanceSessionFilters) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const result = await AttendanceSessionModel.findMany({
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder,
    });

    return { sessions: result.data, total: result.meta.total };
};

// Get attendance session by ID
const getAttendanceSessionById = async (id: string): Promise<IAttendanceSession | null> => {
    const result = await AttendanceSessionModel.findById(id);

    return result;
};

export const AttendanceSessionService = {
    createAttendanceSession,
    getActiveSession,
    getSessionStats,
    endSession,
    getAttendanceSessions,
    getAttendanceSessionById,
};
