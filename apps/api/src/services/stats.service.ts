import { prisma } from '../lib/prisma';
import type {
  GlobalStats,
  UserStats,
  RecentBet,
  LeagueStats,
  LeagueMemberStats,
  LeagueActivity,
  TopBettor,
} from '@betteam/shared/api/stats';

class StatsService {
  /**
   * Get global platform statistics
   */
  async getGlobalStats(): Promise<GlobalStats> {
    const [
      totalUsers,
      totalLeagues,
      totalMatches,
      totalBets,
      betsByStatus,
      betsAggregate,
      winsAggregate,
      topBettorsRaw,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.league.count({ where: { isActive: true } }),
      prisma.match.count(),
      prisma.bet.count(),
      prisma.bet.groupBy({ by: ['status'], _count: true }),
      prisma.bet.aggregate({ _sum: { amount: true }, _avg: { amount: true } }),
      prisma.bet.aggregate({ where: { status: 'won' }, _sum: { actualWin: true } }),
      prisma.bet.groupBy({
        by: ['userId'],
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    const statusMap = this.buildStatusMap(betsByStatus);
    const settledBets = statusMap.won + statusMap.lost;

    // Batch-fetch top bettor details
    const topBettors = await this.enrichTopBettors(topBettorsRaw);

    return {
      totalBets,
      totalUsers,
      totalLeagues,
      totalMatches,
      betsByStatus: {
        pending: statusMap.pending,
        won: statusMap.won,
        lost: statusMap.lost,
        void: statusMap.void,
      },
      totalPointsWagered: betsAggregate._sum.amount ?? 0,
      totalPointsWon: winsAggregate._sum.actualWin ?? 0,
      averageBetAmount: Math.round(betsAggregate._avg.amount ?? 0),
      globalWinRate: settledBets > 0 ? Math.round((statusMap.won / settledBets) * 100) : 0,
      topBettors,
    };
  }

  /**
   * Get detailed statistics for a specific user
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, isActive: true },
    });

    if (!user || !user.isActive) return null;

    const [
      betsByStatus,
      betsAggregate,
      winsAggregate,
      lossesAggregate,
      leaguesCount,
      recentBetsRaw,
      allSettledBets,
      sportStats,
    ] = await Promise.all([
      prisma.bet.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.bet.aggregate({
        where: { userId },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.bet.aggregate({
        where: { userId, status: 'won' },
        _sum: { actualWin: true },
      }),
      prisma.bet.aggregate({
        where: { userId, status: 'lost' },
        _sum: { amount: true },
      }),
      prisma.leagueMember.count({ where: { userId } }),
      prisma.bet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      }),
      // Get all settled bets ordered by settledAt for streak calculation
      prisma.bet.findMany({
        where: { userId, status: { in: ['won', 'lost'] } },
        orderBy: { createdAt: 'desc' },
        select: { status: true },
      }),
      // Get favorite sport
      prisma.bet.findMany({
        where: { userId },
        select: {
          match: {
            select: {
              competition: {
                select: { sport: true },
              },
            },
          },
        },
      }),
    ]);

    const statusMap = this.buildStatusMap(betsByStatus);
    const settledCount = statusMap.won + statusMap.lost;
    const totalPointsWon = winsAggregate._sum.actualWin ?? 0;
    const totalPointsLost = lossesAggregate._sum.amount ?? 0;

    // Calculate streaks
    const { currentStreak, bestWinStreak, worstLossStreak } =
      this.calculateStreaks(allSettledBets.map((b) => b.status));

    // Find favorite sport
    const sportCounts = new Map<string, number>();
    for (const bet of sportStats) {
      const sport = bet.match.competition.sport;
      sportCounts.set(sport, (sportCounts.get(sport) ?? 0) + 1);
    }
    let favoriteSport: string | null = null;
    let maxCount = 0;
    for (const [sport, count] of sportCounts) {
      if (count > maxCount) {
        maxCount = count;
        favoriteSport = sport;
      }
    }

    // Transform recent bets
    const recentBets: RecentBet[] = recentBetsRaw.map((bet) => ({
      id: bet.id,
      matchId: bet.matchId,
      homeTeam: bet.match.homeTeam.name,
      awayTeam: bet.match.awayTeam.name,
      predictionType: bet.predictionType,
      predictionValue: bet.predictionValue,
      amount: bet.amount,
      status: bet.status,
      potentialWin: bet.potentialWin,
      actualWin: bet.actualWin,
      createdAt: bet.createdAt,
      settledAt: bet.settledAt,
    }));

    return {
      userId: user.id,
      username: user.username,
      totalBets: betsAggregate._count ?? 0,
      betsByStatus: {
        pending: statusMap.pending,
        won: statusMap.won,
        lost: statusMap.lost,
        void: statusMap.void,
      },
      winRate: settledCount > 0 ? Math.round((statusMap.won / settledCount) * 100) : 0,
      totalPointsWagered: betsAggregate._sum.amount ?? 0,
      totalPointsWon,
      totalPointsLost,
      netPoints: totalPointsWon - totalPointsLost,
      averageBetAmount: Math.round(betsAggregate._avg.amount ?? 0),
      currentStreak,
      bestWinStreak,
      worstLossStreak,
      leaguesCount,
      favoriteSport,
      recentBets,
    };
  }

  /**
   * Get detailed statistics for a specific league
   */
  async getLeagueStats(leagueId: string): Promise<LeagueStats | null> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true, name: true, isActive: true },
    });

    if (!league || !league.isActive) return null;

    const [
      totalMembers,
      totalBets,
      totalChallenges,
      betsByStatus,
      betsAggregate,
      winsAggregate,
      members,
    ] = await Promise.all([
      prisma.leagueMember.count({ where: { leagueId } }),
      prisma.bet.count({ where: { leagueId } }),
      prisma.groupBet.count({ where: { leagueId } }),
      prisma.bet.groupBy({ by: ['status'], where: { leagueId }, _count: true }),
      prisma.bet.aggregate({ where: { leagueId }, _sum: { amount: true }, _avg: { amount: true } }),
      prisma.bet.aggregate({ where: { leagueId, status: 'won' }, _sum: { actualWin: true } }),
      prisma.leagueMember.findMany({
        where: { leagueId },
        include: {
          user: { select: { id: true, username: true } },
        },
        orderBy: { points: 'desc' },
      }),
    ]);

    const statusMap = this.buildStatusMap(betsByStatus);
    const settledBets = statusMap.won + statusMap.lost;

    // Get per-member stats in batch
    const memberIds = members.map((m) => m.userId);

    const [memberBetCounts, memberWinCounts, memberWagerTotals, memberWinTotals, memberSettledBets] =
      await Promise.all([
        prisma.bet.groupBy({
          by: ['userId'],
          where: { leagueId, userId: { in: memberIds } },
          _count: true,
        }),
        prisma.bet.groupBy({
          by: ['userId'],
          where: { leagueId, userId: { in: memberIds }, status: 'won' },
          _count: true,
        }),
        prisma.bet.groupBy({
          by: ['userId'],
          where: { leagueId, userId: { in: memberIds } },
          _sum: { amount: true },
        }),
        prisma.bet.groupBy({
          by: ['userId'],
          where: { leagueId, userId: { in: memberIds }, status: 'won' },
          _sum: { actualWin: true },
        }),
        // Fetch settled bets per member for streak calculation
        prisma.bet.findMany({
          where: { leagueId, userId: { in: memberIds }, status: { in: ['won', 'lost'] } },
          orderBy: { createdAt: 'desc' },
          select: { userId: true, status: true },
        }),
      ]);

    const betCountMap = new Map(memberBetCounts.map((b) => [b.userId, b._count]));
    const winCountMap = new Map(memberWinCounts.map((b) => [b.userId, b._count]));
    const wagerMap = new Map(memberWagerTotals.map((b) => [b.userId, b._sum.amount ?? 0]));
    const winTotalMap = new Map(memberWinTotals.map((b) => [b.userId, b._sum.actualWin ?? 0]));

    // Group settled bets by member for streaks
    const memberSettledMap = new Map<string, string[]>();
    for (const bet of memberSettledBets) {
      const list = memberSettledMap.get(bet.userId) ?? [];
      list.push(bet.status);
      memberSettledMap.set(bet.userId, list);
    }

    const topMembers: LeagueMemberStats[] = members.map((member) => {
      const totalMemberBets = betCountMap.get(member.userId) ?? 0;
      const wins = winCountMap.get(member.userId) ?? 0;
      const settled = totalMemberBets > 0
        ? wins + ((betCountMap.get(member.userId) ?? 0) - wins - 0) // approximate
        : 0;
      const statuses = memberSettledMap.get(member.userId) ?? [];
      const { currentStreak } = this.calculateStreaks(statuses);

      return {
        userId: member.user.id,
        username: member.user.username,
        points: member.points,
        totalBets: totalMemberBets,
        winRate: totalMemberBets > 0 ? Math.round((wins / totalMemberBets) * 100) : 0,
        totalPointsWagered: wagerMap.get(member.userId) ?? 0,
        totalPointsWon: winTotalMap.get(member.userId) ?? 0,
        currentStreak,
      };
    });

    // Get recent activity
    const recentActivity = await this.getLeagueRecentActivity(leagueId);

    return {
      leagueId: league.id,
      leagueName: league.name,
      totalMembers,
      totalBets,
      totalChallenges,
      betsByStatus: {
        pending: statusMap.pending,
        won: statusMap.won,
        lost: statusMap.lost,
        void: statusMap.void,
      },
      totalPointsWagered: betsAggregate._sum.amount ?? 0,
      totalPointsWon: winsAggregate._sum.actualWin ?? 0,
      averageBetAmount: Math.round(betsAggregate._avg.amount ?? 0),
      leagueWinRate: settledBets > 0 ? Math.round((statusMap.won / settledBets) * 100) : 0,
      topMembers,
      recentActivity,
    };
  }

  // ========================================
  // Private helpers
  // ========================================

  private buildStatusMap(
    betsByStatus: { status: string; _count: number }[]
  ): Record<string, number> {
    return betsByStatus.reduce(
      (acc, s) => {
        acc[s.status] = s._count;
        return acc;
      },
      { pending: 0, won: 0, lost: 0, void: 0 } as Record<string, number>
    );
  }

  private calculateStreaks(statuses: string[]): {
    currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
    bestWinStreak: number;
    worstLossStreak: number;
  } {
    if (statuses.length === 0) {
      return {
        currentStreak: { type: 'none', count: 0 },
        bestWinStreak: 0,
        worstLossStreak: 0,
      };
    }

    // Current streak (most recent first)
    let currentType: 'win' | 'loss' = statuses[0] === 'won' ? 'win' : 'loss';
    let currentCount = 0;
    for (const status of statuses) {
      if ((status === 'won' && currentType === 'win') || (status === 'lost' && currentType === 'loss')) {
        currentCount++;
      } else {
        break;
      }
    }

    // Best win streak and worst loss streak (iterate chronologically: reverse)
    let bestWinStreak = 0;
    let worstLossStreak = 0;
    let winStreak = 0;
    let lossStreak = 0;

    for (let i = statuses.length - 1; i >= 0; i--) {
      if (statuses[i] === 'won') {
        winStreak++;
        lossStreak = 0;
        if (winStreak > bestWinStreak) bestWinStreak = winStreak;
      } else {
        lossStreak++;
        winStreak = 0;
        if (lossStreak > worstLossStreak) worstLossStreak = lossStreak;
      }
    }

    return {
      currentStreak: { type: currentType, count: currentCount },
      bestWinStreak,
      worstLossStreak,
    };
  }

  private async enrichTopBettors(
    topBettorsRaw: { userId: string; _count: number }[]
  ): Promise<TopBettor[]> {
    if (topBettorsRaw.length === 0) return [];

    const ids = topBettorsRaw.map((b) => b.userId);

    const [users, winCounts, winTotals, lossTotals] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, username: true },
      }),
      prisma.bet.groupBy({
        by: ['userId'],
        where: { userId: { in: ids }, status: 'won' },
        _count: true,
      }),
      prisma.bet.groupBy({
        by: ['userId'],
        where: { userId: { in: ids }, status: 'won' },
        _sum: { actualWin: true },
      }),
      prisma.bet.groupBy({
        by: ['userId'],
        where: { userId: { in: ids }, status: 'lost' },
        _sum: { amount: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.username]));
    const winCountMap = new Map(winCounts.map((w) => [w.userId, w._count]));
    const winTotalMap = new Map(winTotals.map((w) => [w.userId, w._sum.actualWin ?? 0]));
    const lossTotalMap = new Map(lossTotals.map((l) => [l.userId, l._sum.amount ?? 0]));

    return topBettorsRaw.map((bettor) => {
      const wins = winCountMap.get(bettor.userId) ?? 0;
      const totalWon = winTotalMap.get(bettor.userId) ?? 0;
      const totalLost = lossTotalMap.get(bettor.userId) ?? 0;
      return {
        userId: bettor.userId,
        username: userMap.get(bettor.userId) ?? 'Unknown',
        totalBets: bettor._count,
        winRate: bettor._count > 0 ? Math.round((wins / bettor._count) * 100) : 0,
        totalPointsWon: totalWon,
        netPoints: totalWon - totalLost,
      };
    });
  }

  private async getLeagueRecentActivity(leagueId: string): Promise<LeagueActivity[]> {
    const [recentBets, recentChallenges] = await Promise.all([
      prisma.bet.findMany({
        where: { leagueId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, username: true } },
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      }),
      prisma.groupBet.findMany({
        where: { leagueId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          createdBy: { select: { id: true, username: true } },
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const activities: LeagueActivity[] = [];

    for (const bet of recentBets) {
      const matchLabel = `${bet.match.homeTeam.name} vs ${bet.match.awayTeam.name}`;
      if (bet.status === 'pending') {
        activities.push({
          type: 'bet_placed',
          userId: bet.user.id,
          username: bet.user.username,
          description: `Placed a ${bet.amount} points bet on ${matchLabel}`,
          createdAt: bet.createdAt,
        });
      } else if (bet.status === 'won') {
        activities.push({
          type: 'bet_won',
          userId: bet.user.id,
          username: bet.user.username,
          description: `Won ${bet.actualWin ?? 0} points on ${matchLabel}`,
          createdAt: bet.settledAt ?? bet.createdAt,
        });
      } else if (bet.status === 'lost') {
        activities.push({
          type: 'bet_lost',
          userId: bet.user.id,
          username: bet.user.username,
          description: `Lost ${bet.amount} points on ${matchLabel}`,
          createdAt: bet.settledAt ?? bet.createdAt,
        });
      }
    }

    for (const challenge of recentChallenges) {
      const matchLabel = `${challenge.match.homeTeam.name} vs ${challenge.match.awayTeam.name}`;
      activities.push({
        type: 'challenge_created',
        userId: challenge.createdBy.id,
        username: challenge.createdBy.username,
        description: `Created a challenge for ${matchLabel}`,
        createdAt: challenge.createdAt,
      });
    }

    // Sort by date descending and limit to 15
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return activities.slice(0, 15);
  }
}

export const statsService = new StatsService();
