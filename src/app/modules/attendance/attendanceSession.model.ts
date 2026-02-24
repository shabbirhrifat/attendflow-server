import { AttendanceSession } from './attendance.schema';
import BaseRepository from '../../repositories/BaseRepository';
import {
    IAttendanceSession,
    IAttendanceSessionCreate,
    IAttendanceSessionUpdate,
    IAttendanceSessionFilters,
} from './attendance.interface';

// Attendance Session repository using Mongoose
class AttendanceSessionRepository extends BaseRepository<any> {
    constructor() {
        super(AttendanceSession);
    }

    // Create a new attendance session
    async create(data: IAttendanceSessionCreate): Promise<IAttendanceSession> {
        const result = await this.model.create({
            courseId: data.courseId,
            teacherId: data.teacherId,
            date: data.date || data.startTime,
            startTime: data.startTime,
            location: data.location,
            notes: data.notes,
            isActive: true,
        });

        const populated = await this.model.findById(result._id)
            .populate('course', 'id title code')
            .populate('teacher', 'id name email');

        return populated as unknown as IAttendanceSession;
    }

    // Find attendance session by ID
    async findById(id: string): Promise<IAttendanceSession | null> {
        const result = await this.model.findById(id)
            .populate('course', 'id title code')
            .populate('teacher', 'id name email');

        return result as unknown as IAttendanceSession | null;
    }

    // Get attendance sessions with filters
    async findMany(filters: IAttendanceSessionFilters) {
        const {
            courseId,
            teacherId,
            isActive,
            startDate,
            endDate,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = filters;

        const where: any = {};

        if (courseId) where.courseId = courseId;
        if (teacherId) where.teacherId = teacherId;
        if (isActive !== undefined) where.isActive = isActive;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.$gte = new Date(startDate);
            if (endDate) where.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [sessions, total] = await Promise.all([
            this.model.find(where)
                .populate('course', 'id title code')
                .populate('teacher', 'id name email')
                .sort(sort)
                .skip(skip)
                .limit(limit),
            this.model.countDocuments(where),
        ]);

        return {
            data: sessions as unknown as IAttendanceSession[],
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Update attendance session
    async update(id: string, data: Partial<IAttendanceSessionUpdate>): Promise<IAttendanceSession> {
        await this.model.findByIdAndUpdate(id, data);

        const result = await this.model.findById(id)
            .populate('course', 'id title code')
            .populate('teacher', 'id name email');

        return result as unknown as IAttendanceSession;
    }

    // Delete attendance session
    async delete(id: string): Promise<IAttendanceSession> {
        const result = await this.model.findByIdAndDelete(id)
            .populate('course', 'id title code')
            .populate('teacher', 'id name email');

        return result as unknown as IAttendanceSession;
    }

    // Get active sessions for a teacher and course
    async findActiveSessions(courseId: string, teacherId: string): Promise<IAttendanceSession[]> {
        const result = await this.model.find({
            courseId,
            teacherId,
            isActive: true,
        })
            .populate('course', 'id title code')
            .populate('teacher', 'id name email')
            .sort({ createdAt: -1 });

        return result as unknown as IAttendanceSession[];
    }
}

// Create singleton instance
const attendanceSessionRepository = new AttendanceSessionRepository();

// Export for backward compatibility
export const AttendanceSessionModel = attendanceSessionRepository;
export default attendanceSessionRepository;
