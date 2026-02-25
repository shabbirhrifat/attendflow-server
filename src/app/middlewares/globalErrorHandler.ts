/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorRequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { TErrorSources, TGenericErrorResponse } from '../interface/error';
import config from '../config';
import handleValidationError from '../errors/HandleValidationError';
import handleZodError from '../errors/HandleZodError';
import handleCastError from '../errors/HandleCastError';
import handleDuplicateError from '../errors/HandleMongooseError';
import handleDatabaseError from '../errors/HandleDatabaseError';
import AppError from '../errors/AppError';

/**
 * Global error handler for Express.js applications.
 * Handles errors that occur during the request-response cycle.
 * Now supports MongoDB/Mongoose errors instead of Prisma.
 */
const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res: Response<TGenericErrorResponse>,
  next
) => {
  console.error('Global Error Handler:', error);
  let statusCode = 500;
  let message = 'Something Went Wrong';
  let errorSources: TErrorSources = [{ path: ' ', message: 'Something Went Wrong' }];
  let stack: string | undefined;
  // Handle different error types
  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources ?? errorSources;
  } else if (error.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources ?? errorSources;
  } else if (error.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources ?? errorSources;
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    const simplifiedError = handleDuplicateError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources ?? errorSources;
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError' || error.name === 'CastError' || error.name === 'ValidationError') {
    // MongoDB/Mongoose errors
    const simplifiedError = handleDatabaseError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources ?? errorSources;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorSources = [{ path: ' ', message: error.message }];
  } else if (error instanceof Error) {
    message = error.message;
    errorSources = [{ path: ' ', message: error.message }];
  }

  // Only attach stack in development
  if (config.node_env === 'development' && error instanceof Error) {
    stack = error.stack;
  }

  // Base response (always safe for prod)
  const response: TGenericErrorResponse = {
    statusCode,
    success: false,
    message,
  };

  // Add debug info only in development
  if (config.node_env === 'development') {
    response.errorSources = errorSources;
    if (stack) response.stack = stack;
  }

  res.status(statusCode).json(response);
};

export default globalErrorHandler;
