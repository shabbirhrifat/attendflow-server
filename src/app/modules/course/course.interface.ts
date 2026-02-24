// Local type definitions for Course module

// Course interface
export interface ICourse {
  _id: string;
  title: string;
  code: string;
  description?: string;
  credits: number;
  batchId?: string;
  departmentId?: string;
  teacherId?: string;
  subjectId?: string;
  semesterId?: string;
  semester: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Course Enrollment interface
export interface ICourseEnrollment {
  _id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
}

// Class Schedule interface
export interface IClassSchedule {
  _id: string;
  teacherId?: string;
  courseId?: string;
  batchId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  semester: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User type (simplified)
export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

// Related types
export interface IDepartment {
  _id: string;
  name: string;
  code: string;
}

export interface ISubject {
  _id: string;
  name: string;
  code: string;
  credits: number;
}

export interface ISemester {
  _id: string;
  name: string;
  year: number;
}

export interface IBatch {
  _id: string;
  name: string;
  year: number;
}

// Course with related information
export interface ICourseWithRelations extends ICourse {
  teacher?: IUser;
  batch?: IBatch;
  department?: IDepartment;
  subject?: ISubject;
  semesterInfo?: ISemester;
  enrollments?: ICourseEnrollment[];
  schedules?: IClassSchedule[];
  enrollmentCount?: number;
}

// Course enrollment with related information
export interface ICourseEnrollmentWithRelations extends ICourseEnrollment {
  student?: IUser;
  course?: ICourse;
}

// Class schedule with related information
export interface IClassScheduleWithRelations extends IClassSchedule {
  teacher?: IUser;
  course?: ICourse;
  batch?: IBatch;
}

// For creating a new course
export interface ICourseCreate {
  title: string;
  code: string;
  description?: string;
  credits?: number;
  batchId?: string;
  departmentId?: string;
  teacherId?: string;
  subjectId?: string;
  semesterId?: string;
  semester?: number;
}

// For updating a course
export interface ICourseUpdate extends Partial<ICourseCreate> {
  isActive?: boolean;
}

// For creating a new course enrollment
export interface ICourseEnrollmentCreate {
  studentId: string;
  courseId: string;
}

// For creating a new class schedule
export interface IClassScheduleCreate {
  teacherId?: string;
  courseId?: string;
  batchId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  semester?: number;
}

// For updating a class schedule
export interface IClassScheduleUpdate extends Partial<IClassScheduleCreate> {
  isActive?: boolean;
}

// Filters for queries
export interface ICourseFilters {
  departmentId?: string;
  batchId?: string;
  teacherId?: string;
  subjectId?: string;
  semesterId?: string;
  isActive?: boolean;
  search?: string;
}

export interface ICourseEnrollmentFilters {
  studentId?: string;
  courseId?: string;
}

export interface IClassScheduleFilters {
  teacherId?: string;
  courseId?: string;
  batchId?: string;
  dayOfWeek?: number;
  semester?: number;
  isActive?: boolean;
}

// Statistics
export interface ICourseStats {
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
  coursesByDepartment: Array<{ departmentId: string; count: number }>;
}

export interface ICourseEnrollmentStats {
  totalEnrollments: number;
  enrollmentsByCourse: Record<string, number>;
  enrollmentsByStudent: Record<string, number>;
}

export interface IClassScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  inactiveSchedules: number;
  schedulesByDay: Record<number, number>;
}

// API Response types
export interface ICourseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
