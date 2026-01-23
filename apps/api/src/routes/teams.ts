import { Router, Request, Response } from 'express';
import { teamsService, playersService } from '../services/thesportsdb';
import { favoritesService } from '../services/favorites.service';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/teams
 * Récupérer toutes les équipes avec pagination et filtres
 * Query params:
 * - page: numéro de page (défaut: 1)
 * - limit: nombre par page (défaut: 20, max: 100)
 * - search: recherche par nom
 * - country: filtrer par pays
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, search, country } = req.query;

    const result = await teamsService.getTeamsWithPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      country: country as string,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get teams error:', error);
    return res.status(500).json({
      error: 'Failed to fetch teams',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teams/countries
 * Récupérer la liste des pays disponibles
 */
router.get('/countries', async (req: Request, res: Response) => {
  try {
    const countries = await teamsService.getAvailableCountries();

    return res.status(200).json({
      countries,
      count: countries.length,
    });
  } catch (error) {
    console.error('Get countries error:', error);
    return res.status(500).json({
      error: 'Failed to fetch countries',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teams/search
 * Rechercher des équipes par nom
 * Query params:
 * - q: terme de recherche (obligatoire)
 * - limit: nombre max de résultats (défaut: 20)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query is required',
      });
    }

    const teams = await teamsService.searchTeams(q);

    return res.status(200).json({
      teams,
      count: teams.length,
      query: q,
    });
  } catch (error) {
    console.error('Search teams error:', error);
    return res.status(500).json({
      error: 'Failed to search teams',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teams/:id
 * Récupérer une équipe par son ID avec statistiques
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeStats } = req.query;

    const team = await teamsService.getTeamById(id);

    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
      });
    }

    // Inclure les stats si demandé
    let stats = null;
    if (includeStats === 'true') {
      stats = await teamsService.getTeamStats(id);
    }

    return res.status(200).json({
      ...team,
      stats,
    });
  } catch (error) {
    console.error('Get team error:', error);
    return res.status(500).json({
      error: 'Failed to fetch team',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teams/:id/stats
 * Récupérer les statistiques d'une équipe
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que l'équipe existe
    const team = await teamsService.getTeamById(id);
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
      });
    }

    const stats = await teamsService.getTeamStats(id);

    return res.status(200).json({
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logoUrl: team.logoUrl,
      },
      stats,
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    return res.status(500).json({
      error: 'Failed to fetch team stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teams/:id/matches
 * Récupérer les matchs d'une équipe
 * Query params:
 * - status: filtrer par statut (upcoming, live, finished, postponed, cancelled)
 * - limit: nombre max de résultats (défaut: 20)
 * - offset: décalage pour pagination (défaut: 0)
 */
router.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, limit, offset } = req.query;

    // Vérifier que l'équipe existe
    const team = await teamsService.getTeamById(id);
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
      });
    }

    const result = await teamsService.getTeamMatches(id, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    return res.status(200).json({
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logoUrl: team.logoUrl,
      },
      matches: result.matches,
      total: result.total,
    });
  } catch (error) {
    console.error('Get team matches error:', error);
    return res.status(500).json({
      error: 'Failed to fetch team matches',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teams/:id/players
 * Récupérer les joueurs d'une équipe
 */
router.get('/:id/players', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que l'équipe existe
    const team = await teamsService.getTeamById(id);
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
      });
    }

    const players = await playersService.getPlayersByTeamId(id);

    return res.status(200).json({
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logoUrl: team.logoUrl,
      },
      players,
      count: players.length,
    });
  } catch (error) {
    console.error('Get team players error:', error);
    return res.status(500).json({
      error: 'Failed to fetch team players',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/teams/:id/favorite
 * Ajouter une équipe aux favoris (authentification requise)
 */
router.post('/:id/favorite', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Vérifier que l'équipe existe
    const team = await teamsService.getTeamById(id);
    if (!team) {
      return res.status(404).json({
        error: 'Team not found',
      });
    }

    await favoritesService.addFavoriteTeam(userId, id);

    return res.status(201).json({
      message: 'Team added to favorites',
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logoUrl: team.logoUrl,
      },
    });
  } catch (error) {
    console.error('Add favorite team error:', error);
    return res.status(500).json({
      error: 'Failed to add team to favorites',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/teams/:id/favorite
 * Retirer une équipe des favoris (authentification requise)
 */
router.delete('/:id/favorite', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await favoritesService.removeFavoriteTeam(userId, id);

    return res.status(200).json({
      message: 'Team removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite team error:', error);
    return res.status(500).json({
      error: 'Failed to remove team from favorites',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/teams/:id/is-favorite
 * Vérifier si une équipe est dans les favoris (authentification requise)
 */
router.get('/:id/is-favorite', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const isFavorite = await favoritesService.isFavoriteTeam(userId, id);

    return res.status(200).json({
      teamId: id,
      isFavorite,
    });
  } catch (error) {
    console.error('Check favorite team error:', error);
    return res.status(500).json({
      error: 'Failed to check favorite status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
