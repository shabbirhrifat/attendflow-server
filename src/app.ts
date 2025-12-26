import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import allRoutes from './app/routes';
import path from 'path';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import './app/config/globalErrorMap';

const app: Application = express();

// Middleware setup

const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric', // Include seconds
    hour12: true,
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

// Middleware to log requests and responses
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, originalUrl } = req;
  const startTime = Date.now();

  res.on('finish', () => {
    const { statusCode } = res;
    const duration = Date.now() - startTime;
    const formattedDate = formatDate(new Date());

    // Color coding for status codes
    let statusColor = '\x1b[32m'; // Green for 2xx
    if (statusCode >= 500) {
      statusColor = '\x1b[31m'; // Red for 5xx
    } else if (statusCode >= 400) {
      statusColor = '\x1b[33m'; // Yellow for 4xx
    } else if (statusCode >= 300) {
      statusColor = '\x1b[36m'; // Cyan for 3xx
    }

    console.log(
      `Api :- \x1b[1m\x1b[34m${method}\x1b[0m \x1b[32m${originalUrl}\x1b[0m \x1b[35mQuery: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)}\x1b[0m ${statusColor}${statusCode}\x1b[0m \x1b[90m(${duration}ms)\x1b[0m \x1b[36m[${formattedDate}]\x1b[0m`
    );
  });

  next();
};

app.use(requestLogger);
// Middleware setup
app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:5173', "http://localhost:3000"],
    credentials: true,
  })
);

// Serve static files from the public directory
const publicDirPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicDirPath));

// Use routes
app.use('/api/v1', allRoutes);

// Test route
const test = (req: Request, res: Response) => {
  res.send('Hello From AttendFlow!');
};
app.get('/', test);

// Global error handler
app.use(globalErrorHandler);

// Handle 404 - Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.url}`,
  });
});

export default app;
