import { Router } from 'express';
import { userRoutes } from '../modules/user/user.route';
import { AuthRoute } from '../modules/auth/auth.route';
import { studentRoutes } from '../modules/student/student.route';
import teacherRoutes from '../modules/teacher/teacher.route';
import { attendanceRoutes } from '../modules/attendance/attendance.route';
import { leaveRoutes } from '../modules/leave/leave.route';
import { notificationRoutes } from '../modules/notification/notification.route';
import DashboardRoutes from '../modules/dashboard/dashboard.route';
import { organizationRoutes } from '../modules/organization/organization.route';
import { courseRoutes } from '../modules/course/course.route';
import { SettingsRoutes } from '../modules/settings/settings.route';
import { ImportRoutes } from '../modules/import/import.route';
import { AdminRoutes } from '../modules/admin/admin.route';
import { AssignmentRoutes } from '../modules/assignment/assignment.route';
import auditRoutes from '../modules/audit/audit.route';
import sessionRoutes from '../modules/session/session.route';
import bulkRoutes from '../modules/bulk/bulk.route';

const router = Router();

const routes = [
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/auth',
    route: AuthRoute,
  },
  {
    path: '/user',
    route: userRoutes,
  },
  {
    path: '/student',
    route: studentRoutes,
  },
  {
    path: '/teacher',
    route: teacherRoutes,
  },
  {
    path: '/attendance',
    route: attendanceRoutes,
  },
  {
    path: '/leave',
    route: leaveRoutes,
  },
  {
    path: '/notification',
    route: notificationRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/organization',
    route: organizationRoutes,
  },
  {
    path: '/course',
    route: courseRoutes,
  },
  {
    path: '/settings',
    route: SettingsRoutes,
  },
  {
    path: '/import',
    route: ImportRoutes,
  },
  {
    path: '/assignments',
    route: AssignmentRoutes,
  },
  {
    path: '/audit',
    route: auditRoutes,
  },
  {
    path: '/sessions',
    route: sessionRoutes,
  },
  {
    path: '/bulk',
    route: bulkRoutes,
  },
];

routes.forEach((route) => router.use(route.path, route.route));

const allRoutes = router;
export default allRoutes;
