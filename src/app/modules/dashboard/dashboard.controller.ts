import { Request, Response } from 'express';
import { z } from 'zod';
import DashboardService from './dashboard.service';
import sendResponse from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsync';
import validateRequest from '../../middlewares/validateRequest';
import { AuthMiddleware } from '../auth/auth.middleware';
import { DashboardValidation } from './dashboard.validation';

// Dashboard Overview Controller
export const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, departmentId, batchId } = req.query;

    // Convert string dates to Date objects
    const processedQuery = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        departmentId: departmentId as string,
        batchId: batchId as string,
    };

    const result = await DashboardService.getDashboardOverview(processedQuery);

    sendResponse(res, {
        statusCode: 200,
        message: 'Dashboard overview retrieved successfully',
        data: result,
    });
});

// Class Level Statistics Controller
export const getClassLevelStats = catchAsync(async (req: Request, res: Response) => {
    const {
        courseId,
        batchId,
        departmentId,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder
    } = req.query;

    // Convert string values to appropriate types
    const processedQuery = {
        courseId: courseId as string,
        batchId: batchId as string,
        departmentId: departmentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await DashboardService.getClassLevelStats(processedQuery);

    sendResponse(res, {
        statusCode: 200,
        message: 'Class level statistics retrieved successfully',
        data: result,
    });
});

// Subject Level Statistics Controller
export const getSubjectLevelStats = catchAsync(async (req: Request, res: Response) => {
    const {
        subjectId,
        batchId,
        departmentId,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder
    } = req.query;

    // Convert string values to appropriate types
    const processedQuery = {
        subjectId: subjectId as string,
        batchId: batchId as string,
        departmentId: departmentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await DashboardService.getSubjectLevelStats(processedQuery);

    sendResponse(res, {
        statusCode: 200,
        message: 'Subject level statistics retrieved successfully',
        data: result,
    });
});

// Teacher Performance Data Controller
export const getTeacherPerformanceData = catchAsync(async (req: Request, res: Response) => {
    const {
        teacherId,
        courseId,
        batchId,
        departmentId,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder
    } = req.query;

    // Convert string values to appropriate types
    const processedQuery = {
        teacherId: teacherId as string,
        courseId: courseId as string,
        batchId: batchId as string,
        departmentId: departmentId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await DashboardService.getTeacherPerformanceData(processedQuery);

    sendResponse(res, {
        statusCode: 200,
        message: 'Teacher performance data retrieved successfully',
        data: result,
    });
});

// Low Attendance Alerts Controller
export const getLowAttendanceAlerts = catchAsync(async (req: Request, res: Response) => {
    const { threshold, page, limit } = req.query;

    // Convert string values to appropriate types
    const processedQuery = {
        threshold: threshold ? parseInt(threshold as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
    };

    const result = await DashboardService.getLowAttendanceAlerts(processedQuery);

    sendResponse(res, {
        statusCode: 200,
        message: 'Low attendance alerts retrieved successfully',
        data: result,
    });
});

// Attendance Report Controller
export const getAttendanceReport = catchAsync(async (req: Request, res: Response) => {
    const { reportType, startDate, endDate, departmentIds, batchIds, courseIds } = req.query;

    const processedQuery = {
        reportType: (reportType as string) || 'overall',
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        departmentIds: departmentIds ? (departmentIds as string).split(',') : [],
        batchIds: batchIds ? (batchIds as string).split(',') : [],
        courseIds: courseIds ? (courseIds as string).split(',') : [],
    };

    const result = await DashboardService.getAttendanceReport(processedQuery);

    sendResponse(res, {
        statusCode: 200,
        message: 'Attendance report generated successfully',
        data: result,
    });
});

export const DashboardController = {
    // Dashboard Overview
    getDashboardOverview: [
        AuthMiddleware.authorize('ADMIN'),
        validateRequest(DashboardValidation.dashboardQuery),
        getDashboardOverview,
    ],

    // Statistics
    getClassLevelStats: [
        AuthMiddleware.authorize('ADMIN'),
        validateRequest(DashboardValidation.classLevelStatsQuery),
        getClassLevelStats,
    ],

    getSubjectLevelStats: [
        AuthMiddleware.authorize('ADMIN'),
        validateRequest(DashboardValidation.subjectLevelStatsQuery),
        getSubjectLevelStats,
    ],

    getTeacherPerformanceData: [
        AuthMiddleware.authorize('ADMIN'),
        validateRequest(DashboardValidation.teacherPerformanceQuery),
        getTeacherPerformanceData,
    ],

    getLowAttendanceAlerts: [
        AuthMiddleware.authorize('ADMIN'),
        validateRequest(DashboardValidation.lowAttendanceAlertsQuery),
        getLowAttendanceAlerts,
    ],

    getAttendanceReport: [
        AuthMiddleware.authorize('ADMIN'),
        validateRequest(DashboardValidation.attendanceReportQuery),
        getAttendanceReport,
    ],
};

export default DashboardController;