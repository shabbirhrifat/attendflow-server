import { Request, Response } from 'express';
import { TeacherService } from './teacher.service';
import { TeacherValidation } from './teacher.validation';
import { ITeacherResponse } from './teacher.interface';
import sendResponse from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsync';
import { StatusCodes } from 'http-status-codes';

// Teacher profile controllers
export const createTeacherProfile = catchAsync(async (req: Request, res: Response) => {
    const validatedData = TeacherValidation.createTeacher.parse(req.body);
    const result = await TeacherService.createTeacherProfile(validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Teacher profile created successfully',
        data: result,
    });
});

export const getTeacherProfile = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await TeacherService.getTeacherProfile(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher profile retrieved successfully',
        data: result,
    });
});

export const getTeacherProfileByUserId = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await TeacherService.getTeacherProfileByUserId(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher profile retrieved successfully',
        data: result,
    });
});

export const updateTeacherProfile = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const validatedData = TeacherValidation.updateTeacher.parse(req.body);
    const result = await TeacherService.updateTeacherProfile(teacherId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher profile updated successfully',
        data: result,
    });
});

export const deleteTeacherProfile = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    await TeacherService.deleteTeacherProfile(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Teacher profile deleted successfully',
        data: null,
    });
});

export const getAllTeachers = catchAsync(async (req: Request, res: Response) => {
    const filters = TeacherValidation.teacherFilters.parse(req.query) as any;
    const result = await TeacherService.getAllTeachers(filters);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teachers retrieved successfully',
        data: result,
    });
});

export const getTeacherStats = catchAsync(async (req: Request, res: Response) => {
    const result = await TeacherService.getTeacherStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher statistics retrieved successfully',
        data: result,
    });
});

// Attendance controllers
export const markAttendance = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const validatedData = TeacherValidation.markAttendance.parse(req.body);
    validatedData.date = validatedData.date;
    const result = await TeacherService.markAttendance(teacherId, {
        ...validatedData,
        checkIn: validatedData.checkIn ? new Date(validatedData.checkIn) : undefined,
        checkOut: validatedData.checkOut ? new Date(validatedData.checkOut) : undefined,
    });

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Attendance marked successfully',
        data: result,
    });
});

export const bulkMarkAttendance = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const validatedData = TeacherValidation.bulkMarkAttendance.parse(req.body);
    validatedData.date = validatedData.date;
    const result = await TeacherService.bulkMarkAttendance(teacherId, {
        ...validatedData,
        attendances: validatedData.attendances.map(attendance => ({
            ...attendance,
            checkIn: attendance.checkIn ? new Date(attendance.checkIn) : undefined,
            checkOut: attendance.checkOut ? new Date(attendance.checkOut) : undefined,
        })),
    });

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Attendance marked successfully for all students',
        data: result,
    });
});

export const getCourseAttendance = catchAsync(async (req: Request, res: Response) => {
    const { teacherId, courseId } = req.params;
    const filters = TeacherValidation.attendanceQuery.parse(req.query) as any;
    const result = await TeacherService.getCourseAttendance(teacherId, courseId, filters);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Course attendance retrieved successfully',
        data: result,
    });
});

export const getCourseAttendanceSummary = catchAsync(async (req: Request, res: Response) => {
    const { teacherId, courseId } = req.params;
    const { startDate, endDate } = req.query;
    const result = await TeacherService.getCourseAttendanceSummary(
        teacherId,
        courseId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Course attendance summary retrieved successfully',
        data: result,
    });
});

// Leave management controllers
export const getPendingLeaveRequests = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await TeacherService.getPendingLeaveRequests(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Pending leave requests retrieved successfully',
        data: result,
    });
});

export const processLeaveRequest = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const validatedData = TeacherValidation.leaveApproval.parse(req.body);
    const result = await TeacherService.processLeaveRequest(teacherId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: `Leave request ${validatedData.status.toLowerCase()}d successfully`,
        data: result,
    });
});

export const getProcessedLeaves = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await TeacherService.getProcessedLeaves(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Processed leaves retrieved successfully',
        data: result,
    });
});

// Class schedule controllers
export const createClassSchedule = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const validatedData = TeacherValidation.createClassSchedule.parse(req.body);
    const result = await TeacherService.createClassSchedule(teacherId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Class schedule created successfully',
        data: result,
    });
});

export const getTeacherSchedules = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await TeacherService.getTeacherSchedules(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher schedules retrieved successfully',
        data: result,
    });
});

export const getTodaySchedule = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await TeacherService.getTodaySchedule(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Today's schedule retrieved successfully",
        data: result,
    });
});

export const updateClassSchedule = catchAsync(async (req: Request, res: Response) => {
    const { teacherId, scheduleId } = req.params;
    const validatedData = TeacherValidation.createClassSchedule.parse(req.body);
    const result = await TeacherService.updateClassSchedule(teacherId, scheduleId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Class schedule updated successfully',
        data: result,
    });
});

export const deleteClassSchedule = catchAsync(async (req: Request, res: Response) => {
    const { teacherId, scheduleId } = req.params;
    await TeacherService.deleteClassSchedule(teacherId, scheduleId);

    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Class schedule deleted successfully',
        data: null,
    });
});

// Subject management controllers
export const createSubject = catchAsync(async (req: Request, res: Response) => {
    const validatedData = TeacherValidation.createSubject.parse(req.body);
    const result = await TeacherService.createSubject(validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Subject created successfully',
        data: result,
    });
});

export const getAllSubjects = catchAsync(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await TeacherService.getAllSubjects(filters);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Subjects retrieved successfully',
        data: result,
    });
});

export const getSubjectById = catchAsync(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const result = await TeacherService.getSubjectById(subjectId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Subject retrieved successfully',
        data: result,
    });
});

export const updateSubject = catchAsync(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const validatedData = TeacherValidation.updateSubject.parse(req.body);
    const result = await TeacherService.updateSubject(subjectId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Subject updated successfully',
        data: result,
    });
});

export const deleteSubject = catchAsync(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    await TeacherService.deleteSubject(subjectId);

    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Subject deleted successfully',
        data: null,
    });
});


// Dashboard controller
export const getTeacherDashboard = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await TeacherService.getTeacherDashboard(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher dashboard retrieved successfully',
        data: result,
    });
});

// Teacher assignment controllers
export const assignTeacherToDepartment = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const validatedData = TeacherValidation.teacherDepartmentAssignment.parse(req.body);
    const result = await TeacherService.assignTeacherToDepartment(teacherId, validatedData.departmentId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher assigned to department successfully',
        data: result,
    });
});

export const removeTeacherFromDepartment = catchAsync(async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const result = await TeacherService.removeTeacherFromDepartment(teacherId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teacher removed from department successfully',
        data: result,
    });
});

export const bulkAssignTeachersToDepartment = catchAsync(async (req: Request, res: Response) => {
    const validatedData = TeacherValidation.bulkTeacherAssignment.parse(req.body);
    const result = await TeacherService.bulkAssignTeachersToDepartment(validatedData.teacherIds, validatedData.departmentId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Teachers assigned to department successfully',
        data: result,
    });
});

export const getUnassignedTeachers = catchAsync(async (req: Request, res: Response) => {
    const result = await TeacherService.getUnassignedTeachers();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Unassigned teachers retrieved successfully',
        data: result,
    });
});

// Export all controllers
export const TeacherController = {
    // Profile controllers
    createTeacherProfile,
    getTeacherProfile,
    getTeacherProfileByUserId,
    updateTeacherProfile,
    deleteTeacherProfile,
    getAllTeachers,
    getTeacherStats,

    // Attendance controllers
    markAttendance,
    bulkMarkAttendance,
    getCourseAttendance,
    getCourseAttendanceSummary,

    // Leave management controllers
    getPendingLeaveRequests,
    processLeaveRequest,
    getProcessedLeaves,

    // Class schedule controllers
    createClassSchedule,
    getTeacherSchedules,
    getTodaySchedule,
    updateClassSchedule,
    deleteClassSchedule,

    // Subject management controllers
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,

    // Dashboard controller
    getTeacherDashboard,

    // Teacher assignment controllers
    assignTeacherToDepartment,
    removeTeacherFromDepartment,
    bulkAssignTeachersToDepartment,
    getUnassignedTeachers,
};
