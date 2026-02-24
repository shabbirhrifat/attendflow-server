// Local type definitions for Student module

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
    departmentId?: string;
}

// Student type
export interface IStudent {
    id: string;
    _id: string;
    userId: string;
    studentId: string;
    batchId?: string;
    departmentId?: string;
    semester: number;
    gpa: number;
    credits: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
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

// Department type (simplified)
export interface IDepartment {
    id: string;
    _id: string;
    name: string;
    code: string;
    description?: string;
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
    checkIn?: Date;
    checkOut?: Date;
    notes?: string;
}

// LeaveRequest type (simplified)
export interface ILeaveRequest {
    id: string;
    _id: string;
    userId: string;
    studentId?: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    type: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    documents?: string;
}

// Student with related User information
export interface IStudentWithUser extends IStudent {
    user: IUser;
    batch?: IBatch | null;
    department?: IDepartment | null;
}

// Student with attendance records
export interface IStudentWithAttendance extends IStudentWithUser {
    attendanceRecords: IAttendance[];
}

// Student with leave requests
export interface IStudentWithLeaves extends IStudentWithUser {
    leaveRequests: ILeaveRequest[];
}

// Student profile with complete information
export interface IStudentProfile extends IStudentWithUser {
    totalCourses: number;
    totalAttendances: number;
    totalLeaves: number;
    attendancePercentage?: number;
    approvedLeaves?: number;
    pendingLeaves?: number;
}

// For creating a new student profile
export interface IStudentCreate {
    userId?: string;
    name: string;
    email: string;
    password?: string;
    batchId?: string;
    departmentId?: string;
    semester?: number;
    gpa?: number;
    credits?: number;
}

// For updating a student profile
export interface IStudentUpdate extends Partial<IStudentCreate> {
    isActive?: boolean;
}

// Student attendance view
export interface IStudentAttendanceView {
    id: string;
    _id: string;
    date: Date;
    status: string;
    checkIn?: Date;
    checkOut?: Date;
    notes?: string;
    course: {
        id: string;
        title: string;
        code: string;
    };
}

// Student leave request
export interface IStudentLeaveRequest {
    startDate: Date;
    endDate: Date;
    reason: string;
    type?: string;
    documents?: string;
}

// Student leave response
export interface IStudentLeaveResponse extends ILeaveRequest {
    user: {
        id: string;
        name: string;
        email: string;
    };
}

// Student profile update
export interface IStudentProfileUpdate {
    name?: string;
    username?: string;
    avatar?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: Date;
}

// Student statistics
export interface IStudentStats {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    studentsByBatch: Record<string, number>;
    studentsByDepartment: Record<string, number>;
    averageGPA: number;
}

// Student filters for queries
export interface IStudentFilters {
    batchId?: string;
    departmentId?: string;
    semester?: number;
    isActive?: boolean;
    status?: 'all' | 'active' | 'inactive';
    search?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}

// Student attendance summary
export interface IStudentAttendanceSummary {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendancePercentage: number;
    monthlyBreakdown: {
        month: string;
        present: number;
        absent: number;
        late: number;
        excused: number;
    }[];
}

// Student dashboard data
export interface IStudentDashboard {
    student: IStudentWithUser;
    attendanceSummary: IStudentAttendanceSummary;
    recentAttendance: IStudentAttendanceView[];
    pendingLeaves: ILeaveRequest[];
    enrolledCourses: ICourse[];
}
