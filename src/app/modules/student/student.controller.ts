import { Request, Response } from 'express';
import { studentServices } from "./student.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse, { sendPaginatedResponse } from "../../utils/sendResponse";
import { StatusCodes } from 'http-status-codes';
import { studentValidation } from './student.validation';

/** Create a new Student profile */
const createStudent = catchAsync(async (req: Request, res: Response) => {
    const result = await studentServices.createStudent(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Student profile created successfully",
        data: result,
    });
});

/** Get a single Student by ID */
const getSingleStudent = catchAsync(async (req: Request, res: Response) => {
    const result = await studentServices.getStudentById(req.params.id);
    sendResponse(res, {
        message: "Student retrieved successfully",
        data: result,
    });
});

/** Get a Student by User ID */
const getStudentByUserId = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await studentServices.getStudentByUserId(userId);
    sendResponse(res, {
        message: "Student retrieved successfully",
        data: result,
    });
});

/** Get all Students */
const getAllStudents = catchAsync(async (req: Request, res: Response) => {
    const result = await studentServices.getAllStudents(req.query);
    sendPaginatedResponse(res, "students", result.data, result.meta, "Students retrieved successfully");
});

/** Update a Student */
const updateStudent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await studentServices.updateStudent(id, req.body);
    sendResponse(res, {
        message: "Student updated successfully",
        data: result,
    });
});

/** Delete a Student */
const deleteStudent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await studentServices.deleteStudent(id);
    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: "Student deleted successfully",
        data: null,
    });
});

/** Get Student Profile */
const getStudentProfile = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await studentServices.getStudentProfile(id);
    sendResponse(res, {
        message: "Student profile retrieved successfully",
        data: result,
    });
});

/** Get Student Attendance Records */
const getStudentAttendance = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await studentServices.getStudentAttendance(id, req.query);
    sendPaginatedResponse(res, "attendances", result.data, result.meta, "Student attendance retrieved successfully");
});

/** Get Student Attendance by User ID */
const getStudentAttendanceByUserId = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    // Get student profile by user ID first, then get attendance
    const studentProfile = await studentServices.getStudentByUserId(userId);
    const result = await studentServices.getStudentAttendance(studentProfile.id, req.query);
    sendPaginatedResponse(res, "attendances", result.data, result.meta, "Student attendance retrieved successfully");
});

/** Get Student Attendance Summary */
const getStudentAttendanceSummary = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await studentServices.getStudentAttendanceSummary(id);
    sendResponse(res, {
        message: "Student attendance summary retrieved successfully",
        data: result,
    });
});

/** Submit Leave Request */
const submitLeaveRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await studentServices.submitLeaveRequest(id, req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: "Leave request submitted successfully",
        data: result,
    });
});

/** Update Student Profile */
const updateStudentProfile = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await studentServices.updateStudentProfile(id, req.body);
    sendResponse(res, {
        message: "Student profile updated successfully",
        data: result,
    });
});

/** Get Student Dashboard Data */
const getStudentDashboard = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await studentServices.getStudentDashboard(id);
    sendResponse(res, {
        message: "Student dashboard data retrieved successfully",
        data: result,
    });
});

/** Get Student Dashboard by User ID */
const getStudentDashboardByUserId = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    // Get student profile by user ID first, then get dashboard
    const studentProfile = await studentServices.getStudentByUserId(userId);
    const result = await studentServices.getStudentDashboard(studentProfile.id);
    sendResponse(res, {
        message: "Student dashboard data retrieved successfully",
        data: result,
    });
});

/** Get Student Profile by User ID */
const getStudentProfileByUserId = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    // Get student profile by user ID
    const result = await studentServices.getStudentByUserId(userId);
    sendResponse(res, {
        message: "Student profile retrieved successfully",
        data: result,
    });
});

/** Get Student Statistics */
const getStudentStats = catchAsync(async (req: Request, res: Response) => {
    const result = await studentServices.getStudentStats();
    sendResponse(res, {
        message: "Student statistics retrieved successfully",
        data: result,
    });
});

export const studentControllers = {
    createStudent,
    getSingleStudent,
    getStudentByUserId,
    getAllStudents,
    updateStudent,
    deleteStudent,
    getStudentProfile,
    getStudentProfileByUserId,
    getStudentAttendance,
    getStudentAttendanceByUserId,
    getStudentAttendanceSummary,
    submitLeaveRequest,
    updateStudentProfile,
    getStudentDashboard,
    getStudentDashboardByUserId,
    getStudentStats,
};
