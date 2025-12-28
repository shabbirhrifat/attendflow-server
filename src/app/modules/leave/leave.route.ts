import { Router } from 'express';
import { leaveControllers } from './leave.controller';
import { leaveValidation } from './leave.validation';
import validateRequest from '../../middlewares/validateRequest';
import AuthorizeRequest from '../../middlewares/auth';

const router = Router();

/**
 * @description get leave statistics
 * @param {string} path - /api/leave/stats
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)']
 * @param {function} controller - ['getLeaveStats']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/stats',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    leaveControllers.getLeaveStats
);

/**
 * @description get leave dashboard data
 * @param {string} path - /api/leave/dashboard
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)']
 * @param {function} controller - ['getLeaveDashboard']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/dashboard',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    leaveControllers.getLeaveDashboard
);

/**
 * @description get my leave requests
 * @param {string} path - /api/leave/my-leaves
 * @param {function} middleware - ['AuthorizeRequest()']
 * @param {function} controller - ['getMyLeaves']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    '/my-leaves',
    AuthorizeRequest(),
    leaveControllers.getMyLeaves
);

/**
 * @description get pending leave requests
 * @param {string} path - /api/leave/pending
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)']
 * @param {function} controller - ['getPendingLeaves']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method GET
 */
router.get(
    '/pending',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    leaveControllers.getPendingLeaves
);

/**
 * @description submit a new leave request
 * @param {string} path - /api/leave/
 * @param {function} middleware - ['AuthorizeRequest()', 'validateRequest(leaveValidation.createLeaveSchema)']
 * @param {function} controller - ['submitLeave']
 * @returns {object} - router
 * @access private
 * @method POST
 */
router.post(
    '/',
    AuthorizeRequest(),
    validateRequest(leaveValidation.createLeaveSchema),
    leaveControllers.submitLeave
);

/**
 * @description get all leave requests with filters
 * @param {string} path - /api/leave/
 * @param {function} middleware - ['AuthorizeRequest()', 'validateRequest(leaveValidation.leaveFiltersSchema)']
 * @param {function} controller - ['getLeaves']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    '/',
    AuthorizeRequest(),
    validateRequest(leaveValidation.leaveFiltersSchema),
    leaveControllers.getLeaves
);

/**
 * @description get leave by ID
 * @param {string} path - /api/leave/:id
 * @param {function} middleware - ['AuthorizeRequest()', 'validateRequest(leaveValidation.idParamSchema)']
 * @param {function} controller - ['getLeaveById']
 * @returns {object} - router
 * @access private
 * @method GET
 */
router.get(
    '/:id',
    AuthorizeRequest(),
    validateRequest(leaveValidation.idParamSchema),
    leaveControllers.getLeaveById
);

/**
 * @description update leave request
 * @param {string} path - /api/leave/:id
 * @param {function} middleware - ['AuthorizeRequest()', 'validateRequest(leaveValidation.idParamSchema)', 'validateRequest(leaveValidation.updateLeaveSchema)']
 * @param {function} controller - ['updateLeave']
 * @returns {object} - router
 * @access private
 * @method PATCH
 */
router.patch(
    '/:id',
    AuthorizeRequest(),
    validateRequest(leaveValidation.idParamSchema),
    validateRequest(leaveValidation.updateLeaveSchema),
    leaveControllers.updateLeave
);

/**
 * @description delete leave request
 * @param {string} path - /api/leave/:id
 * @param {function} middleware - ['AuthorizeRequest()', 'validateRequest(leaveValidation.idParamSchema)']
 * @param {function} controller - ['deleteLeave']
 * @returns {object} - router
 * @access private
 * @method DELETE
 */
router.delete(
    '/:id',
    AuthorizeRequest(),
    validateRequest(leaveValidation.idParamSchema),
    leaveControllers.deleteLeave
);

/**
 * @description approve leave request
 * @param {string} path - /api/leave/:id/approve
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(leaveValidation.idParamSchema)', 'validateRequest(leaveValidation.approveRejectLeaveSchema)']
 * @param {function} controller - ['approveLeave']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method PATCH
 */
router.patch(
    '/:id/approve',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(leaveValidation.idParamSchema),
    validateRequest(leaveValidation.approveRejectLeaveSchema),
    leaveControllers.approveLeave
);

/**
 * @description reject leave request
 * @param {string} path - /api/leave/:id/reject
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)', 'validateRequest(leaveValidation.idParamSchema)', 'validateRequest(leaveValidation.approveRejectLeaveSchema)']
 * @param {function} controller - ['rejectLeave']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method PATCH
 */
router.patch(
    '/:id/reject',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    validateRequest(leaveValidation.idParamSchema),
    validateRequest(leaveValidation.approveRejectLeaveSchema),
    leaveControllers.rejectLeave
);

/**
 * @description bulk approve leave requests
 * @param {string} path - /api/leave/bulk-approve
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)']
 * @param {function} controller - ['bulkApproveLeaves']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method POST
 */
router.post(
    '/bulk-approve',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    leaveControllers.bulkApproveLeaves
);

/**
 * @description bulk reject leave requests
 * @param {string} path - /api/leave/bulk-reject
 * @param {function} middleware - ['AuthorizeRequest(TEACHER, ADMIN)']
 * @param {function} controller - ['bulkRejectLeaves']
 * @returns {object} - router
 * @access private - ['TEACHER', 'ADMIN']
 * @method POST
 */
router.post(
    '/bulk-reject',
    AuthorizeRequest('TEACHER', 'ADMIN'),
    leaveControllers.bulkRejectLeaves
);

export const leaveRoutes = router;