import { User, Course, AttendanceSession, QRCode, QRCheckIn } from '@prisma/client';

// Attendance status type
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

// QR Code status type
export type QRCodeStatus = 'ACTIVE' | 'EXPIRED' | 'USED';

// Base attendance interface
export interface IAttendance {
    id: string;
    userId: string;
    courseId: string;
    date: Date;
    status: AttendanceStatus;
    checkIn?: Date;
    checkOut?: Date;
    notes?: string;
    markedBy?: string;
    qrCodeId?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Attendance with relationships
export interface IAttendanceWithRelations extends IAttendance {
    user: User;
    course: Course;
    student: any; // Using any since Student type is not exported from Prisma client
    marker?: User;
    qrCode?: IQRCode;
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
    qrCodeId?: string;
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

// QR Code interface
export interface IQRCode {
    id: string;
    code: string;
    attendanceSessionId: string;
    validFrom: Date;
    validUntil: Date;
    maxUses: number;
    usedCount: number;
    status: QRCodeStatus;
    location?: string;
    createdAt: Date;
    updatedAt: Date;
}

// QR Code with relationships
export interface IQRCodeWithRelations extends IQRCode {
    attendanceSession: AttendanceSession;
    checkins: QRCheckIn[];
}

// Create QR Code interface
export interface IQRCodeCreate {
    attendanceSessionId: string;
    validFrom: Date;
    validUntil: Date;
    maxUses?: number;
    location?: string;
}

// QR Code check-in interface
export interface IQRCodeCheckIn {
    qrCode: string;
    userId: string;
    location?: string;
}

// Attendance Session interface
export interface IAttendanceSession {
    id: string;
    courseId: string;
    teacherId: string;
    date: Date;
    startTime: Date;
    endTime?: Date | null;
    isActive: boolean;
    location?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Attendance Session with relationships
export interface IAttendanceSessionWithRelations extends IAttendanceSession {
    course: Course;
    teacher: User;
    qrCodes: IQRCode[];
}

// Create attendance session interface
export interface IAttendanceSessionCreate {
    courseId: string;
    teacherId: string;
    date?: Date;
    startTime: Date;
    endTime?: Date | null;
    location?: string | null;
    notes?: string | null;
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
    endTime?: Date | null;
    isActive?: boolean;
    location?: string | null;
    notes?: string | null;
}

// Attendance session statistics interface
export interface IAttendanceSessionStats {
    sessionId: string;
    totalTokens: number;
    totalCheckIns: number;
    uniqueStudents: number;
    sessionStart: Date;
    sessionEnd?: Date | null;
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
