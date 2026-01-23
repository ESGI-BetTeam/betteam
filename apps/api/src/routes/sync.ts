import { Router, Request, Response } from 'express';
import {
  competitionsService,
  teamsService,
  matchesService,
  playersService,
  COMPETITION_IDS,
} from '../services/thesportsdb';
import { oddsService, ODDS_API_COMPETITION_MAPPING } from '../services/theoddsapi';

const router = Router();

/**
 * POST /api/sync/competitions
 * Synchroniser toutes les compétitions
 */
router.post('/competitions', async (req: Request, res: Response) => {
  try {
    const { leagueId } = req.body;

    if (leagueId) {
      // Sync une seule compétition
      await competitionsService.syncCompetition(leagueId);
      return res.status(200).json({
        message: `Competition ${leagueId} synchronized successfully`,
      });
    }

    // Sync toutes les compétitions
    await competitionsService.syncAllCompetitions();
    return res.status(200).json({
      message: 'All competitions synchronized successfully',
      count: Object.keys(COMPETITION_IDS).length,
    });
  } catch (error) {
    console.error('Sync competitions error:', error);
    return res.status(500).json({
      error: 'Failed to sync competitions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/competitions/football
 * Synchroniser uniquement les compétitions de football
 */
router.post('/competitions/football', async (req: Request, res: Response) => {
  try {
    await competitionsService.syncFootballCompetitions();
    return res.status(200).json({
      message: 'Football competitions synchronized successfully',
    });
  } catch (error) {
    console.error('Sync football competitions error:', error);
    return res.status(500).json({
      error: 'Failed to sync football competitions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/teams
 * Synchroniser les équipes
 */
router.post('/teams', async (req: Request, res: Response) => {
  try {
    const { leagueId } = req.body;

    if (leagueId) {
      // Sync équipes pour une compétition
      await teamsService.syncTeamsByCompetition(leagueId);
      return res.status(200).json({
        message: `Teams for league ${leagueId} synchronized successfully`,
      });
    }

    // Sync équipes pour toutes les compétitions
    await teamsService.syncAllTeams();
    return res.status(200).json({
      message: 'Teams for all competitions synchronized successfully',
    });
  } catch (error) {
    console.error('Sync teams error:', error);
    return res.status(500).json({
      error: 'Failed to sync teams',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/players
 * Synchroniser les joueurs
 * Body optionnel:
 * - teamId: ID externe TheSportsDB de l'équipe
 */
router.post('/players', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.body;

    if (teamId) {
      // Sync joueurs pour une équipe spécifique
      await playersService.syncTeamPlayers(teamId);
      return res.status(200).json({
        message: `Players for team ${teamId} synchronized successfully`,
      });
    }

    // Sync joueurs pour toutes les équipes
    await playersService.syncAllPlayers();
    return res.status(200).json({
      message: 'Players for all teams synchronized successfully',
    });
  } catch (error) {
    console.error('Sync players error:', error);
    return res.status(500).json({
      error: 'Failed to sync players',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/matches
 * Synchroniser les matchs
 */
router.post('/matches', async (req: Request, res: Response) => {
  try {
    const { leagueId, type } = req.body;

    if (leagueId) {
      // Sync matchs pour une compétition
      if (type === 'upcoming') {
        await matchesService.syncUpcomingMatches(leagueId);
        return res.status(200).json({
          message: `Upcoming matches for league ${leagueId} synchronized successfully`,
        });
      } else if (type === 'past') {
        await matchesService.syncPastMatches(leagueId);
        return res.status(200).json({
          message: `Past matches for league ${leagueId} synchronized successfully`,
        });
      } else {
        // Sync tous les matchs (upcoming + past)
        await matchesService.syncAllMatchesForCompetition(leagueId);
        return res.status(200).json({
          message: `All matches for league ${leagueId} synchronized successfully`,
        });
      }
    }

    // Sync tous les matchs pour toutes les compétitions
    await matchesService.syncAllMatches();
    return res.status(200).json({
      message: 'Matches for all competitions synchronized successfully',
    });
  } catch (error) {
    console.error('Sync matches error:', error);
    return res.status(500).json({
      error: 'Failed to sync matches',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/all
 * Synchroniser tout (competitions + teams + matches)
 */
router.post('/all', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Starting full synchronization...');

    // 1. Sync competitions
    console.log('📋 Step 1/3: Syncing competitions...');
    await competitionsService.syncFootballCompetitions(); // Commence avec football

    // 2. Sync teams
    console.log('👥 Step 2/3: Syncing teams...');
    await teamsService.syncAllTeams();

    // 3. Sync matches
    console.log('📅 Step 3/3: Syncing matches...');
    await matchesService.syncAllMatches();

    console.log('✅ Full synchronization completed!');

    return res.status(200).json({
      message: 'Full synchronization completed successfully',
      steps: ['competitions', 'teams', 'matches'],
    });
  } catch (error) {
    console.error('Full sync error:', error);
    return res.status(500).json({
      error: 'Failed to complete full synchronization',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/odds
 * Synchroniser les cotes depuis The Odds API
 *
 * Body optionnel:
 * - leagueId: ID TheSportsDB de la compétition (ex: "4334" pour Ligue 1)
 *
 * Note: Limité à 500 req/mois, utiliser avec parcimonie
 * Les CRON jobs (9h et 18h) gèrent la sync automatique
 */
router.post('/odds', async (req: Request, res: Response) => {
  try {
    const { leagueId } = req.body;

    if (leagueId) {
      // Sync cotes pour une compétition spécifique
      const result = await oddsService.syncOddsForCompetition(leagueId);
      return res.status(200).json({
        message: `Odds for league ${leagueId} synchronized successfully`,
        ...result,
      });
    }

    // Sync cotes pour toutes les compétitions supportées
    const stats = await oddsService.syncAllOdds();
    return res.status(200).json({
      message: 'Odds synchronization completed',
      ...stats,
    });
  } catch (error) {
    console.error('Sync odds error:', error);
    return res.status(500).json({
      error: 'Failed to sync odds',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/odds/status
 * Obtenir le statut de la synchronisation des cotes
 */
router.get('/odds/status', async (req: Request, res: Response) => {
  try {
    const stats = oddsService.getStats();

    const { prisma } = await import('../lib/prisma');

    const [oddsCount, recentOdds] = await Promise.all([
      prisma.matchOdds.count(),
      prisma.matchOdds.findMany({
        orderBy: { syncedAt: 'desc' },
        take: 10,
        include: {
          match: {
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
              competition: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      totalOddsRecords: oddsCount,
      supportedCompetitions: Object.entries(ODDS_API_COMPETITION_MAPPING).map(
        ([oddsKey, sportsDbId]) => ({
          oddsApiKey: oddsKey,
          theSportsDbId: sportsDbId,
        })
      ),
      apiStats: stats.apiStats,
      recentSyncs: recentOdds.map((o) => ({
        matchId: o.matchId,
        match: `${o.match.homeTeam.name} vs ${o.match.awayTeam.name}`,
        competition: o.match.competition.name,
        homeWinOdds: o.homeWinOdds,
        drawOdds: o.drawOdds,
        awayWinOdds: o.awayWinOdds,
        bookmakerCount: o.bookmakerCount,
        syncedAt: o.syncedAt,
      })),
    });
  } catch (error) {
    console.error('Get odds status error:', error);
    return res.status(500).json({
      error: 'Failed to get odds status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/status
 * Obtenir le statut de la synchronisation
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { prisma } = await import('../lib/prisma');

    const [competitionsCount, teamsCount, playersCount, matchesCount, recentLogs] = await Promise.all([
      prisma.competition.count({ where: { isActive: true } }),
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count(),
      prisma.syncLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          competition: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      counts: {
        competitions: competitionsCount,
        teams: teamsCount,
        players: playersCount,
        matches: matchesCount,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    return res.status(500).json({
      error: 'Failed to get sync status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
