import { Teacher } from './teacher.schema';
import { ClassSchedule, Course, Subject } from '../course/course.schema';
import BaseRepository from '../../repositories/BaseRepository';
import mongoose from 'mongoose';

/**
 * Teacher Repository using MongoDB/Mongoose
 * Extends BaseRepository for common CRUD operations
 */

class TeacherRepository extends BaseRepository<any> {
  constructor() {
    super(Teacher);
  }


  /**
   * Find teacher by employee ID
   */
  async findByEmployeeId(employeeId: string) {
    return await this.model.findOne({ employeeId }).populate('user').populate('department');
  }

  /**
   * Find teacher by user ID
   */
  async findByUserId(userId: string) {
    return await this.model.findOne({ userId })
      .populate('user')
      .populate('department')
      .populate('courses');
  }

  /**
   * Find teachers by department
   */
  async findByDepartment(departmentId: string) {
    return await this.model.find({ departmentId, isActive: true })
      .populate({
        path: 'user',
        select: 'id name email avatar'
      })
      .populate('department');
  }

  /**
   * Find active teachers
   */
  async findActive() {
    return await this.model.find({ isActive: true })
      .populate({
        path: 'user',
        select: 'id name email avatar status'
      })
      .populate('department');
  }

  /**
   * Get teacher with populated courses
   */
  async findByIdWithCourses(id: string) {
    return await this.model.findById(id)
      .populate('user')
      .populate('department')
      .populate('courses');
  }

  /**
   * Get teacher statistics
   */
  async getStats() {
    const totalTeachers = await this.model.countDocuments();
    const activeTeachers = await this.model.countDocuments({ isActive: true });
    const inactiveTeachers = await this.model.countDocuments({ isActive: false });

    // Aggregation for teachers by department
    const teachersByDepartment = await this.model.aggregate([
      {
        $group: {
          _id: '$departmentId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get department names
    const departmentIds = teachersByDepartment
      .map(d => d._id)
      .filter(id => id != null);

    const departments = departmentIds.length > 0
      ? await mongoose.model('Department').find({ _id: { $in: departmentIds } })
      : [];

    const teachersByDepartmentArray = teachersByDepartment.map(d => {
      const department = departments.find((dept: any) => dept._id.toString() === d._id.toString());
      return {
        departmentId: d._id || 'unknown',
        departmentName: department?.name || 'Unknown',
        count: d.count,
        percentage: totalTeachers > 0 ? (d.count / totalTeachers) * 100 : 0
      };
    });

    // Aggregation for teachers by designation
    const teachersByDesignation = await this.model.aggregate([
      {
        $group: {
          _id: '$designation',
          count: { $sum: 1 }
        }
      }
    ]);

    const teachersByDesignationArray = teachersByDesignation.map(d => ({
      designation: d._id || 'Unknown',
      count: d.count,
      percentage: totalTeachers > 0 ? (d.count / totalTeachers) * 100 : 0
    }));

    return {
      totalTeachers,
      activeTeachers,
      inactiveTeachers,
      teachersByDepartment: teachersByDepartmentArray,
      teachersByDesignation: teachersByDesignationArray,
    };
  }

  /**
   * Search teachers by name, email, or employee ID
   */
  async search(searchTerm: string) {
    return await this.model.find({
      $or: [
        { employeeId: { $regex: searchTerm, $options: 'i' } },
        { designation: { $regex: searchTerm, $options: 'i' } },
        { specialization: { $regex: searchTerm, $options: 'i' } },
      ]
    })
    .populate({
      path: 'user',
      select: 'id name email avatar'
    })
    .populate('department');
  }

  /**
   * Filter teachers by various criteria
   */
  async filter(filters: any = {}) {
    const { departmentId, designation, specialization, isActive, status, search } = filters;
    const query: any = {};

    if (departmentId) query.departmentId = departmentId;
    if (designation) query.designation = { $regex: designation, $options: 'i' };
    if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
    if (status === 'active' || isActive === true) {
      query.isActive = true;
    } else if (status === 'inactive' || isActive === false) {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }

    return await this.model.find(query)
      .populate({
        path: 'user',
        select: 'id name email avatar'
      })
      .populate('department');
  }

  /**
   * Deactivate teacher
   */
  async deactivate(id: string) {
    return await this.model.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  /**
   * Activate teacher
   */
  async activate(id: string) {
    return await this.model.findByIdAndUpdate(id, { isActive: true }, { new: true });
  }

  /**
   * Assign teacher to department
   */
  async assignToDepartment(teacherId: string, departmentId: string) {
    return await this.model.findByIdAndUpdate(teacherId, { departmentId }, { new: true });
  }
}

/**
 * Class Schedule Repository using MongoDB/Mongoose
 */
class ClassScheduleRepository extends BaseRepository<any> {
  constructor() {
    super(ClassSchedule);
  }

  /**
   * Find schedules by teacher ID
   */
  async findByTeacherId(teacherId: string) {
    return await this.model.find({ teacherId, isActive: true })
      .populate('course')
      .populate('batch')
      .sort({ dayOfWeek: 1, startTime: 1 });
  }

  /**
   * Find schedules by course ID
   */
  async findByCourseId(courseId: string) {
    return await this.model.find({ courseId, isActive: true })
      .populate('teacher')
      .populate('batch');
  }

  /**
   * Get today's schedule for a teacher
   */
  async getTodaySchedule(teacherId: string) {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return await this.model.find({
      teacherId,
      dayOfWeek: today,
      isActive: true,
    })
    .populate('course')
    .populate('batch')
    .sort({ startTime: 1 });
  }

  /**
   * Find schedules by batch ID
   */
  async findByBatchId(batchId: string) {
    return await this.model.find({ batchId, isActive: true })
      .populate('course')
      .populate('teacher');
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
   * Find subjects by department
   */
  async findByDepartment(departmentId: string) {
    return await this.model.find({ departmentId, isActive: true })
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
      isActive: true
    })
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
   * Filter subjects
   */
  async filter(filters: any = {}) {
    const { departmentId, isActive, search } = filters;
    const query: any = {};

    if (departmentId) query.departmentId = departmentId;
    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    return await this.model.find(query).populate('department');
  }
}

/**
 * Teacher Attendance Repository using MongoDB/Mongoose
 */
class TeacherAttendanceRepository extends BaseRepository<any> {
  constructor() {
    // Will use Attendance model from attendance module
    super(mongoose.model('Attendance'));
  }

  /**
   * Mark attendance for a student
   */
  async markAttendance(data: any) {
    const { studentId, courseId, date, status, checkIn, checkOut, notes, markedBy, attendanceSessionId } = data;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    return await this.model.findOneAndUpdate(
      { userId: studentId, courseId, date: attendanceDate },
      {
        userId: studentId,
        courseId,
        date: attendanceDate,
        status,
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        notes,
        markedBy,
        attendanceSessionId,
      },
      { upsert: true, new: true }
    )
    .populate('course')
    .populate('marker', 'id name email');
  }

  /**
   * Bulk mark attendance
   */
  async bulkMarkAttendance(courseId: string, date: Date, attendances: any[], markedBy: string) {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const operations = attendances.map(attendance => ({
      updateOne: {
        filter: { userId: attendance.studentId, courseId, date: attendanceDate },
        update: {
          $set: {
            userId: attendance.studentId,
            courseId,
            date: attendanceDate,
            status: attendance.status,
            checkIn: attendance.checkIn ? new Date(attendance.checkIn) : undefined,
            checkOut: attendance.checkOut ? new Date(attendance.checkOut) : undefined,
            notes: attendance.notes,
            markedBy,
          }
        },
        upsert: true,
      }
    }));

    await this.model.bulkWrite(operations);

    return await this.model.find({ courseId, date: attendanceDate })
      .populate('user', 'id name email')
      .populate('course');
  }

  /**
   * Get attendance records for a course
   */
  async getCourseAttendance(courseId: string, filters: any = {}) {
    const { startDate, endDate, status } = filters;
    const query: any = { courseId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (status) query.status = status;

    return await this.model.find(query)
      .populate('user', 'id name email')
      .populate('course')
      .populate('marker', 'id name email')
      .sort({ date: -1 });
  }

  /**
   * Get attendance summary for a course
   */
  async getCourseAttendanceSummary(courseId: string, startDate?: Date, endDate?: Date) {
    const matchQuery: any = { courseId };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = startDate;
      if (endDate) matchQuery.date.$lte = endDate;
    }

    const attendances = await this.model.find(matchQuery)
      .populate('user', 'id name');

    // Calculate statistics using aggregation
    const stats = await this.model.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalClasses: { $addToSet: '$date' },
          statusCounts: {
            $push: '$status'
          }
        }
      }
    ]);

    const totalClasses = stats[0]?.totalClasses?.length || 0;
    const statusCounts = stats[0]?.statusCounts?.reduce((acc: any, s: string) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {}) || {};

    // Group by student
    const studentBreakdown = attendances.reduce((acc: any, attendance: any) => {
      const studentId = attendance.userId?.toString() || attendance.userId;
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          name: (attendance.user as any)?.name || 'Unknown',
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }

      acc[studentId].total++;
      acc[studentId][attendance.status.toLowerCase()]++;

      return acc;
    }, {});

    const studentStats = Object.values(studentBreakdown).map((student: any) => ({
      studentId: student.studentId,
      name: student.name,
      attendancePercentage: totalClasses > 0 ? (student.present / totalClasses) * 100 : 0,
    }));

    return {
      courseId,
      totalClasses,
      presentCount: statusCounts.PRESENT || 0,
      absentCount: statusCounts.ABSENT || 0,
      lateCount: statusCounts.LATE || 0,
      excusedCount: statusCounts.EXCUSED || 0,
      attendancePercentage: totalClasses > 0 && Object.keys(studentBreakdown).length > 0
        ? ((statusCounts.PRESENT || 0) / (totalClasses * Object.keys(studentBreakdown).length)) * 100
        : 0,
      studentBreakdown: studentStats,
    };
  }
}

/**
 * Teacher Leave Repository using MongoDB/Mongoose
 */
class TeacherLeaveRepository extends BaseRepository<any> {
  constructor() {
    // Will use LeaveRequest model from leave module
    super(mongoose.model('LeaveRequest'));
  }

  /**
   * Get pending leave requests
   */
  async getPendingLeaves() {
    return await this.model.find({ status: 'PENDING' })
      .populate('user', 'id name email')
      .sort({ createdAt: 1 });
  }

  /**
   * Approve or reject leave request
   */
  async processLeaveRequest(leaveId: string, status: 'APPROVED' | 'REJECTED', approvedBy: string, rejectionReason?: string) {
    return await this.model.findByIdAndUpdate(
      leaveId,
      {
        status,
        approvedBy,
        approvedAt: new Date(),
        ...(rejectionReason && { rejectionReason }),
      },
      { new: true }
    )
    .populate('user', 'id name email')
    .populate('approver', 'id name email');
  }

  /**
   * Get leave requests processed by a teacher
   */
  async getProcessedLeaves(teacherId: string) {
    return await this.model.find({ approvedBy: teacherId })
      .populate('user', 'id name email')
      .sort({ approvedAt: -1 });
  }
}

// Create singleton instances
const teacherRepository = new TeacherRepository();
const classScheduleRepository = new ClassScheduleRepository();
const subjectRepository = new SubjectRepository();
const teacherAttendanceRepository = new TeacherAttendanceRepository();
const teacherLeaveRepository = new TeacherLeaveRepository();

// Export for backward compatibility
export { Teacher, Course, Subject, ClassSchedule };
export const TeacherModel = teacherRepository;
export const ClassScheduleModel = classScheduleRepository;
export const SubjectModel = subjectRepository;
export const TeacherAttendanceModel = teacherAttendanceRepository;
export const TeacherLeaveModel = teacherLeaveRepository;

export default teacherRepository;
