import { Request, Response } from 'express';
import { attendanceServices } from './attendance.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { attendanceValidation } from './attendance.validation';

/**
 * Record attendance for a student
 */
const recordAttendance = catchAsync(async (req: Request, res: Response) => {
    const result = await attendanceServices.recordAttendance(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Attendance recorded successfully",
        data: result,
    });
});

/**
 * Update attendance record
 */
const updateAttendance = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await attendanceServices.updateAttendance(id, req.body);
    sendResponse(res, {
        message: "Attendance updated successfully",
        data: result,
    });
});

/**
 * Get attendance by ID
 */
const getAttendanceById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await attendanceServices.getAttendanceById(id);
    sendResponse(res, {
        message: "Attendance retrieved successfully",
        data: result,
    });
});

/**
 * Get attendance records with filters
 */
const getAttendances = catchAsync(async (req: Request, res: Response) => {
    const result = await attendanceServices.getAttendances(req.query);
    sendResponse(res, {
        message: "Attendances retrieved successfully",
        data: result,
    });
});

/**
 * Bulk mark attendance for multiple students
 */
const bulkMarkAttendance = catchAsync(async (req: Request, res: Response) => {
    const result = await attendanceServices.bulkMarkAttendance(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Attendance marked successfully for all students",
        data: result,
    });
});

/**
 * Get attendance summary for a course
 */
const getCourseAttendanceSummary = catchAsync(async (req: Request, res: Response) => {
    const { id: courseId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await attendanceServices.getCourseAttendanceSummary(
        courseId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
    );

    sendResponse(res, {
        message: "Course attendance summary retrieved successfully",
        data: result,
    });
});

/**
 * Get attendance summary for a student
 */
const getStudentAttendanceSummary = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await attendanceServices.getStudentAttendanceSummary(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
    );

    sendResponse(res, {
        message: "Student attendance summary retrieved successfully",
        data: result,
    });
});

/**
 * Create QR code for attendance check-in
 */
const createQRCode = catchAsync(async (req: Request, res: Response) => {
    const result = await attendanceServices.createQRCode(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "QR code created successfully",
        data: result,
    });
});

/**
 * Process QR code check-in
 */
const processQRCodeCheckIn = catchAsync(async (req: Request, res: Response) => {
    const result = await attendanceServices.processQRCodeCheckIn(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Check-in successful",
        data: result,
    });
});

/**
 * Create attendance session
 */
const createAttendanceSession = catchAsync(async (req: Request, res: Response) => {
    const result = await attendanceServices.createAttendanceSession(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Attendance session created successfully",
        data: result,
    });
});

/**
 * Get attendance dashboard data
 */
const getAttendanceDashboard = catchAsync(async (req: Request, res: Response) => {
    const result = await attendanceServices.getAttendanceDashboard();
    sendResponse(res, {
        message: "Attendance dashboard data retrieved successfully",
        data: result,
    });
});

export const attendanceControllers = {
    recordAttendance,
    updateAttendance,
    getAttendanceById,
    getAttendances,
    bulkMarkAttendance,
    getCourseAttendanceSummary,
    getStudentAttendanceSummary,
    createQRCode,
    processQRCodeCheckIn,
    createAttendanceSession,
    getAttendanceDashboard,
};