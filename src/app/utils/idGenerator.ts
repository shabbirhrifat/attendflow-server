import prisma from '../config/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique student ID with format AFS### (AttendFlow Student)
 * @returns Promise<string> - Generated student ID
 */
export const generateStudentId = async (): Promise<string> => {
  const prefix = 'AFS';
  
  try {
    // Get the highest existing student ID number
    const lastStudent = await prisma.student.findFirst({
      where: {
        studentId: {
          startsWith: prefix
        }
      },
      orderBy: {
        studentId: 'desc'
      },
      select: {
        studentId: true
      }
    });

    let nextNumber = 1;
    
    if (lastStudent) {
      // Extract the numeric part from the last ID
      const lastNumber = parseInt(lastStudent.studentId.replace(prefix, ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Generate new ID with zero padding (3 digits)
    const newStudentId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    // Double-check if the generated ID already exists (race condition protection)
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: newStudentId }
    });

    if (existingStudent) {
      // If it exists, try again with the next number
      return generateStudentId();
    }

    return newStudentId;
  } catch (error) {
    console.error('Error generating student ID:', error);
    throw new Error('Failed to generate student ID');
  }
};

/**
 * Generate a unique teacher ID with format AFT### (AttendFlow Teacher)
 * @returns Promise<string> - Generated teacher ID
 */
export const generateTeacherId = async (): Promise<string> => {
  const prefix = 'AFT';
  
  try {
    // Get the highest existing teacher ID number
    const lastTeacher = await prisma.teacher.findFirst({
      where: {
        employeeId: {
          startsWith: prefix
        }
      },
      orderBy: {
        employeeId: 'desc'
      },
      select: {
        employeeId: true
      }
    });

    let nextNumber = 1;
    
    if (lastTeacher) {
      // Extract the numeric part from the last ID
      const lastNumber = parseInt(lastTeacher.employeeId.replace(prefix, ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Generate new ID with zero padding (3 digits)
    const newTeacherId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    
    // Double-check if the generated ID already exists (race condition protection)
    const existingTeacher = await prisma.teacher.findUnique({
      where: { employeeId: newTeacherId }
    });

    if (existingTeacher) {
      // If it exists, try again with the next number
      return generateTeacherId();
    }

    return newTeacherId;
  } catch (error) {
    console.error('Error generating teacher ID:', error);
    throw new Error('Failed to generate teacher ID');
  }
};

/**
 * Generate a unique student ID with custom format
 * @param prefix - Custom prefix (default: 'AFS')
 * @param padding - Number of digits for padding (default: 3)
 * @returns Promise<string> - Generated student ID
 */
export const generateCustomStudentId = async (
  prefix: string = 'AFS', 
  padding: number = 3
): Promise<string> => {
  try {
    const lastStudent = await prisma.student.findFirst({
      where: {
        studentId: {
          startsWith: prefix
        }
      },
      orderBy: {
        studentId: 'desc'
      },
      select: {
        studentId: true
      }
    });

    let nextNumber = 1;
    
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentId.replace(prefix, ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const newStudentId = `${prefix}${nextNumber.toString().padStart(padding, '0')}`;
    
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: newStudentId }
    });

    if (existingStudent) {
      return generateCustomStudentId(prefix, padding);
    }

    return newStudentId;
  } catch (error) {
    console.error('Error generating custom student ID:', error);
    throw new Error('Failed to generate custom student ID');
  }
};

/**
 * Generate a unique teacher ID with custom format
 * @param prefix - Custom prefix (default: 'AFT')
 * @param padding - Number of digits for padding (default: 3)
 * @returns Promise<string> - Generated teacher ID
 */
export const generateCustomTeacherId = async (
  prefix: string = 'AFT', 
  padding: number = 3
): Promise<string> => {
  try {
    const lastTeacher = await prisma.teacher.findFirst({
      where: {
        employeeId: {
          startsWith: prefix
        }
      },
      orderBy: {
        employeeId: 'desc'
      },
      select: {
        employeeId: true
      }
    });

    let nextNumber = 1;
    
    if (lastTeacher) {
      const lastNumber = parseInt(lastTeacher.employeeId.replace(prefix, ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const newTeacherId = `${prefix}${nextNumber.toString().padStart(padding, '0')}`;
    
    const existingTeacher = await prisma.teacher.findUnique({
      where: { employeeId: newTeacherId }
    });

    if (existingTeacher) {
      return generateCustomTeacherId(prefix, padding);
    }

    return newTeacherId;
  } catch (error) {
    console.error('Error generating custom teacher ID:', error);
    throw new Error('Failed to generate custom teacher ID');
  }
};

/**
 * Generate a unique user ID with meaningful convention
 * @param role - User role ('STUDENT' or 'TEACHER')
 * @param name - User name to create meaningful ID
 * @returns string - Generated user ID
 */
export const generateUserId = (role: 'STUDENT' | 'TEACHER', name?: string): string => {
  const timestamp = Date.now().toString(36); // Convert to base36 for shorter ID
  const randomSuffix = Math.random().toString(36).substring(2, 8); // Random string for uniqueness
  
  let prefix = 'usr';
  if (role === 'STUDENT') {
    prefix = 'stu';
  } else if (role === 'TEACHER') {
    prefix = 'tch';
  }

  // If name is provided, create a more meaningful ID
  if (name && name.trim()) {
    const namePart = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .substring(0, 4); // Take first 4 characters
    return `${prefix}_${namePart}_${timestamp}_${randomSuffix}`;
  }

  return `${prefix}_${timestamp}_${randomSuffix}`;
};

/**
 * Generate a meaningful user ID for student
 * @param studentName - Student name
 * @returns string - Generated user ID
 */
export const generateStudentUserId = (studentName?: string): string => {
  return generateUserId('STUDENT', studentName);
};

/**
 * Generate a meaningful user ID for teacher
 * @param teacherName - Teacher name
 * @returns string - Generated user ID
 */
export const generateTeacherUserId = (teacherName?: string): string => {
  return generateUserId('TEACHER', teacherName);
};
