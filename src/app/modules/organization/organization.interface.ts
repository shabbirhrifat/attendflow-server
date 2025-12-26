// Define types locally since they're not yet exported from @prisma/client

// Define related types
export interface User {
    id: string;
    email: string;
    username?: string;
    password: string;
    name: string;
    role: string;
    status: string;
    avatar?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: Date;
    departmentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Student {
    id: string;
    userId: string;
    studentId: string;
    batchId: string;
    departmentId: string;
    semester: number;
    enrollmentDate: Date;
    gpa?: number;
    credits: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Teacher {
    id: string;
    userId: string;
    employeeId: string;
    departmentId: string;
    designation?: string;
    specialization?: string;
    joinDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Course {
    id: string;
    title: string;
    code: string;
    description?: string;
    credits: number;
    batchId: string;
    departmentId: string;
    teacherId: string;
    subjectId?: string;
    semesterId?: string;
    semester: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    description?: string;
    headId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Semester {
    id: string;
    name: string;
    year: number;
    departmentId: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Batch {
    id: string;
    name: string;
    year: number;
    description?: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Subject {
    id: string;
    name: string;
    code: string;
    description?: string;
    credits: number;
    departmentId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Export the types
export type IDepartment = Department;
export type ISemester = Semester;
export type IBatch = Batch;
export type ISubject = Subject;

// Department with related information
export interface IDepartmentWithRelations extends Department {
    students?: Student[];
    teachers?: Teacher[];
    subjects?: Subject[];
    semesters?: Semester[];
    head?: Teacher;
    _count?: {
        students?: number;
        teachers?: number;
        subjects?: number;
        semesters?: number;
    };
}

// Semester with related information
export interface ISemesterWithRelations extends Semester {
    department?: Department;
    courses?: Course[];
    _count?: {
        courses?: number;
    };
}

// Batch with related information
export interface IBatchWithRelations extends Batch {
    students?: Student[];
    courses?: Course[];
    _count?: {
        students?: number;
        courses?: number;
    };
}

// Subject with related information
export interface ISubjectWithRelations extends Subject {
    department?: Department;
    courses?: Course[];
    _count?: {
        courses?: number;
    };
}

// For creating a new department
export interface IDepartmentCreate {
    name: string;
    code: string;
    description?: string;
    headId?: string;
}

// For updating a department
export interface IDepartmentUpdate extends Partial<IDepartmentCreate> {
    isActive?: boolean;
}

// For creating a new semester
export interface ISemesterCreate {
    name: string;
    year: number;
    departmentId: string;
    startDate: Date;
    endDate: Date;
}

// For updating a semester
export interface ISemesterUpdate extends Partial<ISemesterCreate> {
    isActive?: boolean;
}

// For creating a new batch
export interface IBatchCreate {
    name: string;
    year: number;
    description?: string;
    startDate: Date;
    endDate: Date;
}

// For updating a batch
export interface IBatchUpdate extends Partial<IBatchCreate> {
    isActive?: boolean;
}

// For creating a new subject
export interface ISubjectCreate {
    name: string;
    code: string;
    description?: string;
    credits?: number;
    departmentId: string;
}

// For updating a subject
export interface ISubjectUpdate extends Partial<ISubjectCreate> {
    isActive?: boolean;
}

// Filters for queries
export interface IDepartmentFilters {
    isActive?: boolean;
    status?: 'all' | 'active' | 'inactive';
    search?: string;
    headId?: string;
    page?: number;
    limit?: number;
}

export interface ISemesterFilters {
    departmentId?: string;
    year?: number;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

export interface IBatchFilters {
    year?: number;
    isActive?: boolean;
    status?: 'all' | 'active' | 'inactive';
    search?: string;
    page?: number;
    limit?: number;
}

export interface ISubjectFilters {
    departmentId?: string;
    isActive?: boolean;
    search?: string;
    credits?: number;
    page?: number;
    limit?: number;
}

// Statistics
export interface IDepartmentStats {
    totalDepartments: number;
    activeDepartments: number;
    inactiveDepartments: number;
    departmentsByHeadCount: Record<string, number>;
}

export interface ISemesterStats {
    totalSemesters: number;
    activeSemesters: number;
    inactiveSemesters: number;
    semestersByYear: Record<number, number>;
    semestersByDepartment: Record<string, number>;
}

export interface IBatchStats {
    totalBatches: number;
    activeBatches: number;
    inactiveBatches: number;
    batchesByYear: Record<number, number>;
}

export interface ISubjectStats {
    totalSubjects: number;
    activeSubjects: number;
    inactiveSubjects: number;
    subjectsByDepartment: Record<string, number>;
    subjectsByCredits: Record<number, number>;
}

// Organization overview
export interface IOrganizationOverview {
    departments: IDepartmentStats;
    semesters: ISemesterStats;
    batches: IBatchStats;
    subjects: ISubjectStats;
    totalStudents: number;
    totalTeachers: number;
    totalCourses: number;
}

// API Response types
export interface IOrganizationResponse<T = any> {
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
