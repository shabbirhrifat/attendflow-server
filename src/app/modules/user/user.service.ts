import { UserModel } from './user.model';
import { IUserCreate, IUserUpdate, IUserResponse, IUserProfile, IUserStats, UserRole, UserStatus } from './user.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { hashInfo } from '../../utils/hashInfo';
import { TeacherModel } from '../teacher/teacher.model';
import { StudentModel } from '../student/student.model';
import { LeaveRequestModel } from '../leave/leave.model';
import { AttendanceModel } from '../attendance/attendance.model';

/** Create a new User */
const createUser = async (data: IUserCreate): Promise<IUserResponse> => {
  // Check if user with email already exists
  const existingUser = await UserModel.findByEmail(data.email);

  if (existingUser) {
    throw new AppError(StatusCodes.CONFLICT, 'User with this email already exists');
  }

  // Hash password before storing
  const hashedPassword = await hashInfo(data.password);

  const user = await UserModel.create({
    ...data,
    password: hashedPassword,
  });

  // Remove password from response
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword as IUserResponse;
};

/** Get a User by ID */
const getUserById = async (id: string): Promise<IUserResponse | null> => {
  const user = await UserModel.findById(id);

  if (!user) {
    return null;
  }

  // Remove password from response
  const userObj = user.toObject ? user.toObject() : user;
  const { password, ...userWithoutPassword } = userObj;
  return userWithoutPassword as IUserResponse;
};

/** Get all Users with query builder support */
const getAllUsers = async (query: any): Promise<{ data: IUserResponse[]; meta: any }> => {
  const queryBuilder = new QueryBuilder(query);

  // Build query with search, filter, sort, pagination, and field selection
  queryBuilder.search(['name', 'email', 'username']).filter().sort().paginate().fields();

  const filter = queryBuilder.getFilter();
  const sort = queryBuilder.getSort();
  const pagination = queryBuilder.getPagination();

  // Execute query
  const result = await UserModel.findMany({
    filter,
    sort,
    ...pagination,
  });

  const meta = queryBuilder.getPaginationMeta(result.meta.total);

  return {
    data: result.data.map((user: any) => {
      const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
      return userWithoutPassword;
    }) as IUserResponse[],
    meta,
  };
};

/** Update a User */
const updateUser = async (id: string, data: IUserUpdate): Promise<IUserResponse | null> => {
  // Check if user exists
  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // If password is being updated, hash it
  if (data.password) {
    data.password = await hashInfo(data.password);
  }

  const updatedUser = await UserModel.update(id, data as any);

  if (!updatedUser) {
    return null;
  }

  // Remove password from response
  const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
  const { password, ...userWithoutPassword } = userObj;
  return userWithoutPassword as IUserResponse;
};

/** Delete a User */
const deleteUser = async (id: string): Promise<void> => {
  // Check if user exists
  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  await UserModel.delete(id);
};

/** Change User Role */
const changeUserRole = async (id: string, role: UserRole): Promise<IUserResponse | null> => {
  // Check if user exists
  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const updatedUser = await UserModel.update(id, { role: role as any });

  if (!updatedUser) {
    return null;
  }

  // Remove password from response
  const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
  const { password, ...userWithoutPassword } = userObj;
  return userWithoutPassword as IUserResponse;
};

/** Change User Status */
const changeUserStatus = async (id: string, status: UserStatus): Promise<IUserResponse | null> => {
  // Check if user exists
  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const updatedUser = await UserModel.update(id, { status: status as any });

  if (!updatedUser) {
    return null;
  }

  // Remove password from response
  const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
  const { password, ...userWithoutPassword } = userObj;
  return userWithoutPassword as IUserResponse;
};

/** Get User Profile with related data */
const getUserProfile = async (id: string): Promise<IUserProfile | null> => {
  const user = await UserModel.findById(id);

  if (!user) {
    return null;
  }

  // Get related data separately
  const [teacherData, studentData, leaveRequests, attendanceRecords] = await Promise.all([
    // If user is a teacher, get their courses
    TeacherModel.findByUserId(id).populate('courses'),
    // If user is a student, get their enrollments
    StudentModel.findByUserId(id).populate('batch').populate('department'),
    // Get leave requests
    LeaveRequestModel.model.find({ userId: id, status: 'APPROVED' }),
    // Get attendance records
    AttendanceModel.model.find({ userId: id }),
  ]);

  // Calculate statistics
  const totalCourses = (teacherData?.courses?.length || 0) + (studentData ? 1 : 0);
  const totalEnrollments = studentData ? 1 : 0;
  const totalLeaves = leaveRequests.length;
  const totalAttendances = attendanceRecords.length;

  const userObj = user.toObject ? user.toObject() : user;
  const { password, ...userWithoutPassword } = userObj;

  return {
    ...userWithoutPassword,
    totalCourses,
    totalAttendances,
    totalLeaves,
  } as IUserProfile;
};

/** Get User Statistics */
const getUserStats = async (): Promise<IUserStats> => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    usersByRole,
  ] = await Promise.all([
    UserModel.count(),
    UserModel.count({ status: 'ACTIVE' }),
    UserModel.count({ status: 'INACTIVE' }),
    UserModel.count({ status: 'SUSPENDED' }),
    // Use aggregation for groupBy
    UserModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]),
  ]);

  // Transform role counts
  const roleCounts: Record<UserRole, number> = {
    ADMIN: 0,
    TEACHER: 0,
    STUDENT: 0,
  };

  usersByRole.forEach((item: any) => {
    roleCounts[item._id] = item.count;
  });

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
    usersByRole: roleCounts,
  };
};

/** Get Users by Role */
const getUsersByRole = async (role: UserRole): Promise<IUserResponse[]> => {
  const users = await UserModel.model.find({ role });

  return users.map((user: any) => {
    const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
    return userWithoutPassword;
  }) as IUserResponse[];
}

/** Search Users */
const searchUsers = async (query: string): Promise<IUserResponse[]> => {
  const users = await UserModel.model.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { username: { $regex: query, $options: 'i' } },
    ],
  });

  return users.map((user: any) => {
    const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
    return userWithoutPassword;
  }) as IUserResponse[];
}

/** Update User Profile */
const updateUserProfile = async (id: string, data: Partial<IUserCreate>): Promise<IUserResponse | null> => {
  // Check if user exists
  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // If email is being updated, check if it's already taken
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await UserModel.findByEmail(data.email);
    if (emailExists) {
      throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
    }
  }

  // If username is being updated, check if it's already taken
  if (data.username && data.username !== existingUser.username) {
    const usernameExists = await UserModel.findByUsername(data.username);
    if (usernameExists) {
      throw new AppError(StatusCodes.CONFLICT, 'Username already exists');
    }
  }

  const updatedUser = await UserModel.update(id, data as any);

  if (!updatedUser) {
    return null;
  }

  // Remove password from response
  const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
  const { password, ...userWithoutPassword } = userObj;
  return userWithoutPassword as IUserResponse;
};

/** Soft Delete User (change status to inactive) */
const softDeleteUser = async (id: string): Promise<void> => {
  // Check if user exists
  const existingUser = await UserModel.findById(id);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  await UserModel.update(id, { status: 'INACTIVE' as any });
};

/** Bulk Update User Status */
const bulkUpdateUserStatus = async (userIds: string[], status: UserStatus): Promise<void> => {
  await UserModel.model.updateMany(
    { _id: { $in: userIds } },
    { status: status as any }
  );
};

/** Get User Activity */
const getUserActivity = async (id: string, limit: number = 10): Promise<any[]> => {
  // This would require a UserActivity model
  // For now, return empty array
  return [];
};

export const userServices = {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  changeUserRole,
  changeUserStatus,
  getUserProfile,
  getUserStats,
  getUsersByRole,
  searchUsers,
  updateUserProfile,
  softDeleteUser,
  bulkUpdateUserStatus,
  getUserActivity,
};