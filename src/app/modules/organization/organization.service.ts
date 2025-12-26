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
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

// Department services
export const createDepartment = async (data: IDepartmentCreate): Promise<Department> => {
    try {
        // Check if department name already exists
        const existingDepartmentByName = await DepartmentModel.findFirst({
            where: { name: data.name },
        });

        if (existingDepartmentByName) {
            throw new AppError(StatusCodes.CONFLICT, 'Department with this name already exists');
        }

        // Check if department code already exists
        const existingDepartmentByCode = await DepartmentModel.findFirst({
            where: { code: data.code },
        });

        if (existingDepartmentByCode) {
            throw new AppError(StatusCodes.CONFLICT, 'Department with this code already exists');
        }

        return await DepartmentModel.create({
            data,
        }) as unknown as Department;
    } catch (error) {
        throw error;
    }
};

export const getDepartmentById = async (id: string): Promise<IDepartmentWithRelations | null> => {
    try {
        const department = await DepartmentModel.findUnique({
            where: { id },
            include: {
                students: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                        batch: true,
                    },
                },
                teachers: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                subjects: true,
                semesters: true,
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                        subjects: true,
                        semesters: true,
                    },
                },
            },
        });

        if (!department) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        return department as unknown as IDepartmentWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateDepartment = async (id: string, data: IDepartmentUpdate): Promise<Department> => {
    try {
        // Check if department exists
        const existingDepartment = await DepartmentModel.findUnique({
            where: { id },
        });

        if (!existingDepartment) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        // If updating name, check if it's already taken by another department
        if (data.name) {
            const existingDepartmentByName = await DepartmentModel.findFirst({
                where: {
                    name: data.name,
                    id: { not: id },
                },
            });

            if (existingDepartmentByName) {
                throw new AppError(StatusCodes.CONFLICT, 'Department with this name already exists');
            }
        }

        // If updating code, check if it's already taken by another department
        if (data.code) {
            const existingDepartmentByCode = await DepartmentModel.findFirst({
                where: {
                    code: data.code,
                    id: { not: id },
                },
            });

            if (existingDepartmentByCode) {
                throw new AppError(StatusCodes.CONFLICT, 'Department with this code already exists');
            }
        }

        return await DepartmentModel.update({
            where: { id },
            data,
        }) as unknown as Department;
    } catch (error) {
        throw error;
    }
};

export const deleteDepartment = async (id: string): Promise<void> => {
    try {
        // Check if department exists
        const existingDepartment = await DepartmentModel.findUnique({
            where: { id },
        });

        if (!existingDepartment) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Department not found');
        }

        // Check if department has students, teachers, or subjects
        const departmentWithRelations = await DepartmentModel.findUnique({
            where: { id },
            include: {
                students: { take: 1 },
                teachers: { take: 1 },
                subjects: { take: 1 },
            },
        });

        if (departmentWithRelations?.students && departmentWithRelations.students.length > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete department with associated students');
        }

        if (departmentWithRelations?.teachers && departmentWithRelations.teachers.length > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete department with associated teachers');
        }

        if (departmentWithRelations?.subjects && departmentWithRelations.subjects.length > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete department with associated subjects');
        }

        await DepartmentModel.delete({
            where: { id },
        });
    } catch (error) {
        throw error;
    }
};

export const getAllDepartments = async (filters: IDepartmentFilters = {}): Promise<{ data: { departments: Department[] }; meta: any }> => {
    try {
        const { isActive, status, search, headId, page = 1, limit = 10 } = filters;

        const where: any = {};

        if (status === 'active') {
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        } else if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (headId) where.headId = headId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [departments, total] = await Promise.all([
            DepartmentModel.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            students: true,
                            teachers: true,
                            subjects: true,
                            semesters: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }) as unknown as Department[],
            DepartmentModel.count({ where }),
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
        const totalDepartments = await DepartmentModel.count();
        const activeDepartments = await DepartmentModel.count({ where: { isActive: true } });
        const inactiveDepartments = await DepartmentModel.count({ where: { isActive: false } });

        const departmentsByHeadCount = await DepartmentModel.groupBy({
            by: ['headId'],
            _count: true,
        });

        return {
            totalDepartments,
            activeDepartments,
            inactiveDepartments,
            departmentsByHeadCount: departmentsByHeadCount.reduce((acc: Record<string, number>, item: any) => {
                acc[item.headId || 'Unassigned'] = item._count;
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
        const existingSemester = await SemesterModel.findFirst({
            where: {
                name: data.name,
                year: data.year,
                departmentId: data.departmentId,
            },
        });

        if (existingSemester) {
            throw new AppError(StatusCodes.CONFLICT, 'Semester with this name and year already exists for this department');
        }

        return await SemesterModel.create({
            data,
        });
    } catch (error) {
        throw error;
    }
};

export const getSemesterById = async (id: string): Promise<ISemesterWithRelations | null> => {
    try {
        const semester = await SemesterModel.findUnique({
            where: { id },
            include: {
                department: true,
                courses: {
                    include: {
                        batch: true,
                        subject: true,
                    },
                },
                _count: {
                    select: {
                        courses: true,
                    },
                },
            },
        });

        if (!semester) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Semester not found');
        }

        return semester as unknown as ISemesterWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateSemester = async (id: string, data: ISemesterUpdate): Promise<Semester> => {
    try {
        // Check if semester exists
        const existingSemester = await SemesterModel.findUnique({
            where: { id },
        });

        if (!existingSemester) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Semester not found');
        }

        // If updating name, year, or department, check for duplicates
        if (data.name || data.year || data.departmentId) {
            const whereClause: any = { id: { not: id } };

            if (data.name) whereClause.name = data.name;
            if (data.year) whereClause.year = data.year;
            if (data.departmentId) whereClause.departmentId = data.departmentId;

            const existingSemester = await SemesterModel.findFirst({
                where: whereClause,
            });

            if (existingSemester) {
                throw new AppError(StatusCodes.CONFLICT, 'Semester with these details already exists');
            }
        }

        return await SemesterModel.update({
            where: { id },
            data,
        });
    } catch (error) {
        throw error;
    }
};

export const deleteSemester = async (id: string): Promise<void> => {
    try {
        // Check if semester exists
        const existingSemester = await SemesterModel.findUnique({
            where: { id },
        });

        if (!existingSemester) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Semester not found');
        }

        // Check if semester has courses
        const semesterWithCourses = await SemesterModel.findUnique({
            where: { id },
            include: {
                courses: { take: 1 },
            },
        });

        if (semesterWithCourses?.courses && semesterWithCourses.courses.length > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete semester with associated courses');
        }

        await SemesterModel.delete({
            where: { id },
        });
    } catch (error) {
        throw error;
    }
};

export const getAllSemesters = async (filters: ISemesterFilters = {}): Promise<{ data: { semesters: Semester[] }; meta: any }> => {
    try {
        const { departmentId, year, isActive, search, page = 1, limit = 10 } = filters;

        const where: any = {};

        if (departmentId) where.departmentId = departmentId;
        if (year) where.year = year;
        if (isActive !== undefined) where.isActive = isActive;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [semesters, total] = await Promise.all([
            SemesterModel.findMany({
                where,
                include: {
                    department: true,
                    _count: {
                        select: {
                            courses: true,
                        },
                    },
                },
                orderBy: [
                    { year: 'desc' },
                    { name: 'asc' },
                ],
                skip,
                take: limit,
            }),
            SemesterModel.count({ where }),
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
        const totalSemesters = await SemesterModel.count();
        const activeSemesters = await SemesterModel.count({ where: { isActive: true } });
        const inactiveSemesters = await SemesterModel.count({ where: { isActive: false } });

        const semestersByYear = await SemesterModel.groupBy({
            by: ['year'],
            _count: true,
        });

        const semestersByDepartment = await SemesterModel.groupBy({
            by: ['departmentId'],
            _count: true,
        });

        return {
            totalSemesters,
            activeSemesters,
            inactiveSemesters,
            semestersByYear: semestersByYear.reduce((acc: Record<number, number>, item: any) => {
                acc[item.year] = item._count;
                return acc;
            }, {}),
            semestersByDepartment: semestersByDepartment.reduce((acc: Record<string, number>, item: any) => {
                acc[item.departmentId] = item._count;
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
        const existingBatch = await BatchModel.findFirst({
            where: { name: data.name },
        });

        if (existingBatch) {
            throw new AppError(StatusCodes.CONFLICT, 'Batch with this name already exists');
        }

        return await BatchModel.create({
            data,
        }) as unknown as Batch;
    } catch (error) {
        throw error;
    }
};

export const getBatchById = async (id: string): Promise<IBatchWithRelations | null> => {
    try {
        const batch = await BatchModel.findUnique({
            where: { id },
            include: {
                students: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                        department: true,
                    },
                },
                courses: {
                    include: {
                        department: true,
                        subject: true,
                    },
                },
                _count: {
                    select: {
                        students: true,
                        courses: true,
                    },
                },
            },
        });

        if (!batch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }

        return batch as unknown as IBatchWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateBatch = async (id: string, data: IBatchUpdate): Promise<Batch> => {
    try {
        // Check if batch exists
        const existingBatch = await BatchModel.findUnique({
            where: { id },
        });

        if (!existingBatch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }

        // If updating name, check if it's already taken by another batch
        if (data.name) {
            const existingBatchByName = await BatchModel.findFirst({
                where: {
                    name: data.name,
                    id: { not: id },
                },
            });

            if (existingBatchByName) {
                throw new AppError(StatusCodes.CONFLICT, 'Batch with this name already exists');
            }
        }

        return await BatchModel.update({
            where: { id },
            data,
        }) as unknown as Batch;
    } catch (error) {
        throw error;
    }
};

export const deleteBatch = async (id: string): Promise<void> => {
    try {
        // Check if batch exists
        const existingBatch = await BatchModel.findUnique({
            where: { id },
        });

        if (!existingBatch) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Batch not found');
        }

        // Check if batch has students or courses
        const batchWithRelations = await BatchModel.findUnique({
            where: { id },
            include: {
                students: { take: 1 },
                courses: { take: 1 },
            },
        });

        if (batchWithRelations?.students && batchWithRelations.students.length > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete batch with associated students');
        }

        if (batchWithRelations?.courses && batchWithRelations.courses.length > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete batch with associated courses');
        }

        await BatchModel.delete({
            where: { id },
        });
    } catch (error) {
        throw error;
    }
};

export const getAllBatches = async (filters: IBatchFilters = {}): Promise<{ data: { batches: Batch[] }; meta: any }> => {
    try {
        const { year, isActive, status, search, page = 1, limit = 10 } = filters;

        const where: any = {};

        if (year) where.year = year;
        if (status === 'active') {
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        } else if (isActive !== undefined) {
            where.isActive = isActive;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [batches, total] = await Promise.all([
            BatchModel.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            students: true,
                            courses: true,
                        },
                    },
                },
                orderBy: [
                    { year: 'desc' },
                    { name: 'asc' },
                ],
                skip,
                take: limit,
            }) as unknown as Batch[],
            BatchModel.count({ where }),
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
        const totalBatches = await BatchModel.count();
        const activeBatches = await BatchModel.count({ where: { isActive: true } });
        const inactiveBatches = await BatchModel.count({ where: { isActive: false } });

        const batchesByYear = await BatchModel.groupBy({
            by: ['year'],
            _count: true,
        });

        return {
            totalBatches,
            activeBatches,
            inactiveBatches,
            batchesByYear: batchesByYear.reduce((acc: Record<number, number>, item: any) => {
                acc[item.year] = item._count;
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
        const existingSubjectByName = await SubjectModel.findFirst({
            where: { name: data.name },
        });

        if (existingSubjectByName) {
            throw new AppError(StatusCodes.CONFLICT, 'Subject with this name already exists');
        }

        // Check if subject code already exists
        const existingSubjectByCode = await SubjectModel.findFirst({
            where: { code: data.code },
        });

        if (existingSubjectByCode) {
            throw new AppError(StatusCodes.CONFLICT, 'Subject with this code already exists');
        }

        return await SubjectModel.create({
            data,
        }) as unknown as Subject;
    } catch (error) {
        throw error;
    }
};

export const getSubjectById = async (id: string): Promise<ISubjectWithRelations | null> => {
    try {
        const subject = await SubjectModel.findUnique({
            where: { id },
            include: {
                department: true,
                courses: {
                    include: {
                        batch: true,
                        subject: true,
                    },
                },
                _count: {
                    select: {
                        courses: true,
                    },
                },
            },
        });

        if (!subject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        return subject as unknown as ISubjectWithRelations;
    } catch (error) {
        throw error;
    }
};

export const updateSubject = async (id: string, data: ISubjectUpdate): Promise<Subject> => {
    try {
        // Check if subject exists
        const existingSubject = await SubjectModel.findUnique({
            where: { id },
        });

        if (!existingSubject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        // If updating name, check if it's already taken by another subject
        if (data.name) {
            const existingSubjectByName = await SubjectModel.findFirst({
                where: {
                    name: data.name,
                    id: { not: id },
                },
            });

            if (existingSubjectByName) {
                throw new AppError(StatusCodes.CONFLICT, 'Subject with this name already exists');
            }
        }

        // If updating code, check if it's already taken by another subject
        if (data.code) {
            const existingSubjectByCode = await SubjectModel.findFirst({
                where: {
                    code: data.code,
                    id: { not: id },
                },
            });

            if (existingSubjectByCode) {
                throw new AppError(StatusCodes.CONFLICT, 'Subject with this code already exists');
            }
        }

        return await SubjectModel.update({
            where: { id },
            data,
        }) as unknown as Subject;
    } catch (error) {
        throw error;
    }
};

export const deleteSubject = async (id: string): Promise<void> => {
    try {
        // Check if subject exists
        const existingSubject = await SubjectModel.findUnique({
            where: { id },
        });

        if (!existingSubject) {
            throw new AppError(StatusCodes.NOT_FOUND, 'Subject not found');
        }

        // Check if subject has courses
        const subjectWithCourses = await SubjectModel.findUnique({
            where: { id },
            include: {
                courses: { take: 1 },
            },
        });

        if (subjectWithCourses?.courses && subjectWithCourses.courses.length > 0) {
            throw new AppError(StatusCodes.CONFLICT, 'Cannot delete subject with associated courses');
        }

        await SubjectModel.delete({
            where: { id },
        });
    } catch (error) {
        throw error;
    }
};

export const getAllSubjects = async (filters: ISubjectFilters = {}): Promise<{ data: { subjects: Subject[] }; meta: any }> => {
    try {
        const { departmentId, isActive, search, credits, page = 1, limit = 10 } = filters;

        const where: any = {};

        if (departmentId) where.departmentId = departmentId;
        if (isActive !== undefined) where.isActive = isActive;
        if (credits !== undefined) where.credits = credits;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [subjects, total] = await Promise.all([
            SubjectModel.findMany({
                where,
                include: {
                    department: true,
                    _count: {
                        select: {
                            courses: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }) as unknown as Subject[],
            SubjectModel.count({ where }),
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
        const totalSubjects = await SubjectModel.count();
        const activeSubjects = await SubjectModel.count({ where: { isActive: true } });
        const inactiveSubjects = await SubjectModel.count({ where: { isActive: false } });

        const subjectsByDepartment = await SubjectModel.groupBy({
            by: ['departmentId'],
            _count: true,
        });

        const subjectsByCredits = await SubjectModel.groupBy({
            by: ['credits'],
            _count: true,
        });

        return {
            totalSubjects,
            activeSubjects,
            inactiveSubjects,
            subjectsByDepartment: subjectsByDepartment.reduce((acc: Record<string, number>, item: any) => {
                acc[item.departmentId] = item._count;
                return acc;
            }, {}),
            subjectsByCredits: subjectsByCredits.reduce((acc: Record<number, number>, item: any) => {
                acc[item.credits] = item._count;
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

        return {
            departments: departmentStats,
            semesters: semesterStats,
            batches: batchStats,
            subjects: subjectStats,
            totalStudents: 0, // Will be implemented when student module is integrated
            totalTeachers: 0, // Will be implemented when teacher module is integrated
            totalCourses: 0, // Will be implemented when course module is integrated
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
