import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { statsService } from '../services/stats.service';
import type {
  GlobalStatsResponse,
  UserStatsResponse,
  LeagueStatsResponse,
} from '@betteam/shared/api/stats';

const router = Router();

// All stats routes require authentication
router.use(requireAuth);

// ========================================
// GET /api/stats/global - Global platform statistics
// ========================================
router.get('/global', async (
  req: AuthenticatedRequest,
  res: Response<GlobalStatsResponse | { error: string }>
) => {
  try {
    const stats = await statsService.getGlobalStats();
    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ========================================
// GET /api/stats/user/:id - User statistics
// ========================================
router.get('/user/:id', async (
  req: AuthenticatedRequest,
  res: Response<UserStatsResponse | { error: string }>
) => {
  try {
    const { id } = req.params;
    const stats = await statsService.getUserStats(id);

    if (!stats) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ========================================
// GET /api/stats/league/:id - League statistics
// ========================================
router.get('/league/:id', async (
  req: AuthenticatedRequest,
  res: Response<LeagueStatsResponse | { error: string }>
) => {
  try {
    const { id } = req.params;

    // Verify user is a member of the league
    const membership = await (await import('../lib/prisma')).prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId: id,
          userId: req.userId!,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You must be a member of this league to view its statistics.' });
    }

    const stats = await statsService.getLeagueStats(id);

    if (!stats) {
      return res.status(404).json({ error: 'League not found.' });
    }

    return res.status(200).json({ data: stats });
  } catch (error) {
    console.error('Error fetching league stats:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
