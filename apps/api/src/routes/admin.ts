import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { adminService } from '../services/admin.service';
import { competitionsService } from '../services/thesportsdb/competitions.service';
import { teamsService } from '../services/thesportsdb/teams.service';
import { matchesService } from '../services/thesportsdb/matches.service';
import { oddsService } from '../services/theoddsapi/odds.service';

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

export default router;
