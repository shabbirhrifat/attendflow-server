import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import allRoutes from './app/routes';
import path from 'path';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import './app/config/globalErrorMap';
import { auditMiddleware } from './app/modules/audit/audit.middleware';

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

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow for development
}));

// Middleware setup
app.use(express.json());

// Improved CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting configuration
// Auth limiter - 5 attempts per 15 minutes for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General API limiter - 100 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters to auth routes
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);

// Apply general rate limiter to all API routes
app.use('/api/v1', apiLimiter);

// Apply audit logging middleware (logs all modifications to sensitive endpoints)
// Excludes health check and public endpoints from audit logging
const auditExcludedPaths = ['/health', '/ping', '/public'];
app.use('/api/v1', auditMiddleware(auditExcludedPaths));

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
