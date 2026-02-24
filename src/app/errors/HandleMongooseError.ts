// A Custom Error Handler For Handling Mongoose Duplicate Key Errors

import { TErrorSources } from '../interface/error';
import { MongoError } from 'mongodb';

const handleDuplicateError = (err: any) => {
  const statusCode = 400;

  // Extract the field name from the MongoDB error
  let fieldName = 'Field';
  let fieldValue = 'value';

  if (err.code === 11000) {
    // MongoDB duplicate key error
    const keyValueMatch = err.message.match(/key: { ([^:]+): ["']?([^"')"]+)["']? }/);
    if (keyValueMatch) {
      fieldName = keyValueMatch[1];
      fieldValue = keyValueMatch[2];
    } else if (err.keyPattern) {
      fieldName = Object.keys(err.keyPattern).join(', ');
    }
  }

  const errorSources: TErrorSources = [
    {
      path: fieldName,
      message: `${fieldName} '${fieldValue}' already exists, try another`,
    },
  ];

  return {
    statusCode,
    message: `${fieldName} already exists, try another`,
    errorSources
  };
};

export default handleDuplicateError;
