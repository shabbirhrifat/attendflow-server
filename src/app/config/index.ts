import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT,
  node_env: process.env.NODE_ENV,
  database_url: process.env.DATABASE_URL,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires: process.env.JWT_ACCESS_EXPIRES,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires: process.env.JWT_REFRESH_EXPIRES,
  jwt_reset_secret: process.env.JWT_RESET_SECRET,
  jwt_email_secret: process.env.JWT_EMAIL_SECRET,
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  email_pass: process.env.EMAIL_PASS,
  email_user: process.env.EMAIL_USER,
};
