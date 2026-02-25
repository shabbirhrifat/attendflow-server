import {
    ICourse,
    ICourseEnrollment,
    IClassSchedule,
    ICourseCreate,
    ICourseUpdate,
    ICourseFilters,
    ICourseWithRelations,
    ICourseStats,
    ICourseEnrollmentCreate,
    ICourseEnrollmentWithRelations,
    ICourseEnrollmentFilters,
    ICourseEnrollmentStats,
    IClassScheduleCreate,
    IClassScheduleUpdate,
    IClassScheduleWithRelations,
    IClassScheduleFilters,
    IClassScheduleStats,
} from './course.interface';
import { CourseModel, CourseEnrollmentModel, ClassScheduleModel } from './course.model';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { TeacherModel } from '../teacher/teacher.model';
import { DepartmentModel, BatchModel, SubjectModel, SemesterModel } from '../organization/organization.model';

// Course services
export const createCourse = async (data: ICourseCreate): Promise<ICourse> => {
    try {
        // Check if course code already exists
        const existingCourseByCode = await CourseModel.model.findOne({ code: data.code });

        if (existingCourseByCode) {
            throw new AppError(StatusCodes.CONFLICT, 'Course with this code already exists');
        }

        // Check if teacher exists
        const teacherExists = await TeacherModel.model.findById(data.teacherId);

        if (!teacherExists) {
            throw new AppError(StatusCodes.BAD_REQUEST, 'Teacher not found');
        }

        // Check if batch exists
        if (data.batchId) {
            const batchExists = await BatchModel.model.findById(data.batchId);
            console.log('Batch exists:', batchExists);
            if (!batchExists) {
                throw new AppError(StatusCodes.BAD_REQUEST, 'Batch not found');
            }
        }

        // Check if department exists
        if (data.departmentId) {
            const departmentExists = await DepartmentModel.model.findById(data.departmentId);
            if (!departmentExists) {
                throw new AppError(StatusCodes.BAD_REQUEST, 'Department not found');
            }
        }

        // Check if subject exists
        if (data.subjectId) {
            const subjectExists = await SubjectModel.model.findById(data.subjectId);
            if (!subjectExists) {
                throw new AppError(StatusCodes.BAD_REQUEST, 'Subject not found');
            }
        }

        // Check if semester exists
        if (data.semesterId) {
            const semesterExists = await SemesterModel.model.findById(data.semesterId);
            if (!semesterExists) {
                throw new AppError(StatusCodes.BAD_REQUEST, 'Semester not found');
            }
        }

        const course = await CourseModel.model.create(data);
        return await CourseModel.model.findById(course._id)
            .populate('teacher', 'id name email')
            .populate('batch')
            .populate('department')
            .populate('subject')
            .populate('semesterInfo') as ICourse;
    } catch (error) {
        throw error;
    }
};

export const getCourseById = async (id: string): Promise<ICourseWithRelations | null> => {
    try {
        const course = await CourseModel.model.findById(id)
            .populate('teacher', 'id name email')
            .populate('batch')
            .populate('department')
            .populate('subject')
            .populate('semesterInfo')
            .lean();

        if (!course) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
        }

        // Get enrollments separately
        const enrollments = await CourseEnrollmentModel.model.find({ courseId: id })
            .populate('student', 'id name email')
            .lean();

        return {
            ...course,
            enrollments,
        } as unknown as ICourseWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateCourse = async (id: string, data: ICourseUpdate): Promise<ICourse> => {
    try {
        // Check if course exists
        const existingCourse = await CourseModel.findById(id);

        if (!existingCourse) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
        }

        // If updating code, check if it's already taken by another course
        if (data.code) {
            const existingCourseByCode = await CourseModel.model.findOne({
                code: data.code,
                _id: { $ne: id },
            });

            if (existingCourseByCode) {
                throw new AppError(StatusCodes.CONFLICT, 'Course with this code already exists');
            }
        }

        await CourseModel.model.findByIdAndUpdate(id, data);

        return await CourseModel.model.findById(id)
            .populate('teacher', 'id name email')
            .populate('batch')
            .populate('department')
            .populate('subject')
            .populate('semesterInfo') as ICourse;
    } catch (error) {
        throw error;
    }
};

export const deleteCourse = async (id: string): Promise<void> => {
    try {
        // Check if course exists
        const existingCourse = await CourseModel.findById(id);

        if (!existingCourse) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Course not found');
        }

        // Check if course has enrollments, attendance records, or schedules
        const enrollmentCount = await CourseEnrollmentModel.model.countDocuments({ courseId: id });

        if (enrollmentCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete course with enrolled students');
        }

        const scheduleCount = await ClassScheduleModel.model.countDocuments({ courseId: id });

        if (scheduleCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete course with class schedules');
        }

        await CourseModel.delete(id);
    } catch (error) {
        throw error;
    }
};

export const getAllCourses = async (filters: ICourseFilters = {}): Promise<ICourse[]> => {
    try {
        const { departmentId, batchId, teacherId, subjectId, semesterId, isActive, search } = filters;

        const where: any = {};

        if (departmentId) where.departmentId = departmentId;
        if (batchId) where.batchId = batchId;
        if (teacherId) where.teacherId = teacherId;
        if (subjectId) where.subjectId = subjectId;
        if (semesterId) where.semesterId = semesterId;
        if (isActive !== undefined) where.isActive = isActive;
        if (search) {
            where.$or = [
                { title: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        return await CourseModel.model.find(where)
            .populate({
                path: 'teacherProfile',
                populate: {
                    path: 'user',
                    select: 'id name email'
                }
            })
            .populate('batch')
            .populate('department')
            .populate('subject')
            .sort({ title: 1 }) as ICourse[];
    } catch (error) {
        throw error;
    }
};

export const getCourseStats = async (): Promise<ICourseStats> => {
    try {
        const totalCourses = await CourseModel.model.countDocuments();
        const activeCourses = await CourseModel.model.countDocuments({ isActive: true });
        const inactiveCourses = await CourseModel.model.countDocuments({ isActive: false });

        const coursesByDepartment = await CourseModel.model.aggregate([
            { $group: { _id: '$departmentId', count: { $sum: 1 } } }
        ]);

        const coursesByBatch = await CourseModel.model.aggregate([
            { $group: { _id: '$batchId', count: { $sum: 1 } } }
        ]);

        const coursesByTeacher = await CourseModel.model.aggregate([
            { $group: { _id: '$teacherId', count: { $sum: 1 } } }
        ]);

        return {
            totalCourses,
            activeCourses,
            inactiveCourses,
            coursesByDepartment: coursesByDepartment.map((item: any) => ({
                departmentId: item._id?.toString() || 'unknown',
                count: item.count,
            })),
            coursesByBatch: coursesByBatch.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            coursesByTeacher: coursesByTeacher.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        throw error;
    }
};

// Course Enrollment services
export const enrollStudentInCourse = async (data: ICourseEnrollmentCreate): Promise<ICourseEnrollment> => {
    try {
        // Check if student is already enrolled in the course
        const existingEnrollment = await CourseEnrollmentModel.model.findOne({
            studentId: data.studentId,
            courseId: data.courseId,
        });

        if (existingEnrollment) {
            throw new AppError(StatusCodes.CONFLICT, 'Student is already enrolled in this course');
        }

        const enrollment = await CourseEnrollmentModel.model.create(data);
        return await CourseEnrollmentModel.model.findById(enrollment._id)
            .populate('student', 'id name email')
            .populate('course') as ICourseEnrollment;
    } catch (error) {
        throw error;
    }
};

export const getCourseEnrollmentById = async (id: string): Promise<ICourseEnrollmentWithRelations | null> => {
    try {
        const enrollment = await CourseEnrollmentModel.model.findById(id)
            .populate('student', 'id name email')
            .populate('course')
            .lean();

        if (!enrollment) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Course enrollment not found');
        }

        return enrollment as unknown as ICourseEnrollmentWithRelations;
    } catch (error) {
        throw error;
    }
};

export const removeStudentFromCourse = async (id: string): Promise<void> => {
    try {
        // Check if enrollment exists
        const existingEnrollment = await CourseEnrollmentModel.findById(id);

        if (!existingEnrollment) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Course enrollment not found');
        }

        await CourseEnrollmentModel.delete(id);
    } catch (error) {
        throw error;
    }
};

export const getAllCourseEnrollments = async (filters: ICourseEnrollmentFilters = {}): Promise<ICourseEnrollment[]> => {
    try {
        const { studentId, courseId } = filters;

        const where: any = {};

        if (studentId) where.studentId = studentId;
        if (courseId) where.courseId = courseId;

        return await CourseEnrollmentModel.model.find(where)
            .populate('student', 'id name email')
            .populate('course', 'id title code')
            .sort({ enrolledAt: -1 }) as ICourseEnrollment[];
    } catch (error) {
        throw error;
    }
};

export const getCourseEnrollmentStats = async (): Promise<ICourseEnrollmentStats> => {
    try {
        const totalEnrollments = await CourseEnrollmentModel.model.countDocuments();

        const enrollmentsByCourse = await CourseEnrollmentModel.model.aggregate([
            { $group: { _id: '$courseId', count: { $sum: 1 } } }
        ]);

        const enrollmentsByStudent = await CourseEnrollmentModel.model.aggregate([
            { $group: { _id: '$studentId', count: { $sum: 1 } } }
        ]);

        return {
            totalEnrollments,
            enrollmentsByCourse: enrollmentsByCourse.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            enrollmentsByStudent: enrollmentsByStudent.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        throw error;
    }
};

// Class Schedule services
export const createClassSchedule = async (data: IClassScheduleCreate): Promise<IClassSchedule> => {
    try {
        const schedule = await ClassScheduleModel.model.create(data);
        return await ClassScheduleModel.model.findById(schedule._id)
            .populate('teacher', 'id name email')
            .populate('course')
            .populate('batch') as IClassSchedule;
    } catch (error) {
        throw error;
    }
};

export const getClassScheduleById = async (id: string): Promise<IClassScheduleWithRelations | null> => {
    try {
        const schedule = await ClassScheduleModel.model.findById(id)
            .populate('teacher', 'id name email')
            .populate('course')
            .populate('batch')
            .lean();

        if (!schedule) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Class schedule not found');
        }

        return schedule as unknown as IClassScheduleWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateClassSchedule = async (id: string, data: IClassScheduleUpdate): Promise<IClassSchedule> => {
    try {
        // Check if schedule exists
        const existingSchedule = await ClassScheduleModel.findById(id);

        if (!existingSchedule) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Class schedule not found');
        }

        await ClassScheduleModel.model.findByIdAndUpdate(id, data);

        return await ClassScheduleModel.model.findById(id)
            .populate('teacher', 'id name email')
            .populate('course')
            .populate('batch')
            .lean() as IClassSchedule;
    } catch (error) {
        throw error;
    }
};

export const deleteClassSchedule = async (id: string): Promise<void> => {
    try {
        // Check if schedule exists
        const existingSchedule = await ClassScheduleModel.findById(id);

        if (!existingSchedule) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Class schedule not found');
        }

        await ClassScheduleModel.delete(id);
    } catch (error) {
        throw error;
    }
};

export const getAllClassSchedules = async (filters: IClassScheduleFilters = {}): Promise<IClassSchedule[]> => {
    try {
        const { teacherId, courseId, batchId, dayOfWeek, semester, isActive } = filters;

        const where: any = {};

        if (teacherId) where.teacherId = teacherId;
        if (courseId) where.courseId = courseId;
        if (batchId) where.batchId = batchId;
        if (dayOfWeek) where.dayOfWeek = dayOfWeek;
        if (semester) where.semester = semester;
        if (isActive !== undefined) where.isActive = isActive;

        return await ClassScheduleModel.model.find(where)
            .populate('teacher', 'id name email')
            .populate('course', 'id title code')
            .populate('batch', 'id name')
            .sort({ dayOfWeek: 1, startTime: 1 }) as IClassSchedule[];
    } catch (error) {
        throw error;
    }
};

export const getClassScheduleStats = async (): Promise<IClassScheduleStats> => {
    try {
        const totalSchedules = await ClassScheduleModel.model.countDocuments();
        const activeSchedules = await ClassScheduleModel.model.countDocuments({ isActive: true });
        const inactiveSchedules = await ClassScheduleModel.model.countDocuments({ isActive: false });

        const schedulesByDay = await ClassScheduleModel.model.aggregate([
            { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } }
        ]);

        const schedulesByTeacher = await ClassScheduleModel.model.aggregate([
            { $group: { _id: '$teacherId', count: { $sum: 1 } } }
        ]);

        return {
            totalSchedules,
            activeSchedules,
            inactiveSchedules,
            schedulesByDay: schedulesByDay.reduce((acc: Record<number, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            schedulesByTeacher: schedulesByTeacher.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        throw error;
    }
};

// Export all services
export const CourseService = {
    // Course services
    createCourse,
    getCourseById,
    updateCourse,
    deleteCourse,
    getAllCourses,
    getCourseStats,

    // Course enrollment services
    enrollStudentInCourse,
    getCourseEnrollmentById,
    removeStudentFromCourse,
    getAllCourseEnrollments,
    getCourseEnrollmentStats,

    // Class schedule services
    createClassSchedule,
    getClassScheduleById,
    updateClassSchedule,
    deleteClassSchedule,
    getAllClassSchedules,
    getClassScheduleStats,
};
