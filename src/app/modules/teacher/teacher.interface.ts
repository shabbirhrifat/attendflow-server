// Local type definitions for Teacher module

// User type (simplified)
export interface IUser {
    id: string;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    avatar?: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
}

// Teacher type
export interface ITeacher {
    id: string;
    _id: string;
    userId: string;
    employeeId: string;
    departmentId?: string;
    designation?: string;
    specialization?: string;
    joinDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Department type (simplified)
export interface IDepartment {
    id: string;
    _id: string;
    name: string;
    code: string;
    description?: string;
    headId?: string;
    isActive: boolean;
}

// Batch type (simplified)
export interface IBatch {
    id: string;
    _id: string;
    name: string;
    year: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
}

// Subject type (simplified)
export interface ISubject {
    id: string;
    _id: string;
    name: string;
    code: string;
    description?: string;
    credits: number;
    departmentId: string;
    isActive: boolean;
}

// Course type (simplified)
export interface ICourse {
    id: string;
    _id: string;
    title: string;
    code: string;
    credits: number;
    isActive: boolean;
}

// Attendance type (simplified)
export interface IAttendance {
    id: string;
    _id: string;
    userId: string;
    courseId: string;
    date: Date;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

// LeaveRequest type (simplified)
export interface ILeaveRequest {
    id: string;
    _id: string;
    userId: string;
    teacherId?: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// ClassSchedule type
export interface IClassSchedule {
    id: string;
    _id: string;
    teacherId: string;
    courseId: string;
    batchId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    semester: number;
    isActive: boolean;
}

// Teacher with related User information
export interface ITeacherWithUser extends ITeacher {
    user: IUser;
    department?: IDepartment | null;
    courses?: ICourse[];
}

// Teacher with complete information
export interface ITeacherProfile extends ITeacherWithUser {
    totalCourses?: number;
    totalStudents?: number;
    averageRating?: number;
}

// For creating a new teacher
export interface ITeacherCreate {
    userId?: string;
    name: string;
    email: string;
    password?: string;
    employeeId: string;
    departmentId?: string;
    designation?: string;
    specialization?: string;
    joinDate?: Date;
}

// For updating a teacher
export interface ITeacherUpdate extends Partial<ITeacherCreate> {
    isActive?: boolean;
}

// Teacher filters for queries
export interface ITeacherFilters {
    departmentId?: string;
    designation?: string;
    specialization?: string;
    isActive?: boolean;
    status?: 'all' | 'active' | 'inactive';
    search?: string;
}

// Teacher statistics
export interface ITeacherStats {
    totalTeachers: number;
    activeTeachers: number;
    inactiveTeachers: number;
    teachersByDepartment: {
        departmentId: string;
        departmentName: string;
        count: number;
        percentage: number;
    }[];
    teachersByDesignation: {
        designation: string;
        count: number;
        percentage: number;
    }[];
}

// Class schedule filters
export interface IScheduleFilters {
    teacherId?: string;
    courseId?: string;
    batchId?: string;
    dayOfWeek?: number;
    isActive?: boolean;
}

// Teacher response without sensitive data
export interface ITeacherResponse extends ITeacher {
    user: IUser;
    department?: IDepartment | null;
}

// Mark attendance for a student
export interface IMarkAttendance {
    studentId: string;
    courseId: string;
    date: Date;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    checkIn?: Date;
    checkOut?: Date;
    notes?: string;
}

// Bulk mark attendance
export interface IBulkMarkAttendance {
    courseId: string;
    date: Date;
    attendances: IMarkAttendance[];
}

// Attendance record
export interface IAttendanceRecord {
    id: string;
    _id: string;
    userId: string;
    courseId: string;
    date: Date;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    checkIn?: Date;
    checkOut?: Date;
    notes?: string;
}

// Class schedule view
export interface IClassScheduleView extends IClassSchedule {
    course?: ICourse;
    batch?: IBatch;
    teacher?: ITeacherWithUser;
}

// Create class schedule
export interface ICreateClassSchedule {
    teacherId: string;
    courseId: string;
    batchId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
    semester: number;
}

// Leave approval
export interface ILeaveApproval {
    leaveId: string;
    status: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
}

// Subject create/update (referencing from organization)
export interface ISubjectCreate {
    name: string;
    code: string;
    description?: string;
    credits: number;
    departmentId: string;
}

export interface ISubjectUpdate extends Partial<ISubjectCreate> {}

// Teacher dashboard
export interface ITeacherDashboard {
    profile: ITeacherWithUser;
    stats: ITeacherStats;
    recentActivities: any[];
    upcomingClasses: any[];
    pendingApprovals: any[];
}

// Course stats
export interface ICourseStats {
    totalCourses: number;
    activeCourses: number;
    byDepartment: Record<string, number>;
}

// Course attendance summary
export interface ICourseAttendanceSummary {
    courseId: string;
    courseName: string;
    totalClasses: number;
    averageAttendance: number;
    studentBreakdown: {
        studentId: string;
        studentName: string;
        attendancePercentage: number;
    }[];
}
