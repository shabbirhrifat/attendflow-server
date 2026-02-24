// User type (simplified, matching User schema)
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  avatar?: string;
}

// Course type (simplified, matching Course schema)
export interface ICourse {
  id: string;
  title: string;
  code: string;
  credits: number;
  isActive: boolean;
}

// Attendance status type
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

// Base attendance interface
export interface IAttendance {
  _id: string;
  userId: string;
  courseId: string;
  date: Date;
  status: AttendanceStatus;
  checkIn?: Date;
  checkOut?: Date;
  notes?: string;
  markedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance with relationships
export interface IAttendanceWithRelations extends IAttendance {
  user: IUser;
  course: ICourse;
  student?: any;
  marker?: IUser;
}

// Create attendance interface
export interface IAttendanceCreate {
  userId: string;
  courseId: string;
  date: Date;
  status: AttendanceStatus;
  checkIn?: Date;
  checkOut?: Date;
  notes?: string;
  markedBy?: string;
}

// Update attendance interface
export interface IAttendanceUpdate {
  status?: AttendanceStatus;
  checkIn?: Date;
  checkOut?: Date;
  notes?: string;
  markedBy?: string;
}

// Bulk attendance marking interface
export interface IBulkAttendanceCreate {
  courseId: string;
  date: Date;
  attendances: {
    userId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
  markedBy: string;
}

// Attendance Session interface
export interface IAttendanceSession {
  id: string;
  _id: string;
  courseId: string;
  teacherId: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Session with relationships
export interface IAttendanceSessionWithRelations extends IAttendanceSession {
  course: ICourse;
  teacher: IUser;
}

// Create attendance session interface
export interface IAttendanceSessionCreate {
  courseId: string;
  teacherId: string;
  date?: Date;
  startTime: Date;
  endTime?: Date;
  location?: string;
  notes?: string;
}

// Attendance session filters interface
export interface IAttendanceSessionFilters {
  courseId?: string;
  teacherId?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Update attendance session interface
export interface IAttendanceSessionUpdate {
  endTime?: Date;
  isActive?: boolean;
  location?: string;
  notes?: string;
}

// Attendance session statistics interface
export interface IAttendanceSessionStats {
  sessionId: string;
  totalTokens: number;
  totalCheckIns: number;
  uniqueStudents: number;
  sessionStart: Date;
  sessionEnd?: Date;
  isActive: boolean;
  courseId: string;
}

// Attendance filters interface
export interface IAttendanceFilters {
  courseId?: string;
  userId?: string;
  status?: AttendanceStatus;
  startDate?: Date;
  endDate?: Date;
  batchId?: string;
  departmentId?: string;
  reportType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  sort?: string;
}

// Attendance summary interface
export interface IAttendanceSummary {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  monthlyBreakdown?: {
    month: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
  }[];
}

// Course attendance statistics interface
export interface ICourseAttendanceStats {
  courseId: string;
  courseName: string;
  totalStudents: number;
  averageAttendance: number;
  lastClassDate?: Date;
  nextClassDate?: Date;
}

// Student attendance statistics interface
export interface IStudentAttendanceStats {
  userId: string;
  studentName: string;
  totalCourses: number;
  overallAttendance: number;
  courses: {
    courseId: string;
    courseName: string;
    attendance: number;
  }[];
}

// Dashboard data interface
export interface IAttendanceDashboard {
  totalSessions: number;
  activeSessions: number;
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  weeklyTrend: {
    day: string;
    attendance: number;
  }[];
  topPerformers: {
    userId: string;
    name: string;
    attendance: number;
  }[];
  lowPerformers: {
    userId: string;
    name: string;
    attendance: number;
  }[];
}
