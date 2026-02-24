import { Course, CourseEnrollment, ClassSchedule } from './course.schema';
import BaseRepository from '../../repositories/BaseRepository';

/**
 * Course Repository using MongoDB/Mongoose
 */
class CourseRepository extends BaseRepository<any> {
  constructor() {
    super(Course);
  }

  /**
   * Find active courses
   */
  async findActive() {
    return await this.model.find({ isActive: true })
      .populate('teacher', 'id name email')
      .populate('batch')
      .populate('department')
      .populate('subject')
      .populate('semesterInfo');
  }

  /**
   * Find courses by teacher
   */
  async findByTeacher(teacherId: string) {
    return await this.model.find({ teacherId, isActive: true })
      .populate('teacher', 'id name email')
      .populate('batch')
      .populate('department')
      .populate('subject');
  }

  /**
   * Find courses by batch
   */
  async findByBatch(batchId: string) {
    return await this.model.find({ batchId, isActive: true })
      .populate('teacher', 'id name email')
      .populate('batch')
      .populate('department');
  }

  /**
   * Find courses by department
   */
  async findByDepartment(departmentId: string) {
    return await this.model.find({ departmentId, isActive: true })
      .populate('teacher', 'id name email')
      .populate('batch')
      .populate('subject');
  }

  /**
   * Find course by code
   */
  async findByCode(code: string) {
    return await this.model.findOne({ code })
      .populate('teacher')
      .populate('batch')
      .populate('department')
      .populate('subject')
      .populate('semesterInfo');
  }

  /**
   * Assign teacher to course
   */
  async assignTeacher(courseId: string, teacherId: string) {
    return await this.model.findByIdAndUpdate(
      courseId,
      { teacherId },
      { new: true }
    ).populate('teacher', 'id name email');
  }

  /**
   * Assign batch to course
   */
  async assignBatch(courseId: string, batchId: string) {
    return await this.model.findByIdAndUpdate(
      courseId,
      { batchId },
      { new: true }
    ).populate('batch');
  }

  /**
   * Assign department to course
   */
  async assignDepartment(courseId: string, departmentId: string) {
    return await this.model.findByIdAndUpdate(
      courseId,
      { departmentId },
      { new: true }
    ).populate('department');
  }

  /**
   * Search courses by title or code
   */
  async search(searchTerm: string) {
    return await this.model.find({
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
      ],
      isActive: true,
    })
    .populate('teacher', 'id name email')
    .populate('batch')
    .populate('department');
  }

  /**
   * Deactivate course
   */
  async deactivate(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  /**
   * Activate course
   */
  async activate(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
  }

  /**
   * Get course statistics
   */
  async getStats() {
    const totalCourses = await this.model.countDocuments();
    const activeCourses = await this.model.countDocuments({ isActive: true });
    const inactiveCourses = await this.model.countDocuments({ isActive: false });

    // Aggregation for courses by department
    const coursesByDepartment = await this.model.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$departmentId',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      totalCourses,
      activeCourses,
      inactiveCourses,
      coursesByDepartment,
    };
  }
}

/**
 * Course Enrollment Repository using MongoDB/Mongoose
 */
class CourseEnrollmentRepository extends BaseRepository<any> {
  constructor() {
    super(CourseEnrollment);
  }

  /**
   * Find enrollments by student
   */
  async findByStudent(studentId: string) {
    return await this.model.find({ studentId })
      .populate('course')
      .sort({ enrolledAt: -1 });
  }

  /**
   * Find enrollments by course
   */
  async findByCourse(courseId: string) {
    return await this.model.find({ courseId })
      .populate('student', 'id name email')
      .sort({ enrolledAt: -1 });
  }

  /**
   * Check if student is enrolled in course
   */
  async isEnrolled(studentId: string, courseId: string) {
    return await this.model.findOne({ studentId, courseId });
  }

  /**
   * Get enrollment count for a course
   */
  async countByCourse(courseId: string) {
    return await this.model.countDocuments({ courseId });
  }

  /**
   * Get enrollment count for a student
   */
  async countByStudent(studentId: string) {
    return await this.model.countDocuments({ studentId });
  }

  /**
   * Unenroll student from course
   */
  async unenroll(studentId: string, courseId: string) {
    return await this.model.findOneAndDelete({ studentId, courseId });
  }

  /**
   * Get all students enrolled in a course
   */
  async getStudentsByCourse(courseId: string) {
    const enrollments = await this.model.find({ courseId })
      .populate('student', 'id name email');

    return enrollments.map((e: any) => e.student);
  }
}

/**
 * Class Schedule Repository using MongoDB/Mongoose
 * Note: This is also defined in teacher.model.ts - consider consolidating
 */
class ScheduleRepository extends BaseRepository<any> {
  constructor() {
    super(ClassSchedule);
  }

  /**
   * Find schedules by day of week
   */
  async findByDayOfWeek(dayOfWeek: number) {
    return await this.model.find({ dayOfWeek, isActive: true })
      .populate('teacher')
      .populate('course')
      .populate('batch')
      .sort({ startTime: 1 });
  }

  /**
   * Find schedules for a batch
   */
  async findByBatch(batchId: string) {
    return await this.model.find({ batchId, isActive: true })
      .populate('teacher')
      .populate('course')
      .sort({ dayOfWeek: 1, startTime: 1 });
  }

  /**
   * Get schedule conflicts
   */
  async findConflicts(teacherId: string, dayOfWeek: number, startTime: string, endTime: string) {
    return await this.model.find({
      teacherId,
      dayOfWeek,
      isActive: true,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        { startTime: { $gte: startTime, $lt: endTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    });
  }
}

// Create singleton instances
const courseRepository = new CourseRepository();
const courseEnrollmentRepository = new CourseEnrollmentRepository();
const scheduleRepository = new ScheduleRepository();

// Export for backward compatibility
export { Course, CourseEnrollment, ClassSchedule };
export const CourseModel = courseRepository;
export const CourseEnrollmentModel = courseEnrollmentRepository;
export const ClassScheduleModel = scheduleRepository;

export default courseRepository;