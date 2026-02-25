// An instance of Error To Send Error With Various Status Code
class AppError extends Error {
  public statusCode;
  constructor(statusCode: number, message: string, stack = '') {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
