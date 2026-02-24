import mongoose from 'mongoose';

/**
 * MongoDB connection singleton for AttendFlow
 * Handles connection events and provides a stable connection across the application
 */

const mongooseConnectionSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Configure Mongoose options
  const options = {
    // Auto-create indexes in development
    autoIndex: process.env.NODE_ENV !== 'production',
    // Use new URL parser
    // @ts-ignore - useNewUrlParser is deprecated but still used in some environments
    useNewUrlParser: true,
    // Use unified topology
    useUnifiedTopology: true,
    // Server selection timeout
    serverSelectionTimeoutMS: 5000,
    // Socket timeout
    socketTimeoutMS: 45000,
    // Max pool size
    maxPoolSize: 10,
    // Min pool size
    minPoolSize: 2,
  };

  // Create Mongoose connection
  const mongooseInstance = mongoose.createConnection(connectionString, options);

  // Connection event handlers
  mongooseInstance.on('connected', () => {
    console.log('MongoDB connected successfully');
  });

  mongooseInstance.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });

  mongooseInstance.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    await mongooseInstance.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });

  return mongooseInstance;
};

// Global type for Mongoose connection
declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: undefined | ReturnType<typeof mongooseConnectionSingleton>;
}

// Create singleton connection
const mongooseConnection = globalThis.mongooseGlobal ?? mongooseConnectionSingleton();

// Export the connection
export default mongooseConnection;

// Export mongoose for models
export { mongoose };

if (process.env.NODE_ENV !== 'production') {
  globalThis.mongooseGlobal = mongooseConnection;
}
