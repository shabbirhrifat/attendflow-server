// Local type definitions for User module

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

// User type (local definition)
export interface IUser {
    id: string;
    _id: string;
    name: string;
    email: string;
    username?: string;
    password?: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    departmentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

// For creating a new user (without id and timestamps)
export interface IUserCreate {
    name: string;
    email: string;
    username?: string;
    password?: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    status?: UserStatus;
    departmentId?: string;
}

// For updating a user (all fields optional)
export type IUserUpdate = Partial<IUserCreate>;

// User response without password
export type IUserResponse = Omit<IUser, 'password'>;

// User profile response with additional information
export interface IUserProfile extends IUserResponse {
    totalCourses?: number;
    totalAttendances?: number;
    totalLeaves?: number;
}

// User statistics
export interface IUserStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    usersByRole: Record<UserRole, number>;
}

// User filters for queries
export interface IUserFilters {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}

// User activity log
export interface IUserActivity {
    id: string;
    _id: string;
    userId: string;
    action: string;
    timestamp: Date;
    details?: Record<string, any>;
}
