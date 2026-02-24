// Export interfaces and types selectively
export type {
    IDepartment,
    IDepartmentCreate,
    IDepartmentUpdate,
    IDepartmentFilters,
    IDepartmentWithRelations,
    IDepartmentStats,
    IBatch,
    IBatchCreate,
    IBatchUpdate,
    IBatchFilters,
    IBatchWithRelations,
    IBatchStats,
    ISemester,
    ISemesterCreate,
    ISemesterUpdate,
    ISemesterFilters,
    ISemesterWithRelations,
    ISemesterStats,
    ISubject,
    ISubjectCreate,
    ISubjectUpdate,
    ISubjectFilters,
    ISubjectWithRelations,
    ISubjectStats,
    IOrganizationOverview,
} from './organization.interface';

// Export model repositories
export { DepartmentModel, BatchModel, SemesterModel, SubjectModel } from './organization.model';

// Export service functions
export {
    createDepartment,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
    getAllDepartments,
    getDepartmentStats,
    createSemester,
    getSemesterById,
    updateSemester,
    deleteSemester,
    getAllSemesters,
    getSemesterStats,
    createBatch,
    getBatchById,
    updateBatch,
    deleteBatch,
    getAllBatches,
    getBatchStats,
    createSubject,
    getSubjectById,
    updateSubject,
    deleteSubject,
    getAllSubjects,
    getSubjectStats,
    getOrganizationOverview,
    OrganizationService,
} from './organization.service';

export { OrganizationController } from './organization.controller';
export * from './organization.validation';
export { organizationRoutes } from './organization.route';