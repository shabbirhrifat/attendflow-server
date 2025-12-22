/**
 * Assignment Module - Controller Layer
 * 
 * Handles HTTP requests for assignment operations
 */

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AssignmentService } from './assignment.service';

// ==================== TEACHER ASSIGNMENTS ====================

export const assignTeacherToDepartment = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignTeacherToDepartment(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

export const unassignTeacherFromDepartment = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await AssignmentService.unassignTeacherFromDepartment(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

// ==================== STUDENT ASSIGNMENTS ====================

export const assignStudentToBatch = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignStudentToBatch(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

export const assignStudentToDepartment = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignStudentToDepartment(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

// ==================== COURSE ASSIGNMENTS ====================

export const assignTeacherToCourse = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignTeacherToCourse(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

export const assignCourseToDepartment = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignCourseToDepartment(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

export const assignCourseToBatch = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignCourseToBatch(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

export const assignStudentToCourse = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignStudentToCourse(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

export const unenrollStudentFromCourse = catchAsync(async (req: Request, res: Response) => {
    const { studentId, courseId } = req.params;
    const result = await AssignmentService.unenrollStudentFromCourse(studentId, courseId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: undefined,
    });
});

// ==================== DEPARTMENT HEAD ASSIGNMENT ====================

export const assignDepartmentHead = catchAsync(async (req: Request, res: Response) => {
    const result = await AssignmentService.assignDepartmentHead(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});

export const AssignmentController = {
    assignTeacherToDepartment,
    unassignTeacherFromDepartment,
    assignStudentToBatch,
    assignStudentToDepartment,
    assignTeacherToCourse,
    assignCourseToDepartment,
    assignCourseToBatch,
    assignStudentToCourse,
    unenrollStudentFromCourse,
    assignDepartmentHead,
};
