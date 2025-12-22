/**
 * Assignment Module - Interfaces
 * 
 * This module handles the assignment of relationships between entities
 * INDUSTRY STANDARD: Relationships are assigned AFTER entities are created independently
 */

// ==================== ASSIGNMENT INTERFACES ====================

// Assign teacher to department
export interface IAssignTeacherToDepartment {
    teacherId: string;
    departmentId: string;
}

// Assign student to batch
export interface IAssignStudentToBatch {
    studentId: string;
    batchId: string;
}

// Assign student to department
export interface IAssignStudentToDepartment {
    studentId: string;
    departmentId: string;
}

// Assign teacher to course
export interface IAssignTeacherToCourse {
    teacherId: string;
    courseId: string;
}

// Assign course to department
export interface IAssignCourseToDepartment {
    courseId: string;
    departmentId: string;
}

// Assign course to batch
export interface IAssignCourseToBatch {
    courseId: string;
    batchId: string;
}

// Assign student to course (enrollment)
export interface IAssignStudentToCourse {
    studentId: string;
    courseId: string;
}

// Assign department head
export interface IAssignDepartmentHead {
    departmentId: string;
    teacherId: string;
}

// Unassign (remove relationship)
export interface IUnassignRelationship {
    entityId: string;
    relationId: string;
}

// Response interface
export interface IAssignmentResponse {
    success: boolean;
    message: string;
    data?: any;
}
