import { Department, Batch, Semester, Subject } from './organization.schema';
import BaseRepository from '../../repositories/BaseRepository';

/**
 * Department Repository using MongoDB/Mongoose
 */
class DepartmentRepository extends BaseRepository<any> {
  constructor() {
    super(Department);
  }

  /**
   * Find active departments
   */
  async findActive() {
    return await this.model.find({ isActive: true }).populate('head');
  }

  /**
   * Find department by code
   */
  async findByCode(code: string) {
    return await this.model.findOne({ code: code.toUpperCase() }).populate('head');
  }

  /**
   * Find departments by head
   */
  async findByHead(headId: string) {
    return await this.model.find({ headId });
  }

  /**
   * Search departments by name or code
   */
  async search(searchTerm: string) {
    return await this.model.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
      ],
    }).populate('head');
  }

  /**
   * Assign head to department
   */
  async assignHead(departmentId: string, headId: string) {
    return await this.model.findByIdAndUpdate(
      departmentId,
      { headId },
      { new: true }
    ).populate('head');
  }

  /**
   * Deactivate department
   */
  async deactivate(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  /**
   * Activate department
   */
  async activate(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
  }
}

/**
 * Batch Repository using MongoDB/Mongoose
 */
class BatchRepository extends BaseRepository<any> {
  constructor() {
    super(Batch);
  }

  /**
   * Find active batches
   */
  async findActive() {
    return await this.model.find({ isActive: true }).sort({ year: -1 });
  }

  /**
   * Find batches by year
   */
  async findByYear(year: number) {
    return await this.model.find({ year, isActive: true });
  }

  /**
   * Find current batches (batches with active date range)
   */
  async findCurrent() {
    const now = new Date();
    return await this.model.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }

  /**
   * Search batches by name
   */
  async search(searchTerm: string) {
    return await this.model.find({
      name: { $regex: searchTerm, $options: 'i' },
    });
  }

  /**
   * Deactivate batch
   */
  async deactivate(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }
}

/**
 * Semester Repository using MongoDB/Mongoose
 */
class SemesterRepository extends BaseRepository<any> {
  constructor() {
    super(Semester);
  }

  /**
   * Find active semesters
   */
  async findActive() {
    return await this.model.find({ isActive: true })
      .populate('department')
      .sort({ year: -1, name: 1 });
  }

  /**
   * Find semesters by department
   */
  async findByDepartment(departmentId: string) {
    return await this.model.find({ departmentId, isActive: true })
      .sort({ year: -1, name: 1 });
  }

  /**
   * Find current semester for a department
   */
  async findCurrentByDepartment(departmentId: string) {
    const now = new Date();
    return await this.model.findOne({
      departmentId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('department');
  }

  /**
   * Find semester by department, year, and name
   */
  async findByDeptYearName(departmentId: string, year: number, name: string) {
    return await this.model.findOne({ departmentId, year, name })
      .populate('department');
  }

  /**
   * Get unique semester names
   */
  async getSemesterNames() {
    return await this.model.distinct('name');
  }
}

/**
 * Subject Repository using MongoDB/Mongoose
 */
class SubjectRepository extends BaseRepository<any> {
  constructor() {
    super(Subject);
  }

  /**
   * Find active subjects
   */
  async findActive() {
    return await this.model.find({ isActive: true })
      .populate('department');
  }

  /**
   * Find subjects by department
   */
  async findByDepartment(departmentId: string) {
    return await this.model.find({ departmentId, isActive: true })
      .populate('department');
  }

  /**
   * Find subject by code
   */
  async findByCode(code: string) {
    return await this.model.findOne({ code: code.toUpperCase() })
      .populate('department');
  }

  /**
   * Search subjects by name or code
   */
  async search(searchTerm: string) {
    return await this.model.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
      ],
      isActive: true,
    })
    .populate('department');
  }
}

// Create singleton instances
const departmentRepository = new DepartmentRepository();
const batchRepository = new BatchRepository();
const semesterRepository = new SemesterRepository();
const subjectRepository = new SubjectRepository();

// Export for backward compatibility
export { Department, Batch, Semester, Subject };
export const DepartmentModel = departmentRepository;
export const BatchModel = batchRepository;
export const SemesterModel = semesterRepository;
export const SubjectModel = subjectRepository;

export default departmentRepository;