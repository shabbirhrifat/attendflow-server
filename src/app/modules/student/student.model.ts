import { Student } from './student.schema';
import { Batch, Department } from '../organization/organization.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * Student Repository using MongoDB/Mongoose
 * Extends BaseRepository for common CRUD operations
 */

class StudentRepository extends BaseRepository<any> {
  constructor() {
    super(Student);
  }

  /**
   * Find student by student ID
   */
  async findByStudentId(studentId: string) {
    return await this.model.findOne({ studentId });
  }

  /**
   * Find student by user ID
   */
  async findByUserId(userId: string) {
    return await this.model.findOne({ userId }).populate('user');
  }

  /**
   * Find students by batch
   */
  async findByBatch(batchId: string) {
    return await this.model.find({ batchId }).populate('user');
  }

  /**
   * Find students by department
   */
  async findByDepartment(departmentId: string) {
    return await this.model.find({ departmentId }).populate('user');
  }

  /**
   * Find students by batch and department
   */
  async findByBatchAndDepartment(batchId: string, departmentId: string) {
    return await this.model.find({ batchId, departmentId }).populate('user');
  }

  /**
   * Find active students
   */
  async findActive() {
    return await this.model.find({ isActive: true }).populate('user');
  }

  /**
   * Get student with populated relations
   */
  async findByIdWithRelations(id: string) {
    return await this.model
      .findById(id)
      .populate('user')
      .populate('batch')
      .populate('department');
  }

  /**
   * Update student GPA
   */
  async updateGPA(id: string, gpa: number) {
    return await this.model.findByIdAndUpdate(
      id,
      { gpa },
      { new: true }
    );
  }

  /**
   * Update student credits
   */
  async updateCredits(id: string, credits: number) {
    return await this.model.findByIdAndUpdate(
      id,
      { credits },
      { new: true }
    );
  }

  /**
   * Update student semester
   */
  async updateSemester(id: string, semester: number) {
    return await this.model.findByIdAndUpdate(
      id,
      { semester },
      { new: true }
    );
  }

  /**
   * Assign student to batch
   */
  async assignToBatch(studentId: string, batchId: string) {
    return await this.model.findByIdAndUpdate(
      studentId,
      { batchId },
      { new: true }
    );
  }

  /**
   * Assign student to department
   */
  async assignToDepartment(studentId: string, departmentId: string) {
    return await this.model.findByIdAndUpdate(
      studentId,
      { departmentId },
      { new: true }
    );
  }

  /**
   * Deactivate student
   */
  async deactivate(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  /**
   * Activate student
   */
  async activate(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
  }

  /**
   * Count students by batch
   */
  async countByBatch(batchId: string) {
    return await this.model.countDocuments({ batchId, isActive: true });
  }

  /**
   * Count students by department
   */
  async countByDepartment(departmentId: string) {
    return await this.model.countDocuments({ departmentId, isActive: true });
  }
}

// Create singleton instances
const studentRepository = new StudentRepository();

// Export both models and repository for backward compatibility
export { Student, Batch, Department };
export const StudentModel = studentRepository;
export const BatchModel = BaseRepository.prototype.constructor.call(BaseRepository, Batch);
export const DepartmentModel = BaseRepository.prototype.constructor.call(BaseRepository, Department);
export default studentRepository;