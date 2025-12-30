import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import validateRequest from "../../middlewares/validateRequest";
import { OrganizationValidation } from "./organization.validation";
import AuthorizeRequest from "../../middlewares/auth";

const router = Router();

/**
 * @description create a new department
 * @param {string} path - /api/organization/departments
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.createDepartment)']
 * @param {function} controller - ['createDepartment']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/departments",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.createDepartment),
    OrganizationController.createDepartment
);

// Move statistics routes up
/**
 * @description get department statistics
 * @param {string} path - /api/organization/departments/stats
 * @param {function} controller - ['getDepartmentStats']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/departments/stats",
    OrganizationController.getDepartmentStats
);

/**
 * @description get all departments with filtering
 * @param {string} path - /api/organization/departments
 * @param {function} middleware - ['validateRequest(OrganizationValidation.departmentFilters)']
 * @param {function} controller - ['getAllDepartments']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/departments",
    validateRequest(OrganizationValidation.departmentFilters),
    OrganizationController.getAllDepartments
);

/**
 * @description get department by ID
 * @param {string} path - /api/organization/departments/:departmentId
 * @param {function} middleware - ['validateRequest(OrganizationValidation.departmentIdParam)']
 * @param {function} controller - ['getDepartmentById']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/departments/:departmentId",
    validateRequest(OrganizationValidation.departmentIdParam),
    OrganizationController.getDepartmentById
);

/**
 * @description update department
 * @param {string} path - /api/organization/departments/:departmentId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.departmentIdParam)', 'validateRequest(OrganizationValidation.updateDepartment)']
 * @param {function} controller - ['updateDepartment']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
    "/departments/:departmentId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.departmentIdParam),
    validateRequest(OrganizationValidation.updateDepartment),
    OrganizationController.updateDepartment
);

/**
 * @description delete department
 * @param {string} path - /api/organization/departments/:departmentId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.departmentIdParam)']
 * @param {function} controller - ['deleteDepartment']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method DELETE
 */
router.delete(
    "/departments/:departmentId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.departmentIdParam),
    OrganizationController.deleteDepartment
);

/**
 * @description create a new semester
 * @param {string} path - /api/organization/semesters
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.createSemester)']
 * @param {function} controller - ['createSemester']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/semesters",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.createSemester),
    OrganizationController.createSemester
);

/**
 * @description get semester statistics
 * @param {string} path - /api/organization/semesters/stats
 * @param {function} controller - ['getSemesterStats']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/semesters/stats",
    OrganizationController.getSemesterStats
);

/**
 * @description get all semesters with filtering
 * @param {string} path - /api/organization/semesters
 * @param {function} middleware - ['validateRequest(OrganizationValidation.paginationQuery)']
 * @param {function} controller - ['getAllSemesters']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/semesters",
    validateRequest(OrganizationValidation.paginationQuery),
    OrganizationController.getAllSemesters
);

/**
 * @description get semester by ID
 * @param {string} path - /api/organization/semesters/:semesterId
 * @param {function} middleware - ['validateRequest(OrganizationValidation.semesterIdParam)']
 * @param {function} controller - ['getSemesterById']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/semesters/:semesterId",
    validateRequest(OrganizationValidation.semesterIdParam),
    OrganizationController.getSemesterById
);

/**
 * @description update semester
 * @param {string} path - /api/organization/semesters/:semesterId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.semesterIdParam)', 'validateRequest(OrganizationValidation.updateSemester)']
 * @param {function} controller - ['updateSemester']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
    "/semesters/:semesterId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.semesterIdParam),
    validateRequest(OrganizationValidation.updateSemester),
    OrganizationController.updateSemester
);

/**
 * @description delete semester
 * @param {string} path - /api/organization/semesters/:semesterId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.semesterIdParam)']
 * @param {function} controller - ['deleteSemester']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method DELETE
 */
router.delete(
    "/semesters/:semesterId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.semesterIdParam),
    OrganizationController.deleteSemester
);

/**
 * @description create a new batch
 * @param {string} path - /api/organization/batches
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.createBatch)']
 * @param {function} controller - ['createBatch']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/batches",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.createBatch),
    OrganizationController.createBatch
);

/**
 * @description get batch statistics
 * @param {string} path - /api/organization/batches/stats
 * @param {function} controller - ['getBatchStats']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/batches/stats",
    OrganizationController.getBatchStats
);

/**
 * @description get all batches with filtering
 * @param {string} path - /api/organization/batches
 * @param {function} middleware - ['validateRequest(OrganizationValidation.batchFilters)']
 * @param {function} controller - ['getAllBatches']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/batches",
    validateRequest(OrganizationValidation.batchFilters),
    OrganizationController.getAllBatches
);

/**
 * @description get batch by ID
 * @param {string} path - /api/organization/batches/:batchId
 * @param {function} middleware - ['validateRequest(OrganizationValidation.batchIdParam)']
 * @param {function} controller - ['getBatchById']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/batches/:batchId",
    validateRequest(OrganizationValidation.batchIdParam),
    OrganizationController.getBatchById
);

/**
 * @description update batch
 * @param {string} path - /api/organization/batches/:batchId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.batchIdParam)', 'validateRequest(OrganizationValidation.updateBatch)']
 * @param {function} controller - ['updateBatch']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
    "/batches/:batchId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.batchIdParam),
    validateRequest(OrganizationValidation.updateBatch),
    OrganizationController.updateBatch
);

/**
 * @description delete batch
 * @param {string} path - /api/organization/batches/:batchId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.batchIdParam)']
 * @param {function} controller - ['deleteBatch']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method DELETE
 */
router.delete(
    "/batches/:batchId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.batchIdParam),
    OrganizationController.deleteBatch
);

/**
 * @description create a new subject
 * @param {string} path - /api/organization/subjects
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.createSubject)']
 * @param {function} controller - ['createSubject']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method POST
 */
router.post(
    "/subjects",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.createSubject),
    OrganizationController.createSubject
);

/**
 * @description get subject statistics
 * @param {string} path - /api/organization/subjects/stats
 * @param {function} controller - ['getSubjectStats']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/subjects/stats",
    OrganizationController.getSubjectStats
);

/**
 * @description get all subjects with filtering
 * @param {string} path - /api/organization/subjects
 * @param {function} middleware - ['validateRequest(OrganizationValidation.paginationQuery)']
 * @param {function} controller - ['getAllSubjects']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/subjects",
    validateRequest(OrganizationValidation.subjectFilters),
    OrganizationController.getAllSubjects
);

/**
 * @description get subject by ID
 * @param {string} path - /api/organization/subjects/:subjectId
 * @param {function} middleware - ['validateRequest(OrganizationValidation.subjectIdParam)']
 * @param {function} controller - ['getSubjectById']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/subjects/:subjectId",
    validateRequest(OrganizationValidation.subjectIdParam),
    OrganizationController.getSubjectById
);

/**
 * @description update subject
 * @param {string} path - /api/organization/subjects/:subjectId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.subjectIdParam)', 'validateRequest(OrganizationValidation.updateSubject)']
 * @param {function} controller - ['updateSubject']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method PATCH
 */
router.patch(
    "/subjects/:subjectId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.subjectIdParam),
    validateRequest(OrganizationValidation.updateSubject),
    OrganizationController.updateSubject
);

/**
 * @description delete subject
 * @param {string} path - /api/organization/subjects/:subjectId
 * @param {function} middleware - ['AuthorizeRequest(ADMIN)', 'validateRequest(OrganizationValidation.subjectIdParam)']
 * @param {function} controller - ['deleteSubject']
 * @returns {object} - router
 * @access private - ['ADMIN']
 * @method DELETE
 */
router.delete(
    "/subjects/:subjectId",
    AuthorizeRequest('ADMIN'),
    validateRequest(OrganizationValidation.subjectIdParam),
    OrganizationController.deleteSubject
);

/**
 * @description get organization overview
 * @param {string} path - /api/organization/overview
 * @param {function} controller - ['getOrganizationOverview']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    "/overview",
    OrganizationController.getOrganizationOverview
);

export const organizationRoutes = router;
