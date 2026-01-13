import { Router, Request, Response } from 'express';
import { matchesService } from '../services/thesportsdb';

const router = Router();

/**
 * GET /api/matches
 * Récupérer tous les matchs avec filtres
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sport, competitionId, status, startDate, endDate, limit, offset } = req.query;

    const filters: any = {};

    if (competitionId) {
      filters.competitionId = competitionId as string;
    }

    if (status) {
      filters.status = status as string;
    }

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    if (limit) {
      filters.limit = parseInt(limit as string);
    }

    if (offset) {
      filters.offset = parseInt(offset as string);
    }

    let matches = await matchesService.getMatches(filters);

    // Filtrer par sport si nécessaire
    if (sport) {
      matches = matches.filter(
        (match) => match.competition.sport.toLowerCase() === (sport as string).toLowerCase()
      );
    }

    return res.status(200).json({
      matches,
      count: matches.length,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    return res.status(500).json({
      error: 'Failed to fetch matches',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/matches/today
 * Récupérer les matchs du jour
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const matches = await matchesService.getMatches({
      startDate: today,
      endDate: tomorrow,
    });

    return res.status(200).json({
      matches,
      count: matches.length,
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Get today matches error:', error);
    return res.status(500).json({
      error: 'Failed to fetch today matches',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/matches/upcoming
 * Récupérer les prochains matchs (7 jours)
 */
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const matches = await matchesService.getMatches({
      status: 'upcoming',
      startDate: today,
      endDate: nextWeek,
      limit: 50,
    });

    return res.status(200).json({
      matches,
      count: matches.length,
    });
  } catch (error) {
    console.error('Get upcoming matches error:', error);
    return res.status(500).json({
      error: 'Failed to fetch upcoming matches',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/matches/:id
 * Récupérer un match par son ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const match = await matchesService.getMatchById(id);

    if (!match) {
      return res.status(404).json({
        error: 'Match not found',
      });
    }

    return res.status(200).json(match);
  } catch (error) {
    console.error('Get match error:', error);
    return res.status(500).json({
      error: 'Failed to fetch match',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
