import {
    Department,
    Semester,
    Batch,
    Subject,
    IDepartmentCreate,
    IDepartmentUpdate,
    IDepartmentFilters,
    IDepartmentWithRelations,
    IDepartmentStats,
    ISemesterCreate,
    ISemesterUpdate,
    ISemesterFilters,
    ISemesterWithRelations,
    ISemesterStats,
    IBatchCreate,
    IBatchUpdate,
    IBatchFilters,
    IBatchWithRelations,
    IBatchStats,
    ISubjectCreate,
    ISubjectUpdate,
    ISubjectFilters,
    ISubjectWithRelations,
    ISubjectStats,
    IOrganizationOverview,
    IOrganizationResponse
} from './organization.interface';
import { DepartmentModel, SemesterModel, BatchModel, SubjectModel } from './organization.model';
import { StudentModel } from '../student/student.model';
import { TeacherModel } from '../teacher/teacher.model';
import { CourseModel } from '../course/course.model';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

// Department services
export const createDepartment = async (data: IDepartmentCreate): Promise<Department> => {
    try {
        // Check if department name already exists
        const existingDepartmentByName = await DepartmentModel.model.findOne({ name: data.name });

        if (existingDepartmentByName) {
            throw new AppError(StatusCodes.CONFLICT, 'Department with this name already exists');
        }

        // Check if department code already exists
        const existingDepartmentByCode = await DepartmentModel.model.findOne({ code: data.code });

        if (existingDepartmentByCode) {
            throw new AppError(StatusCodes.CONFLICT, 'Department with this code already exists');
        }

        return await DepartmentModel.model.create(data);
    } catch (error) {
        throw error;
    }
};

export const getDepartmentById = async (id: string): Promise<IDepartmentWithRelations | null> => {
    try {
        const department = await DepartmentModel.model.findById(id)
            .populate('head')
            .lean();

        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        // Get related counts manually
        const [studentCount, teacherCount, subjectCount, semesterCount] = await Promise.all([
            StudentModel.model.countDocuments({ departmentId: id }),
            TeacherModel.model.countDocuments({ departmentId: id }),
            SubjectModel.model.countDocuments({ departmentId: id }),
            SemesterModel.model.countDocuments({ departmentId: id }),
        ]);

        return {
            ...department,
            _count: {
                students: studentCount,
                teachers: teacherCount,
                subjects: subjectCount,
                semesters: semesterCount,
            },
        } as unknown as IDepartmentWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateDepartment = async (id: string, data: IDepartmentUpdate): Promise<Department> => {
    try {
        // Check if department exists
        const existingDepartment = await DepartmentModel.model.findById(id);

        if (!existingDepartment) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        // If updating name, check if it's already taken by another department
        if (data.name) {
            const existingDepartmentByName = await DepartmentModel.model.findOne({
                name: data.name,
                _id: { $ne: id },
            });

            if (existingDepartmentByName) {
                throw new AppError(StatusCodes.CONFLICT, 'Department with this name already exists');
            }
        }

        // If updating code, check if it's already taken by another department
        if (data.code) {
            const existingDepartmentByCode = await DepartmentModel.model.findOne({
                code: data.code,
                _id: { $ne: id },
            });

            if (existingDepartmentByCode) {
                throw new AppError(StatusCodes.CONFLICT, 'Department with this code already exists');
            }
        }

        return await DepartmentModel.model.findByIdAndUpdate(id, data, { new: true }) as unknown as Department;
    } catch (error) {
        throw error;
    }
};

export const deleteDepartment = async (id: string): Promise<void> => {
    try {
        // Check if department exists
        const existingDepartment = await DepartmentModel.model.findById(id);

        if (!existingDepartment) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        // Check if department has students, teachers, or subjects
        const [studentCount, teacherCount, subjectCount] = await Promise.all([
            StudentModel.model.countDocuments({ departmentId: id }),
            TeacherModel.model.countDocuments({ departmentId: id }),
            SubjectModel.model.countDocuments({ departmentId: id }),
        ]);

        if (studentCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete department with associated students');
        }

        if (teacherCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete department with associated teachers');
        }

        if (subjectCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete department with associated subjects');
        }

        await DepartmentModel.model.findByIdAndDelete(id);
    } catch (error) {
        throw error;
    }
};

export const getAllDepartments = async (filters: IDepartmentFilters = {}): Promise<{ data: { departments: Department[] }; meta: any }> => {
    try {
        const { isActive, status, search, headId, page = 1, limit = 10 } = filters;

        const query: any = {};

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        } else if (isActive !== undefined) {
            query.isActive = isActive;
        }
        if (headId) query.headId = headId;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [departments, total] = await Promise.all([
            DepartmentModel.model.find(query)
                .populate('head')
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            DepartmentModel.model.countDocuments(query),
        ]);

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };

        return {
            data: {
                departments,
            },
            meta,
        };
    } catch (error) {
        throw error;
    }
};

export const getDepartmentStats = async (): Promise<IDepartmentStats> => {
    try {
        const totalDepartments = await DepartmentModel.model.countDocuments();
        const activeDepartments = await DepartmentModel.model.countDocuments({ isActive: true });
        const inactiveDepartments = await DepartmentModel.model.countDocuments({ isActive: false });

        const departmentsByHeadCount = await DepartmentModel.model.aggregate([
            {
                $group: {
                    _id: '$headId',
                    count: { $sum: 1 },
                },
            },
        ]);

        return {
            totalDepartments,
            activeDepartments,
            inactiveDepartments,
            departmentsByHeadCount: departmentsByHeadCount.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id?.toString() || 'Unassigned'] = item.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        throw error;
    }
};

// Semester services
export const createSemester = async (data: ISemesterCreate): Promise<Semester> => {
    try {
        // Check if semester with same name, year, and department already exists
        const existingSemester = await SemesterModel.model.findOne({
            name: data.name,
            year: data.year,
            departmentId: data.departmentId,
        });

        if (existingSemester) {
            throw new AppError(StatusCodes.CONFLICT, 'Semester with this name and year already exists for this department');
        }

        return await SemesterModel.model.create(data);
    } catch (error) {
        throw error;
    }
};

export const getSemesterById = async (id: string): Promise<ISemesterWithRelations | null> => {
    try {
        const semester = await SemesterModel.model.findById(id)
            .populate('department')
            .lean();

        if (!semester) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Semester not found');
        }

        // Get course count
        const courseCount = await CourseModel.model.countDocuments({ semesterInfo: id });

        return {
            ...semester,
            _count: {
                courses: courseCount,
            },
        } as unknown as ISemesterWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateSemester = async (id: string, data: ISemesterUpdate): Promise<Semester> => {
    try {
        // Check if semester exists
        const existingSemester = await SemesterModel.model.findById(id);

        if (!existingSemester) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Semester not found');
        }

        // If updating name, year, or department, check for duplicates
        if (data.name || data.year || data.departmentId) {
            const whereClause: any = { _id: { $ne: id } };

            if (data.name) whereClause.name = data.name;
            if (data.year) whereClause.year = data.year;
            if (data.departmentId) whereClause.departmentId = data.departmentId;

            const duplicateSemester = await SemesterModel.model.findOne(whereClause);

            if (duplicateSemester) {
                throw new AppError(StatusCodes.CONFLICT, 'Semester with these details already exists');
            }
        }

        return await SemesterModel.model.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
        throw error;
    }
};

export const deleteSemester = async (id: string): Promise<void> => {
    try {
        // Check if semester exists
        const existingSemester = await SemesterModel.model.findById(id);

        if (!existingSemester) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Semester not found');
        }

        // Check if semester has courses
        const courseCount = await CourseModel.model.countDocuments({ semesterInfo: id });

        if (courseCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete semester with associated courses');
        }

        await SemesterModel.model.findByIdAndDelete(id);
    } catch (error) {
        throw error;
    }
};

export const getAllSemesters = async (filters: ISemesterFilters = {}): Promise<{ data: { semesters: Semester[] }; meta: any }> => {
    try {
        const { departmentId, year, isActive, search, page = 1, limit = 10 } = filters;

        const query: any = {};

        if (departmentId) query.departmentId = departmentId;
        if (year) query.year = year;
        if (isActive !== undefined) query.isActive = isActive;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [semesters, total] = await Promise.all([
            SemesterModel.model.find(query)
                .populate('department')
                .sort({ year: -1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SemesterModel.model.countDocuments(query),
        ]);

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };

        return {
            data: {
                semesters,
            },
            meta,
        };
    } catch (error) {
        throw error;
    }
};

export const getSemesterStats = async (): Promise<ISemesterStats> => {
    try {
        const totalSemesters = await SemesterModel.model.countDocuments();
        const activeSemesters = await SemesterModel.model.countDocuments({ isActive: true });
        const inactiveSemesters = await SemesterModel.model.countDocuments({ isActive: false });

        const semestersByYear = await SemesterModel.model.aggregate([
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 },
                },
            },
        ]);

        const semestersByDepartment = await SemesterModel.model.aggregate([
            {
                $group: {
                    _id: '$departmentId',
                    count: { $sum: 1 },
                },
            },
        ]);

        return {
            totalSemesters,
            activeSemesters,
            inactiveSemesters,
            semestersByYear: semestersByYear.reduce((acc: Record<number, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            semestersByDepartment: semestersByDepartment.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id?.toString()] = item.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        throw error;
    }
};

// Batch services
export const createBatch = async (data: IBatchCreate): Promise<Batch> => {
    try {
        // Check if batch name already exists
        const existingBatch = await BatchModel.model.findOne({ name: data.name });

        if (existingBatch) {
            throw new AppError(StatusCodes.CONFLICT, 'Batch with this name already exists');
        }

        return await BatchModel.model.create(data);
    } catch (error) {
        throw error;
    }
};

export const getBatchById = async (id: string): Promise<IBatchWithRelations | null> => {
    try {
        const batch = await BatchModel.model.findById(id).lean();

        if (!batch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }

        // Get counts
        const [studentCount, courseCount] = await Promise.all([
            StudentModel.model.countDocuments({ batchId: id }),
            CourseModel.model.countDocuments({ batchId: id }),
        ]);

        return {
            ...batch,
            _count: {
                students: studentCount,
                courses: courseCount,
            },
        } as unknown as IBatchWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateBatch = async (id: string, data: IBatchUpdate): Promise<Batch> => {
    try {
        // Check if batch exists
        const existingBatch = await BatchModel.model.findById(id);

        if (!existingBatch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }

        // If updating name, check if it's already taken by another batch
        if (data.name) {
            const existingBatchByName = await BatchModel.model.findOne({
                name: data.name,
                _id: { $ne: id },
            });

            if (existingBatchByName) {
                throw new AppError(StatusCodes.CONFLICT, 'Batch with this name already exists');
            }
        }

        return await BatchModel.model.findByIdAndUpdate(id, data, { new: true }) as unknown as Batch;
    } catch (error) {
        throw error;
    }
};

export const deleteBatch = async (id: string): Promise<void> => {
    try {
        // Check if batch exists
        const existingBatch = await BatchModel.model.findById(id);

        if (!existingBatch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }

        // Check if batch has students or courses
        const [studentCount, courseCount] = await Promise.all([
            StudentModel.model.countDocuments({ batchId: id }),
            CourseModel.model.countDocuments({ batchId: id }),
        ]);

        if (studentCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete batch with associated students');
        }

        if (courseCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete batch with associated courses');
        }

        await BatchModel.model.findByIdAndDelete(id);
    } catch (error) {
        throw error;
    }
};

export const getAllBatches = async (filters: IBatchFilters = {}): Promise<{ data: { batches: Batch[] }; meta: any }> => {
    try {
        const { year, isActive, status, search, page = 1, limit = 10 } = filters;

        const query: any = {};

        if (year) query.year = year;
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        } else if (isActive !== undefined) {
            query.isActive = isActive;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [batches, total] = await Promise.all([
            BatchModel.model.find(query)
                .sort({ year: -1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            BatchModel.model.countDocuments(query),
        ]);

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };

        return {
            data: {
                batches,
            },
            meta,
        };
    } catch (error) {
        throw error;
    }
};

export const getBatchStats = async (): Promise<IBatchStats> => {
    try {
        const totalBatches = await BatchModel.model.countDocuments();
        const activeBatches = await BatchModel.model.countDocuments({ isActive: true });
        const inactiveBatches = await BatchModel.model.countDocuments({ isActive: false });

        const batchesByYear = await BatchModel.model.aggregate([
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 },
                },
            },
        ]);

        return {
            totalBatches,
            activeBatches,
            inactiveBatches,
            batchesByYear: batchesByYear.reduce((acc: Record<number, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        throw error;
    }
};

// Subject services
export const createSubject = async (data: ISubjectCreate): Promise<Subject> => {
    try {
        // Check if subject name already exists
        const existingSubjectByName = await SubjectModel.model.findOne({ name: data.name });

        if (existingSubjectByName) {
            throw new AppError(StatusCodes.CONFLICT, 'Subject with this name already exists');
        }

        // Check if subject code already exists
        const existingSubjectByCode = await SubjectModel.model.findOne({ code: data.code });

        if (existingSubjectByCode) {
            throw new AppError(StatusCodes.CONFLICT, 'Subject with this code already exists');
        }

        return await SubjectModel.model.create(data);
    } catch (error) {
        throw error;
    }
};

export const getSubjectById = async (id: string): Promise<ISubjectWithRelations | null> => {
    try {
        const subject = await SubjectModel.model.findById(id)
            .populate('department')
            .lean();

        if (!subject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        // Get course count
        const courseCount = await CourseModel.model.countDocuments({ subjectId: id });

        return {
            ...subject,
            _count: {
                courses: courseCount,
            },
        } as unknown as ISubjectWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateSubject = async (id: string, data: ISubjectUpdate): Promise<Subject> => {
    try {
        // Check if subject exists
        const existingSubject = await SubjectModel.model.findById(id);

        if (!existingSubject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        // If updating name, check if it's already taken by another subject
        if (data.name) {
            const existingSubjectByName = await SubjectModel.model.findOne({
                name: data.name,
                _id: { $ne: id },
            });

            if (existingSubjectByName) {
                throw new AppError(StatusCodes.CONFLICT, 'Subject with this name already exists');
            }
        }

        // If updating code, check if it's already taken by another subject
        if (data.code) {
            const existingSubjectByCode = await SubjectModel.model.findOne({
                code: data.code,
                _id: { $ne: id },
            });

            if (existingSubjectByCode) {
                throw new AppError(StatusCodes.CONFLICT, 'Subject with this code already exists');
            }
        }

        return await SubjectModel.model.findByIdAndUpdate(id, data, { new: true }) as unknown as Subject;
    } catch (error) {
        throw error;
    }
};

export const deleteSubject = async (id: string): Promise<void> => {
    try {
        // Check if subject exists
        const existingSubject = await SubjectModel.model.findById(id);

        if (!existingSubject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        // Check if subject has courses
        const courseCount = await CourseModel.model.countDocuments({ subjectId: id });

        if (courseCount > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete subject with associated courses');
        }

        await SubjectModel.model.findByIdAndDelete(id);
    } catch (error) {
        throw error;
    }
};

export const getAllSubjects = async (filters: ISubjectFilters = {}): Promise<{ data: { subjects: Subject[] }; meta: any }> => {
    try {
        const { departmentId, isActive, search, credits, page = 1, limit = 10 } = filters;

        const query: any = {};

        if (departmentId) query.departmentId = departmentId;
        if (isActive !== undefined) query.isActive = isActive;
        if (credits !== undefined) query.credits = credits;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [subjects, total] = await Promise.all([
            SubjectModel.model.find(query)
                .populate('department')
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SubjectModel.model.countDocuments(query),
        ]);

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };

        return {
            data: {
                subjects,
            },
            meta,
        };
    } catch (error) {
        throw error;
    }
};

export const getSubjectStats = async (): Promise<ISubjectStats> => {
    try {
        const totalSubjects = await SubjectModel.model.countDocuments();
        const activeSubjects = await SubjectModel.model.countDocuments({ isActive: true });
        const inactiveSubjects = await SubjectModel.model.countDocuments({ isActive: false });

        const subjectsByDepartment = await SubjectModel.model.aggregate([
            {
                $group: {
                    _id: '$departmentId',
                    count: { $sum: 1 },
                },
            },
        ]);

        const subjectsByCredits = await SubjectModel.model.aggregate([
            {
                $group: {
                    _id: '$credits',
                    count: { $sum: 1 },
                },
            },
        ]);

        return {
            totalSubjects,
            activeSubjects,
            inactiveSubjects,
            subjectsByDepartment: subjectsByDepartment.reduce((acc: Record<string, number>, item: any) => {
                acc[item._id?.toString()] = item.count;
                return acc;
            }, {}),
            subjectsByCredits: subjectsByCredits.reduce((acc: Record<number, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        throw error;
    }
};

// Organization overview service
export const getOrganizationOverview = async (): Promise<IOrganizationOverview> => {
    try {
        // Get statistics for each entity type
        const departmentStats = await getDepartmentStats();
        const semesterStats = await getSemesterStats();
        const batchStats = await getBatchStats();
        const subjectStats = await getSubjectStats();

        // Get total counts from student, teacher, and course models
        const [totalStudents, totalTeachers, totalCourses] = await Promise.all([
            StudentModel.model.countDocuments(),
            TeacherModel.model.countDocuments(),
            CourseModel.model.countDocuments(),
        ]);

        return {
            departments: departmentStats,
            semesters: semesterStats,
            batches: batchStats,
            subjects: subjectStats,
            totalStudents,
            totalTeachers,
            totalCourses,
        };
    } catch (error) {
        throw error;
    }
};

// Export all services
export const OrganizationService = {
    // Department services
    createDepartment,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
    getAllDepartments,
    getDepartmentStats,

    // Semester services
    createSemester,
    getSemesterById,
    updateSemester,
    deleteSemester,
    getAllSemesters,
    getSemesterStats,

    // Batch services
    createBatch,
    getBatchById,
    updateBatch,
    deleteBatch,
    getAllBatches,
    getBatchStats,

    // Subject services
    createSubject,
    getSubjectById,
    updateSubject,
    deleteSubject,
    getAllSubjects,
    getSubjectStats,

    // Organization overview
    getOrganizationOverview,
};
