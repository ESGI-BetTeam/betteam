import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { betsService } from '../services/bets.service';
import {
  CreateChallengeRequest,
  CreateChallengeResponse,
  GetChallengesRequest,
  GetChallengesResponse,
  GetActiveChallengesResponse,
  GetChallengeResponse,
  GetAvailableMatchesRequest,
  GetAvailableMatchesResponse,
} from '@betteam/shared/api/challenges';
import {
  PlaceBetRequest,
  PlaceBetResponse,
  GetChallengeBetsRequest,
  GetChallengeBetsResponse,
} from '@betteam/shared/api/bets';
import { GroupBetWithParticipation } from '@betteam/shared/interfaces/Challenge';

const router = Router({ mergeParams: true }); // mergeParams to access :leagueId

/**
 * Transform Prisma GroupBet to API response format
 */
const transformGroupBet = (groupBet: any, userId: string): GroupBetWithParticipation => {
  const userBet = groupBet.bets?.find((b: any) => b.userId === userId) || null;

  return {
    id: groupBet.id,
    leagueId: groupBet.leagueId,
    matchId: groupBet.matchId,
    createdById: groupBet.createdById,
    status: groupBet.status,
    closesAt: groupBet.closesAt,
    createdAt: groupBet.createdAt,
    settledAt: groupBet.settledAt,
    createdBy: groupBet.createdBy
      ? {
          id: groupBet.createdBy.id,
          email: groupBet.createdBy.email,
          username: groupBet.createdBy.username,
          firstName: groupBet.createdBy.firstName,
          lastName: groupBet.createdBy.lastName,
          avatar: groupBet.createdBy.avatar,
          role: groupBet.createdBy.role as 'user' | 'admin',
          isActive: groupBet.createdBy.isActive,
          createdAt: groupBet.createdBy.createdAt,
          updatedAt: groupBet.createdBy.updatedAt,
        }
      : undefined,
    match: groupBet.match
      ? {
          id: groupBet.match.id,
          homeTeam: {
            id: groupBet.match.homeTeam.id,
            name: groupBet.match.homeTeam.name,
            logoUrl: groupBet.match.homeTeam.logoUrl,
          },
          awayTeam: {
            id: groupBet.match.awayTeam.id,
            name: groupBet.match.awayTeam.name,
            logoUrl: groupBet.match.awayTeam.logoUrl,
          },
          startTime: groupBet.match.startTime,
          status: groupBet.match.status,
          homeScore: groupBet.match.homeScore,
          awayScore: groupBet.match.awayScore,
          competition: {
            id: groupBet.match.competition.id,
            name: groupBet.match.competition.name,
            sport: groupBet.match.competition.sport,
          },
        }
      : undefined,
    userBet: userBet
      ? {
          id: userBet.id,
          userId: userBet.userId,
          matchId: userBet.matchId,
          leagueId: userBet.leagueId,
          groupBetId: userBet.groupBetId,
          predictionType: userBet.predictionType,
          predictionValue: userBet.predictionValue,
          amount: userBet.amount,
          status: userBet.status,
          potentialWin: userBet.potentialWin,
          actualWin: userBet.actualWin,
          createdAt: userBet.createdAt,
          settledAt: userBet.settledAt,
        }
      : null,
    totalParticipants: groupBet._count?.bets || 0,
    _count: groupBet._count,
  };
};

// ============================================
// CHALLENGE ENDPOINTS
// ============================================

// POST /api/leagues/:leagueId/challenges - Create a challenge
router.post(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: CreateChallengeRequest.Body; params: { leagueId: string } },
    res: Response<CreateChallengeResponse | { error: string }>
  ) => {
    try {
      const { leagueId } = req.params;
      const { matchId } = req.body;
      const userId = req.userId!;

      if (!matchId) {
        return res.status(400).json({ error: 'L\'ID du match est requis.' });
      }

      // Check if league exists and is active
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true, currentCompetitionId: true },
      });

      if (!league || !league.isActive) {
        return res.status(404).json({ error: 'Ligue non trouvée.' });
      }

      // Check if user is a member
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (!isMember) {
        return res.status(403).json({ error: 'Vous devez être membre de cette ligue.' });
      }

      // Check if match exists and belongs to the league's competition
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          competition: true,
          homeTeam: true,
          awayTeam: true,
        },
      });

      if (!match) {
        return res.status(404).json({ error: 'Match non trouvé.' });
      }

      // Check if match belongs to the league's current competition
      if (league.currentCompetitionId && match.competitionId !== league.currentCompetitionId) {
        return res.status(400).json({
          error: 'Ce match n\'appartient pas à la compétition de la ligue.',
        });
      }

      // Check if match is within betting window (J-7 to M-10)
      const bettableCheck = betsService.isMatchBettable(match.startTime);
      if (!bettableCheck.valid) {
        return res.status(400).json({ error: bettableCheck.error! });
      }

      // Check if challenge already exists for this match
      const challengeExists = await betsService.challengeExists(leagueId, matchId);
      if (challengeExists) {
        return res.status(409).json({ error: 'Un challenge existe déjà pour ce match dans cette ligue.' });
      }

      // Calculate closes_at (M-10)
      const closesAt = betsService.calculateClosesAt(match.startTime);

      // Create the challenge
      const groupBet = await prisma.groupBet.create({
        data: {
          leagueId,
          matchId,
          createdById: userId,
          status: 'open',
          closesAt,
        },
        include: {
          createdBy: {
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
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              competition: true,
            },
          },
          _count: {
            select: { bets: true },
          },
        },
      });

      return res.status(201).json({
        challenge: transformGroupBet(groupBet, userId),
        message: 'Challenge créé avec succès.',
      });
    } catch (error) {
      console.error('Create challenge error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// GET /api/leagues/:leagueId/challenges - List challenges
router.get(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetChallengesRequest.Query; params: { leagueId: string } },
    res: Response<GetChallengesResponse | { error: string }>
  ) => {
    try {
      const { leagueId } = req.params;
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const status = req.query.status as string | undefined;
      const skip = (page - 1) * limit;

      // Check if league exists
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true, isPrivate: true },
      });

      if (!league || !league.isActive) {
        return res.status(404).json({ error: 'Ligue non trouvée.' });
      }

      // Check membership for private leagues
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'Vous n\'avez pas accès à cette ligue.' });
      }

      // Build where clause
      const whereClause: any = { leagueId };
      if (status && ['open', 'closed', 'settled'].includes(status)) {
        whereClause.status = status;
      }

      const [challenges, total] = await Promise.all([
        prisma.groupBet.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
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
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
                competition: true,
              },
            },
            bets: {
              where: { userId },
            },
            _count: {
              select: { bets: true },
            },
          },
        }),
        prisma.groupBet.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        challenges: challenges.map((c) => transformGroupBet(c, userId)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('List challenges error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// GET /api/leagues/:leagueId/challenges/active - Get active (open) challenges
router.get(
  '/active',
  requireAuth,
  async (
    req: AuthenticatedRequest & { params: { leagueId: string } },
    res: Response<GetActiveChallengesResponse | { error: string }>
  ) => {
    try {
      const { leagueId } = req.params;
      const userId = req.userId!;

      // Check if league exists
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true, isPrivate: true },
      });

      if (!league || !league.isActive) {
        return res.status(404).json({ error: 'Ligue non trouvée.' });
      }

      // Check membership for private leagues
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'Vous n\'avez pas accès à cette ligue.' });
      }

      const challenges = await prisma.groupBet.findMany({
        where: {
          leagueId,
          status: 'open',
          closesAt: {
            gt: new Date(), // Only those still open
          },
        },
        orderBy: { closesAt: 'asc' },
        include: {
          createdBy: {
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
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              competition: true,
            },
          },
          bets: {
            where: { userId },
          },
          _count: {
            select: { bets: true },
          },
        },
      });

      return res.status(200).json({
        challenges: challenges.map((c) => transformGroupBet(c, userId)),
        total: challenges.length,
      });
    } catch (error) {
      console.error('Get active challenges error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// GET /api/leagues/:leagueId/challenges/:id - Get challenge details
router.get(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest & { params: { leagueId: string; id: string } },
    res: Response<GetChallengeResponse | { error: string }>
  ) => {
    try {
      const { leagueId, id } = req.params;
      const userId = req.userId!;

      // Check if league exists
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true, isPrivate: true },
      });

      if (!league || !league.isActive) {
        return res.status(404).json({ error: 'Ligue non trouvée.' });
      }

      // Check membership for private leagues
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'Vous n\'avez pas accès à cette ligue.' });
      }

      const challenge = await prisma.groupBet.findFirst({
        where: {
          id,
          leagueId,
        },
        include: {
          createdBy: {
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
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              competition: true,
            },
          },
          bets: {
            where: { userId },
          },
          _count: {
            select: { bets: true },
          },
        },
      });

      if (!challenge) {
        return res.status(404).json({ error: 'Challenge non trouvé.' });
      }

      return res.status(200).json({
        challenge: transformGroupBet(challenge, userId),
      });
    } catch (error) {
      console.error('Get challenge error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// ============================================
// BETTING ON CHALLENGES
// ============================================

// POST /api/leagues/:leagueId/challenges/:challengeId/bets - Place a bet
router.post(
  '/:challengeId/bets',
  requireAuth,
  async (
    req: AuthenticatedRequest & {
      body: PlaceBetRequest.Body;
      params: { leagueId: string; challengeId: string };
    },
    res: Response<PlaceBetResponse | { error: string }>
  ) => {
    try {
      const { leagueId, challengeId } = req.params;
      const { predictionType, predictionValue, amount } = req.body;
      const userId = req.userId!;

      // Validate input
      if (!predictionType || !predictionValue) {
        return res.status(400).json({ error: 'Type et valeur de prédiction requis.' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Le montant doit être supérieur à 0.' });
      }

      // Check if league exists
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true },
      });

      if (!league || !league.isActive) {
        return res.status(404).json({ error: 'Ligue non trouvée.' });
      }

      // Check if user is a member
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (!isMember) {
        return res.status(403).json({ error: 'Vous devez être membre de cette ligue.' });
      }

      // Check weekly bet limit
      const canBet = await betsService.canPlaceBet(userId, leagueId);
      if (!canBet.valid) {
        return res.status(400).json({ error: canBet.error! });
      }

      // Check if challenge exists
      const challenge = await prisma.groupBet.findFirst({
        where: {
          id: challengeId,
          leagueId,
        },
        include: {
          match: true,
        },
      });

      if (!challenge) {
        return res.status(404).json({ error: 'Challenge non trouvé.' });
      }

      // Check if challenge is still open
      if (challenge.status !== 'open') {
        return res.status(400).json({ error: 'Ce challenge n\'est plus ouvert aux paris.' });
      }

      // Check if betting deadline has passed (M-10)
      if (new Date() > challenge.closesAt) {
        return res.status(400).json({ error: 'La période de paris est terminée pour ce challenge.' });
      }

      // Check if user has already bet on this challenge
      const alreadyBet = await betsService.hasUserBetOnChallenge(userId, challengeId);
      if (alreadyBet) {
        return res.status(409).json({ error: 'Vous avez déjà parié sur ce challenge.' });
      }

      // Validate prediction format
      const predictionValid = betsService.validatePredictionValue(predictionType, predictionValue);
      if (!predictionValid.valid) {
        return res.status(400).json({ error: predictionValid.error! });
      }

      // Check user has enough points
      const membership = await prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: {
            leagueId,
            userId,
          },
        },
      });

      if (!membership || membership.points < amount) {
        return res.status(400).json({ error: 'Vous n\'avez pas assez de points.' });
      }

      // Create bet in a transaction (deduct points + create bet)
      const bet = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Deduct points from member
        await tx.leagueMember.update({
          where: { id: membership.id },
          data: { points: { decrement: amount } },
        });

        // Create the bet
        return tx.bet.create({
          data: {
            userId,
            matchId: challenge.matchId,
            leagueId,
            groupBetId: challengeId,
            predictionType,
            predictionValue,
            amount,
            status: 'pending',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
            },
          },
        });
      });

      return res.status(201).json({
        bet: {
          id: bet.id,
          userId: bet.userId,
          matchId: bet.matchId,
          leagueId: bet.leagueId,
          groupBetId: bet.groupBetId,
          predictionType: bet.predictionType as 'winner',
          predictionValue: bet.predictionValue,
          amount: bet.amount,
          status: bet.status as 'pending' | 'won' | 'lost' | 'void',
          potentialWin: bet.potentialWin,
          actualWin: bet.actualWin,
          createdAt: bet.createdAt,
          settledAt: bet.settledAt,
          user: {
            id: bet.user.id,
            email: bet.user.email,
            username: bet.user.username,
            firstName: bet.user.firstName,
            lastName: bet.user.lastName,
            avatar: bet.user.avatar,
            role: bet.user.role as 'user' | 'admin',
            isActive: bet.user.isActive,
            createdAt: bet.user.createdAt,
            updatedAt: bet.user.updatedAt,
          },
          match: {
            id: bet.match.id,
            homeTeam: bet.match.homeTeam.name,
            awayTeam: bet.match.awayTeam.name,
            homeScore: bet.match.homeScore,
            awayScore: bet.match.awayScore,
            startTime: bet.match.startTime,
            status: bet.match.status,
          },
        },
        message: 'Pari placé avec succès.',
      });
    } catch (error) {
      console.error('Place bet error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// GET /api/leagues/:leagueId/challenges/:challengeId/bets - Get challenge bets
router.get(
  '/:challengeId/bets',
  requireAuth,
  async (
    req: AuthenticatedRequest & {
      query: GetChallengeBetsRequest.Query;
      params: { leagueId: string; challengeId: string };
    },
    res: Response<GetChallengeBetsResponse | { error: string }>
  ) => {
    try {
      const { leagueId, challengeId } = req.params;
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const skip = (page - 1) * limit;

      // Check if league exists
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true, isPrivate: true },
      });

      if (!league || !league.isActive) {
        return res.status(404).json({ error: 'Ligue non trouvée.' });
      }

      // Check membership for private leagues
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'Vous n\'avez pas accès à cette ligue.' });
      }

      // Check if challenge exists
      const challenge = await prisma.groupBet.findFirst({
        where: {
          id: challengeId,
          leagueId,
        },
      });

      if (!challenge) {
        return res.status(404).json({ error: 'Challenge non trouvé.' });
      }

      const [bets, total] = await Promise.all([
        prisma.bet.findMany({
          where: { groupBetId: challengeId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        }),
        prisma.bet.count({ where: { groupBetId: challengeId } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        bets: bets.map((bet) => ({
          id: bet.id,
          user: bet.user,
          predictionType: bet.predictionType as any,
          predictionValue: bet.predictionValue,
          amount: bet.amount,
          status: bet.status as any,
          potentialWin: bet.potentialWin,
          actualWin: bet.actualWin,
          createdAt: bet.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get challenge bets error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

// ============================================
// AVAILABLE MATCHES FOR CHALLENGES
// ============================================

// GET /api/leagues/:leagueId/available-matches - Get matches available for challenges
router.get(
  '/available-matches',
  requireAuth,
  async (
    req: AuthenticatedRequest & {
      query: GetAvailableMatchesRequest.Query;
      params: { leagueId: string };
    },
    res: Response<GetAvailableMatchesResponse | { error: string }>
  ) => {
    try {
      const { leagueId } = req.params;
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const skip = (page - 1) * limit;

      // Check if league exists
      const league = await prisma.league.findUnique({
        where: { id: leagueId },
        select: { id: true, isActive: true, isPrivate: true, currentCompetitionId: true },
      });

      if (!league || !league.isActive) {
        return res.status(404).json({ error: 'Ligue non trouvée.' });
      }

      // Check membership for private leagues
      const isMember = await betsService.isLeagueMember(userId, leagueId);
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'Vous n\'avez pas accès à cette ligue.' });
      }

      if (!league.currentCompetitionId) {
        return res.status(400).json({
          error: 'Aucune compétition n\'est sélectionnée pour cette ligue.',
        });
      }

      // Calculate date range (J-7 to future)
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Get existing challenges for this league
      const existingChallenges = await prisma.groupBet.findMany({
        where: { leagueId },
        select: { matchId: true },
      });
      const challengedMatchIds = new Set(existingChallenges.map((c) => c.matchId));

      // Get available matches
      const whereClause: any = {
        competitionId: league.currentCompetitionId,
        status: 'upcoming',
        startTime: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      };

      const [matches, total] = await Promise.all([
        prisma.match.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { startTime: 'asc' },
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        }),
        prisma.match.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        matches: matches.map((match) => ({
          id: match.id,
          homeTeam: {
            id: match.homeTeam.id,
            name: match.homeTeam.name,
            logoUrl: match.homeTeam.logoUrl,
          },
          awayTeam: {
            id: match.awayTeam.id,
            name: match.awayTeam.name,
            logoUrl: match.awayTeam.logoUrl,
          },
          startTime: match.startTime,
          status: match.status,
          round: match.round,
          hasChallenge: challengedMatchIds.has(match.id),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get available matches error:', error);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  }
);

export default router;
