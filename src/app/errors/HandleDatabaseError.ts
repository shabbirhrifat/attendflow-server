import { TErrorSources, TGenericErrorResponse } from '../interface/error';
import { MongoError } from 'mongodb';

const handleDatabaseError = (err: any): TGenericErrorResponse => {
  let statusCode = 400;
  let message = 'Database Error';
  let errorSources: TErrorSources = [];

  // Check if it's a MongoDB error
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    const mongoErr = err as MongoError;

    switch (mongoErr.code) {
      case 11000: // Duplicate key error
        const keyValueMatch = err.message.match(/key: { ([^:]+): ["']?([^"')"]+)["']? }/);
        const field = keyValueMatch ? keyValueMatch[1] : 'Field';
        const value = keyValueMatch ? keyValueMatch[2] : '';
        message = `${field} already exists`;
        errorSources = [
          {
            path: field,
            message: `${field} '${value}' must be unique`,
          },
        ];
        break;

      default:
        message = err.message || 'Database operation failed';
        errorSources = [
          {
            path: 'database',
            message: err.message,
          },
        ];
    }
  } else if (err.name === 'CastError') {
    // Mongoose CastError (invalid ObjectId)
    statusCode = 400;
    message = 'Invalid ID format';
    errorSources = [
      {
        path: err.path || 'id',
        message: 'The provided ID is not a valid MongoDB ObjectId',
      },
    ];
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    errorSources = Object.values(err.errors).map((e: any) => ({
      path: e.path,
      message: e.message,
    }));
  } else if (err.name === 'DocumentNotFoundError') {
    statusCode = 404;
    message = 'Record not found';
    errorSources = [
      {
        path: 'id',
        message: 'The requested record does not exist',
      },
    ];
  } else {
    message = err.message || 'Database operation failed';
    errorSources = [
      {
        path: 'database',
        message: err.message,
      },
    ];
  }

  return {
    statusCode,
    success: false,
    message,
    errorSources,
  };
};

export default handleDatabaseError;
