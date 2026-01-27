import { Router, Request, Response } from 'express';
import { matchesService } from '../services/thesportsdb';
import { oddsService } from '../services/theoddsapi';

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

    res.set('Cache-Control', 'public, max-age=300'); // 5 min - synced by CRON every 6h
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

    res.set('Cache-Control', 'public, max-age=300'); // 5 min
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

    res.set('Cache-Control', 'public, max-age=300'); // 5 min
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
 * GET /api/matches/with-odds
 * Récupérer les matchs avec leurs cotes
 * Query params:
 * - competitionId: filtrer par compétition
 * - limit: nombre max de résultats (défaut: 50)
 * - onlyWithOdds: true pour ne retourner que les matchs avec cotes
 */
router.get('/with-odds', async (req: Request, res: Response) => {
  try {
    const { competitionId, limit, onlyWithOdds } = req.query;

    const matches = await oddsService.getMatchesWithOdds({
      competitionId: competitionId as string,
      limit: limit ? parseInt(limit as string) : 50,
      onlyWithOdds: onlyWithOdds === 'true',
    });

    res.set('Cache-Control', 'public, max-age=600'); // 10 min - odds synced 2x/day
    return res.status(200).json({
      matches: matches.map((match) => ({
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        competition: match.competition,
        startTime: match.startTime,
        status: match.status,
        odds: match.odds
          ? {
              homeWinOdds: match.odds.homeWinOdds,
              drawOdds: match.odds.drawOdds,
              awayWinOdds: match.odds.awayWinOdds,
              bookmakerCount: match.odds.bookmakerCount,
              lastUpdated: match.odds.syncedAt,
              oddsHomeTeam: match.odds.oddsHomeTeam,
              oddsAwayTeam: match.odds.oddsAwayTeam,
            }
          : null,
      })),
      count: matches.length,
    });
  } catch (error) {
    console.error('Get matches with odds error:', error);
    return res.status(500).json({
      error: 'Failed to fetch matches with odds',
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

    res.set('Cache-Control', 'public, max-age=300'); // 5 min
    return res.status(200).json(match);
  } catch (error) {
    console.error('Get match error:', error);
    return res.status(500).json({
      error: 'Failed to fetch match',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/matches/:id/odds
 * Récupérer les cotes d'un match spécifique
 */
router.get('/:id/odds', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const odds = await oddsService.getMatchOdds(id);

    if (!odds) {
      return res.status(404).json({
        error: 'Odds not found for this match',
        message: 'This match may not have odds available yet or is not supported by The Odds API',
      });
    }

    res.set('Cache-Control', 'public, max-age=600'); // 10 min - odds synced 2x/day
    return res.status(200).json({
      matchId: odds.matchId,
      match: {
        homeTeam: odds.match.homeTeam,
        awayTeam: odds.match.awayTeam,
        competition: odds.match.competition,
        startTime: odds.match.startTime,
      },
      odds: {
        homeWin: odds.homeWinOdds,
        draw: odds.drawOdds,
        awayWin: odds.awayWinOdds,
        bookmakerCount: odds.bookmakerCount,
        oddsHomeTeam: odds.oddsHomeTeam,
        oddsAwayTeam: odds.oddsAwayTeam,
      },
      lastUpdated: odds.syncedAt,
    });
  } catch (error) {
    console.error('Get match odds error:', error);
    return res.status(500).json({
      error: 'Failed to fetch match odds',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
