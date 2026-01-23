import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { betsService } from '../services/bets.service';
import {
  GetBetsRequest,
  GetBetsResponse,
  GetBetResponse,
  GetBetHistoryRequest,
  GetBetHistoryResponse,
  WeeklyBetLimitResponse,
} from '@betteam/shared/api/bets';
import { Bet, BetStatus } from '@betteam/shared/interfaces/Bet';

const router = Router();

/**
 * Transform Prisma bet to API response format
 */
const transformBet = (bet: any): Bet => {
  return {
    id: bet.id,
    userId: bet.userId,
    matchId: bet.matchId,
    leagueId: bet.leagueId,
    groupBetId: bet.groupBetId,
    predictionType: bet.predictionType,
    predictionValue: bet.predictionValue,
    amount: bet.amount,
    status: bet.status as BetStatus,
    potentialWin: bet.potentialWin,
    actualWin: bet.actualWin,
    createdAt: bet.createdAt,
    settledAt: bet.settledAt,
    user: bet.user
      ? {
          id: bet.user.id,
          email: bet.user.email,
          username: bet.user.username,
          firstName: bet.user.firstName,
          lastName: bet.user.lastName,
          avatar: bet.user.avatar,
          isActive: bet.user.isActive,
          createdAt: bet.user.createdAt,
          updatedAt: bet.user.updatedAt,
        }
      : undefined,
    match: bet.match
      ? {
          id: bet.match.id,
          homeTeam: bet.match.homeTeam?.name || 'Unknown',
          awayTeam: bet.match.awayTeam?.name || 'Unknown',
          homeScore: bet.match.homeScore,
          awayScore: bet.match.awayScore,
          startTime: bet.match.startTime,
          status: bet.match.status,
        }
      : undefined,
    groupBet: bet.groupBet
      ? {
          id: bet.groupBet.id,
          status: bet.groupBet.status,
          closesAt: bet.groupBet.closesAt,
        }
      : undefined,
  };
};

// ============================================
// USER BETS ENDPOINTS
// ============================================

// GET /api/bets - List user's bets
router.get(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetBetsRequest.Query },
    res: Response<GetBetsResponse | { error: string }>
  ) => {
    try {
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const status = req.query.status as string | undefined;
      const leagueId = req.query.leagueId as string | undefined;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = { userId };

      if (status && ['pending', 'won', 'lost', 'void'].includes(status)) {
        whereClause.status = status;
      }

      if (leagueId) {
        whereClause.leagueId = leagueId;
      }

      const [bets, total] = await Promise.all([
        prisma.bet.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
            },
            league: {
              select: {
                id: true,
                name: true,
              },
            },
            groupBet: {
              select: {
                id: true,
                status: true,
                closesAt: true,
              },
            },
          },
        }),
        prisma.bet.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        bets: bets.map(transformBet),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('List bets error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// GET /api/bets/history - Get user's bet history with stats
router.get(
  '/history',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetBetHistoryRequest.Query },
    res: Response<GetBetHistoryResponse | { error: string }>
  ) => {
    try {
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const status = req.query.status as string | undefined;
      const leagueId = req.query.leagueId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = { userId };

      if (status && ['pending', 'won', 'lost', 'void'].includes(status)) {
        whereClause.status = status;
      }

      if (leagueId) {
        whereClause.leagueId = leagueId;
      }

      if (startDate) {
        whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(startDate) };
      }

      if (endDate) {
        whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) };
      }

      // Get bets and stats in parallel
      const [bets, total, stats] = await Promise.all([
        prisma.bet.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
            },
            league: {
              select: {
                id: true,
                name: true,
              },
            },
            groupBet: {
              select: {
                id: true,
                status: true,
                closesAt: true,
              },
            },
          },
        }),
        prisma.bet.count({ where: whereClause }),
        // Get stats for all user bets (not filtered)
        prisma.bet.groupBy({
          by: ['status'],
          where: { userId },
          _count: true,
          _sum: { amount: true, actualWin: true },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Calculate stats
      const totalBets = stats.reduce((acc, s) => acc + s._count, 0);
      const wonBets = stats.find((s) => s.status === 'won')?._count || 0;
      const lostBets = stats.find((s) => s.status === 'lost')?._count || 0;
      const pendingBets = stats.find((s) => s.status === 'pending')?._count || 0;
      const totalPointsWagered = stats.reduce((acc, s) => acc + (s._sum.amount || 0), 0);
      const totalPointsWon = stats
        .filter((s) => s.status === 'won')
        .reduce((acc, s) => acc + (s._sum.actualWin || 0), 0);
      const winRate = totalBets - pendingBets > 0 ? Math.round((wonBets / (totalBets - pendingBets)) * 100) : 0;

      return res.status(200).json({
        bets: bets.map(transformBet),
        stats: {
          totalBets,
          wonBets,
          lostBets,
          pendingBets,
          winRate,
          totalPointsWagered,
          totalPointsWon,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get bet history error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// GET /api/bets/weekly-limit - Get user's weekly bet limit status
router.get(
  '/weekly-limit',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: { leagueId?: string } },
    res: Response<WeeklyBetLimitResponse | { error: string }>
  ) => {
    try {
      const userId = req.userId!;
      const leagueId = req.query.leagueId as string | undefined;

      if (!leagueId) {
        return res.status(400).json({ error: 'L\'ID de la ligue est requis.' });
      }

      // Verify league exists and user is a member
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (!isMember) {
        return res.status(403).json({ error: 'Vous devez être membre de cette ligue.' });
      }

      const status = await betsService.getWeeklyBetStatus(userId, leagueId);

      return res.status(200).json(status);
    } catch (error) {
      console.error('Get weekly limit error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// GET /api/bets/:id - Get bet details
router.get(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<GetBetResponse | { error: string }>) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const bet = await prisma.bet.findUnique({
        where: { id },
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              competition: true,
            },
          },
          league: {
            select: {
              id: true,
              name: true,
              isPrivate: true,
            },
          },
          groupBet: {
            select: {
              id: true,
              status: true,
              closesAt: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!bet) {
        return res.status(404).json({ error: 'Pari non trouvé.' });
      }

      // Check access: either own bet or member of the league
      if (bet.userId !== userId) {
        const isMember = await betsService.isLeagueMember(userId, bet.leagueId);
        if (!isMember) {
          return res.status(403).json({ error: 'Vous n\'avez pas accès à ce pari.' });
        }
      }

      return res.status(200).json({
        bet: transformBet(bet),
      });
    } catch (error) {
      console.error('Get bet error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

export default router;
