export interface ISetting {
    id: string;
    key: string;
    value: any;
    group: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISettingUpdate {
    key: string;
    value: any;
}

// Settings groups
export type SettingsGroup =
    | 'GENERAL'
    | 'INSTITUTION'
    | 'ATTENDANCE'
    | 'ACADEMIC'
    | 'NOTIFICATION'
    | 'GRADING'
    | 'SYSTEM';

// Default system settings
export const DEFAULT_SETTINGS = {
    // Institution Settings
    'institution.name': 'AttendFlow University',
    'institution.code': 'AFU',
    'institution.website': '',
    'institution.email': 'admin@attendflow.edu',
    'institution.phone': '',
    'institution.address': '',

    // Attendance Settings
    'attendance.lateThreshold': '10', // minutes
    'attendance.requireLocation': 'false',
    'attendance.autoMarkAbsent': 'true',
    'attendance.allowRetroactive': 'true',
    'attendance.minRequiredPercent': '75',

    // Academic Settings
    'academic.currentYear': new Date().getFullYear().toString(),
    'academic.currentSemester': '1',
    'academic.semesterStart': '',
    'academic.semesterEnd': '',

    // Notification Settings
    'notification.emailEnabled': 'true',
    'notification.smsEnabled': 'false',
    'notification.lowAttendanceAlert': 'true',
    'notification.lowAttendanceThreshold': '60',
    'notification.leaveReminder': 'true',

    // Grading Settings
    'grading.passingPercent': '40',
    'grading.gradingScale': 'PERCENTAGE',
    'grading.roundingMethod': 'ROUND',

    // System Settings
    'system.maxFileSize': '10485760', // 10MB in bytes
    'system.allowedFileTypes': 'csv,xlsx,xls,pdf',
    'system.sessionTimeout': '60', // minutes
    'system.maintenanceMode': 'false',
};

// Settings validation schemas
export const SETTINGS_VALIDATION = {
    'attendance.lateThreshold': (val: string) => {
        const num = parseInt(val);
        return num >= 0 && num <= 60;
    },
    'attendance.minRequiredPercent': (val: string) => {
        const num = parseInt(val);
        return num >= 0 && num <= 100;
    },
    'grading.passingPercent': (val: string) => {
        const num = parseInt(val);
        return num >= 0 && num <= 100;
    },
    'system.maxFileSize': (val: string) => {
        const num = parseInt(val);
        return num > 0 && num <= 104857600; // Max 100MB
    },
    'system.sessionTimeout': (val: string) => {
        const num = parseInt(val);
        return num >= 5 && num <= 480; // 5 min to 8 hours
    },
};

export interface ISystemSettings {
    institution?: {
        name?: string;
        code?: string;
        website?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    attendance?: {
        lateThreshold?: number;
        requireLocation?: boolean;
        autoMarkAbsent?: boolean;
        allowRetroactive?: boolean;
        minRequiredPercent?: number;
    };
    academic?: {
        currentYear?: number;
        currentSemester?: number;
        semesterStart?: string;
        semesterEnd?: string;
    };
    notification?: {
        emailEnabled?: boolean;
        smsEnabled?: boolean;
        lowAttendanceAlert?: boolean;
        lowAttendanceThreshold?: number;
        leaveReminder?: boolean;
    };
    grading?: {
        passingPercent?: number;
        gradingScale?: 'PERCENTAGE' | 'GPA' | 'LETTER';
        roundingMethod?: 'ROUND' | 'CEIL' | 'FLOOR';
    };
    system?: {
        maxFileSize?: number;
        allowedFileTypes?: string;
        sessionTimeout?: number;
        maintenanceMode?: boolean;
    };
}
