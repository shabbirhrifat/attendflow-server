/**
 * Bulk Operations Module - Service Layer
 *
 * Handles batch create, update, and delete operations
 */

import prisma from '../../config/prisma';
import {
  IBulkCreateRequest,
  IBulkUpdateRequest,
  IBulkDeleteRequest,
  IBulkOperationResult,
  IBulkMarkAttendanceRequest,
  BulkEntityType,
} from './bulk.interface';
import { hashInfo } from '../../utils/hashInfo';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

/**
 * Bulk create users
 */
const bulkCreateUsers = async (
  data: any[],
  options: any = {}
): Promise<IBulkOperationResult> => {
  const result = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  const { continueOnError = true, skipDuplicates = false } = options;

  for (let i = 0; i < data.length; i++) {
    try {
      const userData = data[i];

      // Check if user already exists
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { username: userData.username }],
        },
      });

      if (existing && skipDuplicates) {
        result.failed++;
        result.errors.push({
          index: i,
          message: `User with email ${userData.email} already exists`,
        });
        continue;
      }

      // Hash password
      const hashedPassword = await hashInfo(userData.password || userData.email);

      if (existing && !skipDuplicates) {
        // Update existing
        await prisma.user.update({
          where: { id: existing.id },
          data: { ...userData, password: hashedPassword },
        });
      } else {
        // Create new
        await prisma.user.create({
          data: { ...userData, password: hashedPassword },
        });
      }

      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        index: i,
        message: error.message || 'Failed to create user',
      });

      if (!continueOnError) {
        break;
      }
    }
  }

  return {
    success: true,
    message: `Bulk create completed: ${result.success} succeeded, ${result.failed} failed`,
    data: result,
  };
};

/**
 * Bulk create students
 */
const bulkCreateStudents = async (
  data: any[],
  options: any = {}
): Promise<IBulkOperationResult> => {
  const result = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  const { continueOnError = true } = options;

  for (let i = 0; i < data.length; i++) {
    try {
      const studentData = data[i];

      // First create user if needed
      const hashedPassword = await hashInfo(studentData.password || studentData.email);

      const user = await prisma.user.upsert({
        where: { email: studentData.email },
        update: { password: hashedPassword },
        create: {
          email: studentData.email,
          name: studentData.name,
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      // Then create student profile
      await prisma.student.upsert({
        where: { userId: user.id },
        update: studentData,
        create: {
          userId: user.id,
          studentId: studentData.studentId || `STU${Date.now()}${i}`,
          semester: studentData.semester || 1,
        },
      });

      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        index: i,
        message: error.message || 'Failed to create student',
      });

      if (!continueOnError) {
        break;
      }
    }
  }

  return {
    success: true,
    message: `Bulk create completed: ${result.success} succeeded, ${result.failed} failed`,
    data: result,
  };
};

/**
 * Bulk update operation
 */
const bulkUpdate = async (
  entityType: BulkEntityType,
  ids: string[],
  updateData: Record<string, any>
): Promise<IBulkOperationResult> => {
  const result = {
    total: ids.length,
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  let model: any;
  switch (entityType) {
    case BulkEntityType.USER:
      model = prisma.user;
      break;
    case BulkEntityType.STUDENT:
      model = prisma.student;
      break;
    case BulkEntityType.TEACHER:
      model = prisma.teacher;
      break;
    case BulkEntityType.COURSE:
      model = prisma.course;
      break;
    case BulkEntityType.DEPARTMENT:
      model = prisma.department;
      break;
    default:
      throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid entity type');
  }

  for (const id of ids) {
    try {
      await model.update({
        where: { id },
        data: updateData,
      });
      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        entityId: id,
        message: error.message || 'Failed to update',
      });
    }
  }

  return {
    success: true,
    message: `Bulk update completed: ${result.success} succeeded, ${result.failed} failed`,
    data: result,
  };
};

/**
 * Bulk delete operation
 */
const bulkDelete = async (
  entityType: BulkEntityType,
  ids: string[]
): Promise<IBulkOperationResult> => {
  const result = {
    total: ids.length,
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  let model: any;
  switch (entityType) {
    case BulkEntityType.USER:
      model = prisma.user;
      break;
    case BulkEntityType.STUDENT:
      model = prisma.student;
      break;
    case BulkEntityType.TEACHER:
      model = prisma.teacher;
      break;
    case BulkEntityType.COURSE:
      model = prisma.course;
      break;
    case BulkEntityType.DEPARTMENT:
      model = prisma.department;
      break;
    case BulkEntityType.ATTENDANCE:
      model = prisma.attendance;
      break;
    default:
      throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid entity type');
  }

  try {
    const deleteResult = await model.deleteMany({
      where: { id: { in: ids } },
    });

    result.success = deleteResult.count;
    result.failed = ids.length - deleteResult.count;
  } catch (error: any) {
    result.failed = ids.length;
    result.errors.push({
      message: error.message || 'Failed to delete records',
    });
  }

  return {
    success: true,
    message: `Bulk delete completed: ${result.success} succeeded, ${result.failed} failed`,
    data: result,
  };
};

/**
 * Bulk mark attendance
 */
const bulkMarkAttendance = async (
  data: IBulkMarkAttendanceRequest
): Promise<IBulkOperationResult> => {
  const { courseId, date, attendance } = data;
  const attendanceDate = new Date(date);

  const result = {
    total: attendance.length,
    success: 0,
    failed: 0,
    errors: [] as any[],
  };

  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
  }

  for (const record of attendance) {
    try {
      // Find student by studentId
      const student = await prisma.student.findUnique({
        where: { id: record.studentId },
      });

      if (!student) {
        result.failed++;
        result.errors.push({
          entityId: record.studentId,
          message: 'Student not found',
        });
        continue;
      }

      // Create or update attendance
      await prisma.attendance.upsert({
        where: {
          userId_courseId_date: {
            userId: student.userId,
            courseId,
            date: attendanceDate,
          },
        },
        update: {
          status: record.status,
          notes: record.notes,
        },
        create: {
          userId: student.userId,
          courseId,
          date: attendanceDate,
          status: record.status,
          notes: record.notes,
        },
      });

      result.success++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        entityId: record.studentId,
        message: error.message || 'Failed to mark attendance',
      });
    }
  }

  return {
    success: true,
    message: `Bulk attendance marking completed: ${result.success} succeeded, ${result.failed} failed`,
    data: result,
  };
};

/**
 * General bulk create handler
 */
const bulkCreate = async (
  entityType: BulkEntityType,
  data: any[],
  options: any = {}
): Promise<IBulkOperationResult> => {
  switch (entityType) {
    case BulkEntityType.USER:
      return bulkCreateUsers(data, options);
    case BulkEntityType.STUDENT:
      return bulkCreateStudents(data, options);
    case BulkEntityType.TEACHER:
      return bulkCreateUsers(
        data.map((d) => ({ ...d, role: 'TEACHER' })),
        options
      );
    default:
      throw new AppError(StatusCodes.BAD_REQUEST, 'Bulk create not supported for this entity type');
  }
};

// Export all services
export const BulkService = {
  bulkCreate,
  bulkUpdate,
  bulkDelete,
  bulkMarkAttendance,
};
