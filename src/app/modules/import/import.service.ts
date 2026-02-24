import { IImportExecution, ImportType } from './import.interface';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import { hashInfo } from '../../utils/hashInfo';
import UserModel from '../user/user.model';
import { CourseModel } from '../course/course.model';
import { DepartmentModel, BatchModel } from '../organization/organization.model';
import { StudentModel } from '../student/student.model';
import { TeacherModel } from '../teacher/teacher.model';

// CSV Row interfaces
interface StudentCsvRow {
  email: string;
  firstName: string;
  lastName: string;
  studentId: string;
  batch?: string;
  department?: string;
  phone?: string;
}

interface TeacherCsvRow {
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department?: string;
  phone?: string;
}

interface CourseCsvRow {
  code: string;
  name: string;
  department?: string;
  credits?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  updated: number;
  created: number;
  errors: ValidationError[];
}

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateStudentRow = (row: any, rowNumber: number): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!row.email || !validateEmail(row.email)) {
    errors.push({ row: rowNumber, field: 'email', message: 'Invalid email format', value: row.email });
  }
  if (!row.firstName) {
    errors.push({ row: rowNumber, field: 'firstName', message: 'First name is required' });
  }
  if (!row.lastName) {
    errors.push({ row: rowNumber, field: 'lastName', message: 'Last name is required' });
  }
  if (!row.studentId) {
    errors.push({ row: rowNumber, field: 'studentId', message: 'Student ID is required' });
  }

  return errors;
};

const validateTeacherRow = (row: any, rowNumber: number): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!row.email || !validateEmail(row.email)) {
    errors.push({ row: rowNumber, field: 'email', message: 'Invalid email format', value: row.email });
  }
  if (!row.firstName) {
    errors.push({ row: rowNumber, field: 'firstName', message: 'First name is required' });
  }
  if (!row.lastName) {
    errors.push({ row: rowNumber, field: 'lastName', message: 'Last name is required' });
  }
  if (!row.employeeId) {
    errors.push({ row: rowNumber, field: 'employeeId', message: 'Employee ID is required' });
  }

  return errors;
};

const validateCourseRow = (row: any, rowNumber: number): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!row.code) {
    errors.push({ row: rowNumber, field: 'code', message: 'Course code is required' });
  }
  if (!row.name) {
    errors.push({ row: rowNumber, field: 'name', message: 'Course name is required' });
  }

  return errors;
};

// Import Students
const importStudents = async (rows: StudentCsvRow[], options: any): Promise<ImportResult> => {
  const result: ImportResult = {
    total: rows.length,
    success: 0,
    failed: 0,
    updated: 0,
    created: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // CSV rows are 1-indexed, +1 for header

    try {
      // Validate row
      const errors = validateStudentRow(row, rowNum);
      if (errors.length > 0) {
        result.errors.push(...errors);
        result.failed++;
        continue;
      }

      // Check if student exists by email or studentId
      const existingStudentUser = await UserModel.findByEmail(row.email);
      const existingStudent = existingStudentUser ? await StudentModel.findByStudentId(row.studentId) : null;

      // Hash password (default password is studentId)
      const hashedPassword = await hashInfo(row.studentId);

      const studentData = {
        email: row.email,
        name: `${row.firstName} ${row.lastName}`,
        password: hashedPassword,
        role: 'STUDENT' as const,
        phone: row.phone || undefined,
        status: 'ACTIVE' as const,
      };

      if (existingStudent && options.updateExisting) {
        // Update existing student user
        await UserModel.update(existingStudent.userId.toString(), studentData);
        result.updated++;
        result.success++;
      } else if (!existingStudent && !options.skipDuplicates) {
        // Create new student user and profile
        const newUser = await UserModel.create(studentData);

        // Find batch and department by name
        let batchId: string | undefined;
        let departmentId: string | undefined;

        if (row.batch) {
          const batch = await BatchModel.model.findOne({ name: row.batch });
          if (batch) batchId = batch._id.toString();
        }

        if (row.department) {
          const department = await DepartmentModel.model.findOne({ name: row.department });
          if (department) departmentId = department._id.toString();
        }

        await StudentModel.model.create({
          userId: newUser._id.toString(),
          studentId: row.studentId,
          batchId,
          departmentId,
        });

        result.created++;
        result.success++;
      } else if (existingStudent && options.skipDuplicates) {
        // Skip existing
        result.success++;
      } else {
        result.failed++;
      }
    } catch (error: any) {
      result.errors.push({
        row: rowNum,
        field: 'general',
        message: error.message || 'Failed to import student',
      });
      result.failed++;
    }
  }

  return result;
};

// Import Teachers
const importTeachers = async (rows: TeacherCsvRow[], options: any): Promise<ImportResult> => {
  const result: ImportResult = {
    total: rows.length,
    success: 0,
    failed: 0,
    updated: 0,
    created: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const errors = validateTeacherRow(row, rowNum);
      if (errors.length > 0) {
        result.errors.push(...errors);
        result.failed++;
        continue;
      }

      const existingTeacherUser = await UserModel.findByEmail(row.email);
      const existingTeacher = existingTeacherUser ? await TeacherModel.findByEmployeeId(row.employeeId) : null;

      const hashedPassword = await hashInfo(row.employeeId);

      const teacherData = {
        email: row.email,
        name: `${row.firstName} ${row.lastName}`,
        password: hashedPassword,
        role: 'TEACHER' as const,
        phone: row.phone || undefined,
        status: 'ACTIVE' as const,
      };

      if (existingTeacher && options.updateExisting) {
        await UserModel.update(existingTeacher.userId.toString(), teacherData);
        result.updated++;
        result.success++;
      } else if (!existingTeacher && !options.skipDuplicates) {
        const newUser = await UserModel.create(teacherData);

        // Find department by name
        let departmentId: string | undefined;
        if (row.department) {
          const department = await DepartmentModel.model.findOne({ name: row.department });
          if (department) departmentId = department._id.toString();
        }

        await TeacherModel.model.create({
          userId: newUser._id.toString(),
          employeeId: row.employeeId,
          departmentId,
        });

        result.created++;
        result.success++;
      } else if (existingTeacher && options.skipDuplicates) {
        result.success++;
      } else {
        result.failed++;
      }
    } catch (error: any) {
      result.errors.push({
        row: rowNum,
        field: 'general',
        message: error.message || 'Failed to import teacher',
      });
      result.failed++;
    }
  }

  return result;
};

// Import Courses
const importCourses = async (rows: CourseCsvRow[], options: any): Promise<ImportResult> => {
  const result: ImportResult = {
    total: rows.length,
    success: 0,
    failed: 0,
    updated: 0,
    created: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const errors = validateCourseRow(row, rowNum);
      if (errors.length > 0) {
        result.errors.push(...errors);
        result.failed++;
        continue;
      }

      const existingCourse = await CourseModel.model.findOne({ code: row.code });

      const courseData = {
        code: row.code,
        title: row.name,
        credits: row.credits ? parseInt(row.credits) : 3,
      };

      if (existingCourse && options.updateExisting) {
        await CourseModel.model.findByIdAndUpdate(existingCourse._id, courseData);
        result.updated++;
        result.success++;
      } else if (!existingCourse && !options.skipDuplicates) {
        await CourseModel.model.create(courseData);
        result.created++;
        result.success++;
      } else if (existingCourse && options.skipDuplicates) {
        result.success++;
      } else {
        result.failed++;
      }
    } catch (error: any) {
      result.errors.push({
        row: rowNum,
        field: 'general',
        message: error.message || 'Failed to import course',
      });
      result.failed++;
    }
  }

  return result;
};

// Main import execution
const executeImport = async (payload: IImportExecution): Promise<ImportResult> => {
  const { type, fileId, options } = payload;

  // In a real implementation, you would:
  // 1. Retrieve the file from storage using fileId
  // 2. Parse the CSV/Excel file
  // 3. Validate each row
  // 4. Execute bulk operations in a transaction

  // For now, return mock data
  if (type === 'users') {
    return importStudents([], options);
  } else if (type === 'courses') {
    return importCourses([], options);
  }

  return {
    total: 0,
    success: 0,
    failed: 0,
    updated: 0,
    created: 0,
    errors: [],
  };
};

const validateFile = async (type: ImportType, file: Express.Multer.File): Promise<{
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: any[];
  needsMapping: boolean;
}> => {
  // For now, return mock data
  // In a real implementation:
  // 1. Parse CSV/Excel file
  // 2. Validate against schema
  // 3. Return preview and validation results

  return {
    valid: true,
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    preview: [],
    needsMapping: false,
  };
};

export const ImportService = {
  validateFile,
  executeImport,
  importStudents,
  importTeachers,
  importCourses,
};
