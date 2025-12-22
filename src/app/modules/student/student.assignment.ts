import { Request, Response } from 'express';
import { studentServices } from './student.service';
import { z } from 'zod';
import sendResponse from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsync';
import { StatusCodes } from 'http-status-codes';
import validateRequest from '../../middlewares/validateRequest';

// Assignment validation schemas
const assignToBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
});

const assignToDepartmentSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
});

const assignToCourseSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

const bulkAssignToBatchSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
  studentIds: z.array(z.string().min(1, 'Student ID is required')).min(1, 'At least one student ID is required'),
});

const bulkAssignToDepartmentSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  studentIds: z.array(z.string().min(1, 'Student ID is required')).min(1, 'At least one student ID is required'),
});

// Student assignment controllers
export const assignStudentToBatch = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const validatedData = assignToBatchSchema.parse(req.body);

  const result = await studentServices.assignStudentToBatch(studentId, validatedData.batchId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Student assigned to batch successfully',
    data: result,
  });
});

export const removeStudentFromBatch = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const result = await studentServices.removeStudentFromBatch(studentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Student removed from batch successfully',
    data: result,
  });
});

export const assignStudentToDepartment = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const validatedData = assignToDepartmentSchema.parse(req.body);

  const result = await studentServices.assignStudentToDepartment(studentId, validatedData.departmentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Student assigned to department successfully',
    data: result,
  });
});

export const removeStudentFromDepartment = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const result = await studentServices.removeStudentFromDepartment(studentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Student removed from department successfully',
    data: result,
  });
});

export const assignStudentToCourse = catchAsync(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const validatedData = assignToCourseSchema.parse(req.body);

  const result = await studentServices.assignStudentToCourse(studentId, validatedData.courseId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Student assigned to course successfully',
    data: result,
  });
});

export const removeStudentFromCourse = catchAsync(async (req: Request, res: Response) => {
  const { studentId, courseId } = req.params;

  const result = await studentServices.removeStudentFromCourse(studentId, courseId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Student removed from course successfully',
    data: result,
  });
});

export const bulkAssignStudentsToBatch = catchAsync(async (req: Request, res: Response) => {
  const validatedData = bulkAssignToBatchSchema.parse(req.body);

  const result = await studentServices.bulkAssignStudentsToBatch(validatedData.studentIds, validatedData.batchId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Students assigned to batch successfully',
    data: result,
  });
});

export const bulkAssignStudentsToDepartment = catchAsync(async (req: Request, res: Response) => {
  const validatedData = bulkAssignToDepartmentSchema.parse(req.body);

  const result = await studentServices.bulkAssignStudentsToDepartment(validatedData.studentIds, validatedData.departmentId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Students assigned to department successfully',
    data: result,
  });
});

export const getUnassignedStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await studentServices.getUnassignedStudents();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Unassigned students retrieved successfully',
    data: result,
  });
});

// Export all assignment controllers
export const StudentAssignmentController = {
  assignStudentToBatch,
  removeStudentFromBatch,
  assignStudentToDepartment,
  removeStudentFromDepartment,
  assignStudentToCourse,
  removeStudentFromCourse,
  bulkAssignStudentsToBatch,
  bulkAssignStudentsToDepartment,
  getUnassignedStudents,
};
