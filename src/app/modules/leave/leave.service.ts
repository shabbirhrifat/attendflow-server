import { LeaveModel } from './leave.model';
import {
    ILeave,
    ILeaveFilters,
    ILeaveStats,
    ILeaveDashboard,
} from './leave.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import UserModel from '../user/user.model';
import { CourseEnrollmentModel } from '../course/course.model';
import { AttendanceModel } from '../attendance/attendance.model';

/**
 * Submit a new leave request
 */
const submitLeave = async (data: any): Promise<ILeave> => {
    // Check if user exists
    const user = await UserModel.findById(data.userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Validate date range
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Start date cannot be in the past');
    }

    // Calculate number of days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 30) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Leave cannot exceed 30 days');
    }

    // Check for overlapping leave requests
    const overlappingLeaves = await LeaveModel.model.find({
        userId: data.userId,
        status: { $in: ['PENDING', 'APPROVED'] },
        $or: [
            {
                startDate: { $lte: startDate },
                endDate: { $gte: startDate },
            },
            {
                startDate: { $lte: endDate },
                endDate: { $gte: endDate },
            },
            {
                startDate: { $gte: startDate },
                endDate: { $lte: endDate },
            },
        ],
    });

    if (overlappingLeaves.length > 0) {
        throw new AppError(StatusCodes.CONFLICT, 'You already have a leave request for this period');
    }

    const leave = await LeaveModel.create(data);
    return leave as ILeave;
};

/**
 * Update leave request
 */
const updateLeave = async (id: string, data: any): Promise<ILeave> => {
    // Check if leave exists
    const existingLeave = await LeaveModel.findById(id);

    if (!existingLeave) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Leave request not found');
    }

    // Check if leave is still pending
    if (existingLeave.status !== 'PENDING') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update a processed leave request');
    }

    // Validate date range if provided
    if (data.startDate || data.endDate) {
        const startDate = data.startDate ? new Date(data.startDate) : existingLeave.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : existingLeave.endDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Start date cannot be in the past');
        }

        // Calculate number of days
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > 30) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Leave cannot exceed 30 days');
        }
    }

    const updatedLeave = await LeaveModel.update(id, data);
    return updatedLeave as ILeave;
};

/**
 * Get leave by ID
 */
const getLeaveById = async (id: string): Promise<ILeave | null> => {
    const leave = await LeaveModel.findById(id);

    if (!leave) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Leave request not found');
    }

    return leave as ILeave;
};

/**
 * Get leave requests with filters
 */
const getLeaves = async (filters: ILeaveFilters) => {
    const result = await LeaveModel.findMany(filters);
    return result;
};

/**
 * Approve or reject leave request
 */
const processLeaveRequest = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string,
    rejectionReason?: string
): Promise<ILeave> => {
    // Check if leave exists
    const existingLeave = await LeaveModel.findById(id);

    if (!existingLeave) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Leave request not found');
    }

    // Check if leave is still pending
    if (existingLeave.status !== 'PENDING') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Leave request has already been processed');
    }

    // Check if approver exists and is a teacher
    const approver = await UserModel.findById(approvedBy);

    if (!approver) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Approver not found');
    }

    if (approver.role !== 'TEACHER' && approver.role !== 'ADMIN') {
        throw new AppError(StatusCodes.FORBIDDEN, 'Only teachers and admins can approve leave requests');
    }

    // If approving, update attendance records for the leave period
    if (status === 'APPROVED') {
        await updateAttendanceForApprovedLeave(existingLeave);
    }

    const updatedLeave = await LeaveModel.updateStatus(id, status, approvedBy, rejectionReason);
    return updatedLeave as ILeave;
};

/**
 * Delete leave request
 */
const deleteLeave = async (id: string): Promise<void> => {
    // Check if leave exists
    const existingLeave = await LeaveModel.findById(id);

    if (!existingLeave) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Leave request not found');
    }

    // Check if leave is still pending
    if (existingLeave.status !== 'PENDING') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot delete a processed leave request');
    }

    await LeaveModel.delete(id);
};

/**
 * Get leave statistics
 */
const getLeaveStats = async (filters: ILeaveFilters): Promise<ILeaveStats> => {
    const stats = await LeaveModel.getStats(filters);
    return stats as ILeaveStats;
};

/**
 * Get leave dashboard data
 */
const getLeaveDashboard = async (): Promise<ILeaveDashboard> => {
    // Get total requests
    const totalRequests = await LeaveModel.model.countDocuments();

    // Get pending requests
    const pendingRequests = await LeaveModel.model.countDocuments({ status: 'PENDING' });

    // Get approved requests
    const approvedRequests = await LeaveModel.model.countDocuments({ status: 'APPROVED' });

    // Get rejected requests
    const rejectedRequests = await LeaveModel.model.countDocuments({ status: 'REJECTED' });

    // Get requests this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const requestsThisMonth = await LeaveModel.model.countDocuments({
        createdAt: { $gte: currentMonth },
    });

    // Get monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);

        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const [approved, rejected, pending] = await Promise.all([
            LeaveModel.model.countDocuments({
                createdAt: { $gte: date, $lt: nextMonth },
                status: 'APPROVED',
            }),
            LeaveModel.model.countDocuments({
                createdAt: { $gte: date, $lt: nextMonth },
                status: 'REJECTED',
            }),
            LeaveModel.model.countDocuments({
                createdAt: { $gte: date, $lt: nextMonth },
                status: 'PENDING',
            }),
        ]);

        monthlyTrend.push({
            month: date.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
            approved,
            rejected,
            pending,
        });
    }

    // Get recent requests
    const recentRequests = await LeaveModel.model.find()
        .populate('user', 'id name email')
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        requestsThisMonth,
        monthlyTrend,
        leaveByType: [], // Would be populated when leave types are implemented
        recentRequests: recentRequests as any,
    };
};

/**
 * Update attendance records for approved leave
 */
const updateAttendanceForApprovedLeave = async (leave: any): Promise<void> => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    // Get all courses the student is enrolled in
    const enrollments = await CourseEnrollmentModel.model.find({
        studentId: leave.userId,
    }).populate('course');

    // For each day of leave, mark attendance as EXCUSED for all courses
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        for (const enrollment of enrollments) {
            // Check if there's a class on this day (this would need schedule data)
            // For now, we'll mark all days as EXCUSED
            await AttendanceModel.model.findOneAndUpdate(
                {
                    userId: leave.userId,
                    courseId: (enrollment as any).courseId,
                    date: currentDate,
                },
                {
                    status: 'EXCUSED',
                    notes: `Approved leave: ${leave.reason}`,
                },
                { upsert: true, new: true }
            );
        }
    }
};

export const leaveServices = {
    submitLeave,
    updateLeave,
    getLeaveById,
    getLeaves,
    processLeaveRequest,
    deleteLeave,
    getLeaveStats,
    getLeaveDashboard,
};