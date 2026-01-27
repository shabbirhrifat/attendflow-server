import prisma from '../../config/prisma';

// Leave model operations
export const LeaveModel = {
    // Create a new leave request
    create: async (data: any) => {
        return await prisma.leaveRequest.create({
            data,
            include: {
                user: true,
            },
        });
    },

    // Find leave by ID
    findById: async (id: string) => {
        return await prisma.leaveRequest.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });
    },

    // Find leaves by user ID
    findByUserId: async (userId: string) => {
        return await prisma.leaveRequest.findMany({
            where: { userId },
            include: {
                user: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    // Get all leaves with optional filters
    findMany: async (filters: any = {}) => {
        const { userId, status, leaveType, startDate, endDate, page = 1, limit = 10 } = filters;

        const where: any = {};

        if (userId) where.userId = userId;
        if (status) where.status = status;
        if (leaveType) where.type = leaveType;

        if (startDate || endDate) {
            where.startDate = {};
            if (startDate) where.startDate.gte = new Date(startDate);
            if (endDate) where.startDate.lte = new Date(endDate);
        }

        // Convert page and limit to integers
        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        return await prisma.leaveRequest.findMany({
            where,
            include: {
                user: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });
    },

    // Update leave request
    update: async (id: string, data: any) => {
        return await prisma.leaveRequest.update({
            where: { id },
            data,
            include: {
                user: true,
            },
        });
    },

    // Delete leave request
    delete: async (id: string) => {
        return await prisma.leaveRequest.delete({
            where: { id },
        });
    },

    // Approve or reject leave request
    updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', approvedBy: string, rejectionReason?: string) => {
        return await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                approvedBy,
                approvedAt: new Date(),
                ...(rejectionReason && { rejectionReason }),
            },
            include: {
                user: true,
            },
        });
    },

    // Get leave statistics
    getStats: async (filters: any = {}) => {
        const { userId, startDate, endDate } = filters;

        const where: any = {};

        if (userId) where.userId = userId;

        if (startDate || endDate) {
            where.startDate = {};
            if (startDate) where.startDate.gte = new Date(startDate);
            if (endDate) where.startDate.lte = new Date(endDate);
        }

        const [
            totalLeaves,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
        ] = await Promise.all([
            prisma.leaveRequest.count({ where }),
            prisma.leaveRequest.count({ where: { ...where, status: 'PENDING' } }),
            prisma.leaveRequest.count({ where: { ...where, status: 'APPROVED' } }),
            prisma.leaveRequest.count({ where: { ...where, status: 'REJECTED' } }),
        ]);

        // Get leave by type
        const leaveByType = await prisma.leaveRequest.groupBy({
            by: ['reason'],
            _count: true,
            where,
        });

        const leaveByTypeMap = leaveByType.reduce((acc: Record<string, number>, item: any) => {
            acc[item.reason] = item._count;
            return acc;
        }, {});

        // Get monthly trend
        const monthlyTrend = await prisma.$queryRaw`
            SELECT
                TO_CHAR(startDate, 'YYYY-MM') as month,
                COUNT(*) as count
            FROM leaves
            WHERE startDate >= ${startDate || new Date(new Date().getFullYear(), 0, 1)}
            GROUP BY TO_CHAR(startDate, 'YYYY-MM')
            ORDER BY month
        ` as { month: string; count: number }[];

        return {
            totalLeaves,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            leaveByType: leaveByTypeMap,
            monthlyTrend,
        };
    },
};

export default LeaveModel;
