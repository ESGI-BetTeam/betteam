import { prisma } from '../lib/prisma';
import { UserRole } from '@betteam/shared/interfaces/User';

export interface AdminUserWithStats {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalBets: number;
    leaguesOwned: number;
    leaguesMember: number;
  };
}

export interface AdminLeagueWithStats {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isActive: boolean;
  inviteCode: string;
  planId: string;
  createdAt: Date;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  stats: {
    totalMembers: number;
    totalBets: number;
    totalChallenges: number;
  };
  wallet: {
    balance: number;
    isFrozen: boolean;
  } | null;
}

export interface AdminBetsStats {
  totalBets: number;
  betsByStatus: {
    pending: number;
    won: number;
    lost: number;
    void: number;
  };
  totalPointsWagered: number;
  totalPointsWon: number;
  averageBetAmount: number;
  topBettors: {
    userId: string;
    username: string;
    totalBets: number;
    winRate: number;
  }[];
}

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    admins: number;
    newThisWeek: number;
  };
  leagues: {
    total: number;
    active: number;
    frozen: number;
  };
  bets: {
    total: number;
    pending: number;
    totalPointsWagered: number;
  };
  sync: {
    lastCompetitionsSync: Date | null;
    lastTeamsSync: Date | null;
    lastMatchesSync: Date | null;
    lastOddsSync: Date | null;
  };
}

class AdminService {
  /**
   * Get dashboard stats overview
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalUsers,
      activeUsers,
      adminUsers,
      newUsersThisWeek,
      totalLeagues,
      activeLeagues,
      frozenLeagues,
      totalBets,
      pendingBets,
      betsAggregate,
      lastSyncs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.league.count(),
      prisma.league.count({ where: { isActive: true } }),
      prisma.leagueWallet.count({ where: { isFrozen: true } }),
      prisma.bet.count(),
      prisma.bet.count({ where: { status: 'pending' } }),
      prisma.bet.aggregate({ _sum: { amount: true } }),
      prisma.syncLog.findMany({
        where: { status: 'success' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const getLastSync = (type: string) => {
      const sync = lastSyncs.find((s) => s.type === type || s.type === `cron-${type}`);
      return sync?.createdAt ?? null;
    };

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
        newThisWeek: newUsersThisWeek,
      },
      leagues: {
        total: totalLeagues,
        active: activeLeagues,
        frozen: frozenLeagues,
      },
      bets: {
        total: totalBets,
        pending: pendingBets,
        totalPointsWagered: betsAggregate._sum.amount ?? 0,
      },
      sync: {
        lastCompetitionsSync: getLastSync('competitions'),
        lastTeamsSync: getLastSync('teams'),
        lastMatchesSync: getLastSync('matches'),
        lastOddsSync: getLastSync('odds'),
      },
    };
  }

  /**
   * Get all users with stats for admin management
   */
  async getAllUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{ users: AdminUserWithStats[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, search, role, isActive } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              bets: true,
              ownedLeagues: true,
              memberships: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: {
          totalBets: user._count.bets,
          leaguesOwned: user._count.ownedLeagues,
          leaguesMember: user._count.memberships,
        },
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Update a user (admin action)
   */
  async updateUser(
    userId: string,
    data: { role?: UserRole; isActive?: boolean }
  ): Promise<AdminUserWithStats | null> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        _count: {
          select: {
            bets: true,
            ownedLeagues: true,
            memberships: true,
          },
        },
      },
    });

    // If user is deactivated, revoke all refresh tokens
    if (data.isActive === false) {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        totalBets: user._count.bets,
        leaguesOwned: user._count.ownedLeagues,
        leaguesMember: user._count.memberships,
      },
    };
  }

  /**
   * Permanently delete a user (hard delete)
   */
  async deleteUser(userId: string): Promise<{ deleted: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            ownedLeagues: true,
          },
        },
      },
    });

    if (!user) {
      return { deleted: false, message: 'User not found.' };
    }

    // Don't allow deleting users who own leagues
    if (user._count.ownedLeagues > 0) {
      return {
        deleted: false,
        message: `Cannot delete user who owns ${user._count.ownedLeagues} league(s). Transfer ownership first.`,
      };
    }

    // Cascade delete will handle related records
    await prisma.user.delete({ where: { id: userId } });

    return { deleted: true, message: 'User permanently deleted.' };
  }

  /**
   * Get all leagues with stats for admin management
   */
  async getAllLeagues(options: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isFrozen?: boolean;
  }): Promise<{ leagues: AdminLeagueWithStats[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, search, isActive, isFrozen } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { inviteCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isFrozen !== undefined) {
      where.wallet = { isFrozen };
    }

    const [leagues, total] = await Promise.all([
      prisma.league.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, username: true, email: true },
          },
          wallet: {
            select: { balance: true, isFrozen: true },
          },
          _count: {
            select: {
              members: true,
              bets: true,
              groupBets: true,
            },
          },
        },
      }),
      prisma.league.count({ where }),
    ]);

    return {
      leagues: leagues.map((league) => ({
        id: league.id,
        name: league.name,
        description: league.description,
        isPrivate: league.isPrivate,
        isActive: league.isActive,
        inviteCode: league.inviteCode,
        planId: league.planId,
        createdAt: league.createdAt,
        owner: league.owner,
        stats: {
          totalMembers: league._count.members,
          totalBets: league._count.bets,
          totalChallenges: league._count.groupBets,
        },
        wallet: league.wallet
          ? { balance: league.wallet.balance, isFrozen: league.wallet.isFrozen }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get global bets statistics
   */
  async getBetsStats(): Promise<AdminBetsStats> {
    const [totalBets, betsByStatus, betsAggregate, winsAggregate, topBettors] = await Promise.all([
      prisma.bet.count(),
      prisma.bet.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.bet.aggregate({
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      prisma.bet.aggregate({
        where: { status: 'won' },
        _sum: { actualWin: true },
      }),
      prisma.bet.groupBy({
        by: ['userId'],
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    // Get usernames for top bettors
    const topBettorIds = topBettors.map((b) => b.userId);
    const topBettorUsers = await prisma.user.findMany({
      where: { id: { in: topBettorIds } },
      select: { id: true, username: true },
    });

    // Get win rates for top bettors
    const topBettorStats = await Promise.all(
      topBettors.map(async (bettor) => {
        const wins = await prisma.bet.count({
          where: { userId: bettor.userId, status: 'won' },
        });
        const total = bettor._count;
        const user = topBettorUsers.find((u) => u.id === bettor.userId);
        return {
          userId: bettor.userId,
          username: user?.username ?? 'Unknown',
          totalBets: total,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
        };
      })
    );

    const statusMap = betsByStatus.reduce(
      (acc, s) => {
        acc[s.status] = s._count;
        return acc;
      },
      { pending: 0, won: 0, lost: 0, void: 0 } as Record<string, number>
    );

    return {
      totalBets,
      betsByStatus: {
        pending: statusMap.pending ?? 0,
        won: statusMap.won ?? 0,
        lost: statusMap.lost ?? 0,
        void: statusMap.void ?? 0,
      },
      totalPointsWagered: betsAggregate._sum.amount ?? 0,
      totalPointsWon: winsAggregate._sum.actualWin ?? 0,
      averageBetAmount: Math.round(betsAggregate._avg.amount ?? 0),
      topBettors: topBettorStats,
    };
  }
}

export const adminService = new AdminService();
