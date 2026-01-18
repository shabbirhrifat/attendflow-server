/**
 * Bulk Operations Module - Controller Layer
 *
 * Handles HTTP requests for bulk operations
 */

import { Request, Response, NextFunction } from 'express';
import { BulkService } from './bulk.service';
import { BulkEntityType } from './bulk.interface';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';

/**
 * Bulk create entities
 */
export const bulkCreate = catchAsync(async (req: Request, res: Response) => {
  const { entityType, data, options } = req.body;

  if (!entityType || !data || !Array.isArray(data)) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: 'Invalid request: entityType and data array are required',
    });
  }

  const result = await BulkService.bulkCreate(entityType, data, options);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

/**
 * Bulk update entities
 */
export const bulkUpdate = catchAsync(async (req: Request, res: Response) => {
  const { entityType, ids, data } = req.body;

  if (!entityType || !ids || !Array.isArray(ids) || !data) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: 'Invalid request: entityType, ids array, and data are required',
    });
  }

  const result = await BulkService.bulkUpdate(entityType, ids, data);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

/**
 * Bulk delete entities
 */
export const bulkDelete = catchAsync(async (req: Request, res: Response) => {
  const { entityType, ids } = req.body;

  if (!entityType || !ids || !Array.isArray(ids)) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: 'Invalid request: entityType and ids array are required',
    });
  }

  const result = await BulkService.bulkDelete(entityType, ids);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

/**
 * Bulk mark attendance
 */
export const bulkMarkAttendance = catchAsync(async (req: Request, res: Response) => {
  const { courseId, date, attendance } = req.body;

  if (!courseId || !date || !attendance || !Array.isArray(attendance)) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: 'Invalid request: courseId, date, and attendance array are required',
    });
  }

  const result = await BulkService.bulkMarkAttendance({ courseId, date, attendance });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

// Export all controllers
export const BulkController = {
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  bulkMarkAttendance,
};
