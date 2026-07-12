import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { adminService } from '../services/admin.service';
import { competitionsService } from '../services/thesportsdb/competitions.service';
import { teamsService } from '../services/thesportsdb/teams.service';
import { matchesService } from '../services/thesportsdb/matches.service';
import { oddsService } from '../services/theoddsapi/odds.service';
import { settlementService } from '../services/settlement.service';
import { prisma } from '../lib/prisma';

const router = Router();

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard
 * Get dashboard overview statistics
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

/**
 * GET /api/admin/users
 * List all users with stats (pagination, search, filters)
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, search, role, isActive } = req.query;

    const result = await adminService.getAllUsers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string | undefined,
      role: role as string | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    return res.status(200).json({
      data: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update a user (role, isActive for banning)
 */
router.patch('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    // Validate role if provided
    if (role !== undefined && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
    }

    // Prevent self-demotion
    if (id === req.userId && role === 'user') {
      return res.status(400).json({ error: 'You cannot demote yourself.' });
    }

    // Prevent self-deactivation
    if (id === req.userId && isActive === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    const user = await adminService.updateUser(id, { role, isActive });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      data: user,
      message: 'User updated successfully.',
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Permanently delete a user (hard delete)
 */
router.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const result = await adminService.deleteUser(id);

    if (!result.deleted) {
      return res.status(400).json({ error: result.message });
    }

    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

/**
 * GET /api/admin/leagues
 * List all leagues with stats (pagination, search, filters)
 */
router.get('/leagues', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, search, isActive, isFrozen } = req.query;

    const result = await adminService.getAllLeagues({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isFrozen: isFrozen !== undefined ? isFrozen === 'true' : undefined,
    });

    return res.status(200).json({
      data: result.leagues,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error('Admin list leagues error:', error);
    return res.status(500).json({ error: 'Failed to fetch leagues.' });
  }
});

/**
 * GET /api/admin/bets
 * Get global bets statistics
 */
router.get('/bets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await adminService.getBetsStats();
    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error('Admin bets stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch bets statistics.' });
  }
});

/**
 * POST /api/admin/sync/force
 * Force a synchronization (competitions, teams, matches, odds, or all)
 */
router.post('/sync/force', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.body;
    const validTypes = ['competitions', 'teams', 'matches', 'odds', 'all'];

    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid sync type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const results: Record<string, { success: boolean; message: string; itemsSynced?: number }> = {};

    if (type === 'competitions' || type === 'all') {
      try {
        await competitionsService.syncAllCompetitions();
        results.competitions = {
          success: true,
          message: 'Competitions synced successfully.',
        };
      } catch (err) {
        results.competitions = {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to sync competitions.',
        };
      }
    }

    if (type === 'teams' || type === 'all') {
      try {
        await teamsService.syncAllTeams();
        results.teams = {
          success: true,
          message: 'Teams synced successfully.',
        };
      } catch (err) {
        results.teams = {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to sync teams.',
        };
      }
    }

    if (type === 'matches' || type === 'all') {
      try {
        await matchesService.syncAllMatches();
        results.matches = {
          success: true,
          message: 'Matches synced successfully.',
        };
      } catch (err) {
        results.matches = {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to sync matches.',
        };
      }
    }

    if (type === 'odds' || type === 'all') {
      try {
        const result = await oddsService.syncAllOdds();
        results.odds = {
          success: true,
          message: 'Odds synced successfully.',
          itemsSynced: result.matchesMatched,
        };
      } catch (err) {
        results.odds = {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to sync odds.',
        };
      }
    }

    const allSuccess = Object.values(results).every((r) => r.success);

    return res.status(allSuccess ? 200 : 207).json({
      message: allSuccess ? 'Sync completed successfully.' : 'Sync completed with some errors.',
      results,
    });
  } catch (error) {
    console.error('Admin force sync error:', error);
    return res.status(500).json({ error: 'Failed to execute sync.' });
  }
});

// =============================================================================
// DEMO ENDPOINTS (for jury presentation)
// =============================================================================

/**
 * GET /api/admin/demo/competitions
 * List competitions for the demo match creation form
 */
router.get('/demo/competitions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const competitions = await prisma.competition.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sport: true, logoUrl: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
    return res.status(200).json({ data: competitions });
  } catch (error) {
    console.error('Admin demo competitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch competitions.' });
  }
});

/**
 * GET /api/admin/demo/teams
 * List teams for the demo match creation form (with optional search)
 */
router.get('/demo/teams', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search } = req.query;
    const teams = await prisma.team.findMany({
      where: search
        ? { name: { contains: search as string, mode: 'insensitive' } }
        : {},
      select: { id: true, name: true, logoUrl: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
    return res.status(200).json({ data: teams });
  } catch (error) {
    console.error('Admin demo teams error:', error);
    return res.status(500).json({ error: 'Failed to fetch teams.' });
  }
});

/**
 * GET /api/admin/demo/matches
 * List demo matches (identified by externalId starting with "demo-")
 */
router.get('/demo/matches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      where: { externalId: { startsWith: 'demo-' } },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        competition: { select: { id: true, name: true, logoUrl: true } },
        groupBets: {
          select: {
            id: true,
            status: true,
            _count: { select: { bets: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Parse expected scores from the round field
    const matchesWithExpected = matches.map((m) => {
      let expectedScore = { homeScore: 0, awayScore: 0 };
      try {
        if (m.round) {
          const parsed = JSON.parse(m.round);
          expectedScore = {
            homeScore: parsed.expectedHome ?? 0,
            awayScore: parsed.expectedAway ?? 0,
          };
        }
      } catch {
        // ignore parse errors
      }
      return { ...m, expectedScore };
    });

    return res.status(200).json({ data: matchesWithExpected });
  } catch (error) {
    console.error('Admin demo matches error:', error);
    return res.status(500).json({ error: 'Failed to fetch demo matches.' });
  }
});

/**
 * POST /api/admin/demo/matches
 * Create a demo match with expected scores
 */
router.post('/demo/matches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { competitionId, homeTeamId, awayTeamId, startTime, expectedHomeScore, expectedAwayScore } =
      req.body;

    // Validate required fields
    if (!competitionId || !homeTeamId || !awayTeamId) {
      return res.status(400).json({ error: 'Missing required fields (competitionId, homeTeamId, awayTeamId).' });
    }

    if (homeTeamId === awayTeamId) {
      return res.status(400).json({ error: 'Home team and away team must be different.' });
    }

    // Verify competition and teams exist
    const [competition, homeTeam, awayTeam] = await Promise.all([
      prisma.competition.findUnique({ where: { id: competitionId } }),
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } }),
    ]);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found.' });
    }
    if (!homeTeam) {
      return res.status(404).json({ error: 'Home team not found.' });
    }
    if (!awayTeam) {
      return res.status(404).json({ error: 'Away team not found.' });
    }

    // Generate unique externalId for demo match
    const externalId = `demo-${Date.now()}`;

    // Store expected scores in round field as JSON
    const roundData = JSON.stringify({
      expectedHome: expectedHomeScore ?? 0,
      expectedAway: expectedAwayScore ?? 0,
    });

    const match = await prisma.match.create({
      data: {
        externalId,
        competitionId,
        homeTeamId,
        awayTeamId,
        startTime: startTime ? new Date(startTime) : new Date(Date.now() + 5 * 60 * 1000), // default: 5 min from now
        status: 'upcoming',
        round: roundData,
      },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        competition: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return res.status(201).json({
      data: {
        ...match,
        expectedScore: { homeScore: expectedHomeScore ?? 0, awayScore: expectedAwayScore ?? 0 },
      },
      message: 'Demo match created successfully.',
    });
  } catch (error) {
    console.error('Admin create demo match error:', error);
    return res.status(500).json({ error: 'Failed to create demo match.' });
  }
});

/**
 * POST /api/admin/demo/matches/:id/finish
 * Finish a demo match by setting its status to "finished" and applying scores
 */
router.post('/demo/matches/:id/finish', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore } = req.body;

    const match = await prisma.match.findUnique({ where: { id } });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    if (!match.externalId.startsWith('demo-')) {
      return res.status(400).json({ error: 'Only demo matches can be finished manually.' });
    }

    if (match.status === 'finished') {
      return res.status(400).json({ error: 'Match is already finished.' });
    }

    // Use provided scores or fall back to expected scores from round field
    let finalHomeScore = homeScore;
    let finalAwayScore = awayScore;

    if (finalHomeScore === undefined || finalAwayScore === undefined) {
      try {
        if (match.round) {
          const parsed = JSON.parse(match.round);
          finalHomeScore = finalHomeScore ?? parsed.expectedHome ?? 0;
          finalAwayScore = finalAwayScore ?? parsed.expectedAway ?? 0;
        }
      } catch {
        finalHomeScore = finalHomeScore ?? 0;
        finalAwayScore = finalAwayScore ?? 0;
      }
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        status: 'finished',
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
      },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        competition: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return res.status(200).json({
      data: updated,
      message: `Match finished: ${updated.homeTeam.name} ${finalHomeScore} - ${finalAwayScore} ${updated.awayTeam.name}`,
    });
  } catch (error) {
    console.error('Admin finish demo match error:', error);
    return res.status(500).json({ error: 'Failed to finish match.' });
  }
});

/**
 * POST /api/admin/demo/settle
 * Trigger settlement of all pending bets on finished matches
 */
router.post('/demo/settle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await settlementService.settleFinishedMatches();
    return res.status(200).json({
      data: result,
      message: `Settlement completed: ${result.betsSettled} bet(s) settled, ${result.pointsCredited} points credited.`,
    });
  } catch (error) {
    console.error('Admin demo settle error:', error);
    return res.status(500).json({ error: 'Settlement failed.' });
  }
});

export default router;
