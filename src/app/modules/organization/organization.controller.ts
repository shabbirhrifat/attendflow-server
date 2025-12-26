import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { OrganizationValidation } from './organization.validation';
import { IOrganizationResponse } from './organization.interface';
import sendResponse, { sendPaginatedResponse } from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsync';
import { StatusCodes } from 'http-status-codes';

// Department controllers
export const createDepartment = catchAsync(async (req: Request, res: Response) => {
    const validatedData = OrganizationValidation.createDepartment.parse(req.body);
    const result = await OrganizationService.createDepartment(validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Department created successfully',
        data: result,
    });
});

export const getDepartmentById = catchAsync(async (req: Request, res: Response) => {
    const { departmentId } = req.params;
    const result = await OrganizationService.getDepartmentById(departmentId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Department retrieved successfully',
        data: result,
    });
});

export const updateDepartment = catchAsync(async (req: Request, res: Response) => {
    const { departmentId } = req.params;
    const validatedData = OrganizationValidation.updateDepartment.parse(req.body);
    const result = await OrganizationService.updateDepartment(departmentId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Department updated successfully',
        data: result,
    });
});

export const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
    const { departmentId } = req.params;
    await OrganizationService.deleteDepartment(departmentId);

    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Department deleted successfully',
        data: null,
    });
});

export const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
    const filters = OrganizationValidation.departmentFilters.parse(req.query);
    const result = await OrganizationService.getAllDepartments(filters);

    sendPaginatedResponse(
        res,
        'departments',
        result.data.departments,
        result.meta,
        'Departments retrieved successfully',
        StatusCodes.OK
    );
});

export const getDepartmentStats = catchAsync(async (req: Request, res: Response) => {
    const result = await OrganizationService.getDepartmentStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Department statistics retrieved successfully',
        data: result,
    });
});

// Semester controllers
export const createSemester = catchAsync(async (req: Request, res: Response) => {
    const parsedData = OrganizationValidation.createSemester.parse(req.body);
    const validatedData = {
        ...parsedData,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(),
    };
    const result = await OrganizationService.createSemester(validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Semester created successfully',
        data: result,
    });
});

export const getSemesterById = catchAsync(async (req: Request, res: Response) => {
    const { semesterId } = req.params;
    const result = await OrganizationService.getSemesterById(semesterId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Semester retrieved successfully',
        data: result,
    });
});

export const updateSemester = catchAsync(async (req: Request, res: Response) => {
    const { semesterId } = req.params;
    const validatedData = {
        ...OrganizationValidation.updateSemester.parse(req.body),
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    };
    const result = await OrganizationService.updateSemester(semesterId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Semester updated successfully',
        data: result,
    });
});

export const deleteSemester = catchAsync(async (req: Request, res: Response) => {
    const { semesterId } = req.params;
    await OrganizationService.deleteSemester(semesterId);

    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Semester deleted successfully',
        data: null,
    });
});

export const getAllSemesters = catchAsync(async (req: Request, res: Response) => {
    const filters = OrganizationValidation.semesterFilters.parse(req.query);
    const result = await OrganizationService.getAllSemesters(filters);

    sendPaginatedResponse(
        res,
        'semesters',
        result.data.semesters,
        result.meta,
        'Semesters retrieved successfully',
        StatusCodes.OK
    );
});

export const getSemesterStats = catchAsync(async (req: Request, res: Response) => {
    const result = await OrganizationService.getSemesterStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Semester statistics retrieved successfully',
        data: result,
    });
});

// Batch controllers
export const createBatch = catchAsync(async (req: Request, res: Response) => {
    const parsedData = OrganizationValidation.createBatch.parse(req.body);
    const validatedData = {
        ...parsedData,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
        endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(),
    };
    const result = await OrganizationService.createBatch(validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Batch created successfully',
        data: result,
    });
});

export const getBatchById = catchAsync(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const result = await OrganizationService.getBatchById(batchId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Batch retrieved successfully',
        data: result,
    });
});

export const updateBatch = catchAsync(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    const validatedData = {
        ...OrganizationValidation.updateBatch.parse(req.body),
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    };
    const result = await OrganizationService.updateBatch(batchId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Batch updated successfully',
        data: result,
    });
});

export const deleteBatch = catchAsync(async (req: Request, res: Response) => {
    const { batchId } = req.params;
    await OrganizationService.deleteBatch(batchId);

    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Batch deleted successfully',
        data: null,
    });
});

export const getAllBatches = catchAsync(async (req: Request, res: Response) => {
    const filters = OrganizationValidation.batchFilters.parse(req.query);
    const result = await OrganizationService.getAllBatches(filters);

    sendPaginatedResponse(
        res,
        'batches',
        result.data.batches,
        result.meta,
        'Batches retrieved successfully',
        StatusCodes.OK
    );
});

export const getBatchStats = catchAsync(async (req: Request, res: Response) => {
    const result = await OrganizationService.getBatchStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Batch statistics retrieved successfully',
        data: result,
    });
});

// Subject controllers
export const createSubject = catchAsync(async (req: Request, res: Response) => {
    const validatedData = OrganizationValidation.createSubject.parse(req.body);
    const result = await OrganizationService.createSubject(validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        message: 'Subject created successfully',
        data: result,
    });
});

export const getSubjectById = catchAsync(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const result = await OrganizationService.getSubjectById(subjectId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Subject retrieved successfully',
        data: result,
    });
});

export const updateSubject = catchAsync(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    const validatedData = OrganizationValidation.updateSubject.parse(req.body);
    const result = await OrganizationService.updateSubject(subjectId, validatedData);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Subject updated successfully',
        data: result,
    });
});

export const deleteSubject = catchAsync(async (req: Request, res: Response) => {
    const { subjectId } = req.params;
    await OrganizationService.deleteSubject(subjectId);

    sendResponse(res, {
        statusCode: StatusCodes.NO_CONTENT,
        message: 'Subject deleted successfully',
        data: null,
    });
});

export const getAllSubjects = catchAsync(async (req: Request, res: Response) => {
    const filters = OrganizationValidation.subjectFilters.parse(req.query);
    const result = await OrganizationService.getAllSubjects(filters);

    sendPaginatedResponse(
        res,
        'subjects',
        result.data.subjects,
        result.meta,
        'Subjects retrieved successfully',
        StatusCodes.OK
    );
});

export const getSubjectStats = catchAsync(async (req: Request, res: Response) => {
    const result = await OrganizationService.getSubjectStats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Subject statistics retrieved successfully',
        data: result,
    });
});

// Organization overview controller
export const getOrganizationOverview = catchAsync(async (req: Request, res: Response) => {
    const result = await OrganizationService.getOrganizationOverview();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: 'Organization overview retrieved successfully',
        data: result,
    });
});

// Export all controllers
export const OrganizationController = {
    // Department controllers
    createDepartment,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
    getAllDepartments,
    getDepartmentStats,

    // Semester controllers
    createSemester,
    getSemesterById,
    updateSemester,
    deleteSemester,
    getAllSemesters,
    getSemesterStats,

    // Batch controllers
    createBatch,
    getBatchById,
    updateBatch,
    deleteBatch,
    getAllBatches,
    getBatchStats,

    // Subject controllers
    createSubject,
    getSubjectById,
    updateSubject,
    deleteSubject,
    getAllSubjects,
    getSubjectStats,

    // Organization overview controller
    getOrganizationOverview,
};
