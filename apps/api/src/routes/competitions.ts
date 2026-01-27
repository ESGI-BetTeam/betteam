import { Router, Request, Response } from 'express';
import { competitionsService, teamsService } from '../services/thesportsdb';

const router = Router();

/**
 * GET /api/competitions
 * Récupérer toutes les compétitions avec filtres
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sport, country, isActive } = req.query;

    const { prisma } = await import('../lib/prisma');

    const where: any = {};

    if (sport) {
      where.sport = (sport as string).toLowerCase();
    }

    if (country) {
      where.country = country;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const competitions = await prisma.competition.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    res.set('Cache-Control', 'public, max-age=3600'); // 1h - synced daily
    return res.status(200).json({
      competitions,
      count: competitions.length,
    });
  } catch (error) {
    console.error('Get competitions error:', error);
    return res.status(500).json({
      error: 'Failed to fetch competitions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/competitions/:id
 * Récupérer les détails d'une compétition
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { prisma } = await import('../lib/prisma');

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        matches: {
          take: 10,
          orderBy: { startTime: 'desc' },
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!competition) {
      return res.status(404).json({
        error: 'Competition not found',
      });
    }

    res.set('Cache-Control', 'public, max-age=3600'); // 1h - synced daily
    return res.status(200).json(competition);
  } catch (error) {
    console.error('Get competition error:', error);
    return res.status(500).json({
      error: 'Failed to fetch competition',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/competitions/:id/teams
 * Récupérer toutes les équipes d'une compétition
 */
router.get('/:id/teams', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { prisma } = await import('../lib/prisma');

    const competition = await prisma.competition.findUnique({
      where: { id },
    });

    if (!competition) {
      return res.status(404).json({
        error: 'Competition not found',
      });
    }

    // Récupérer toutes les équipes qui ont des matchs dans cette compétition
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { homeMatches: { some: { competitionId: id } } },
          { awayMatches: { some: { competitionId: id } } },
        ],
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.set('Cache-Control', 'public, max-age=3600'); // 1h - synced daily
    return res.status(200).json({
      competition: {
        id: competition.id,
        name: competition.name,
        sport: competition.sport,
      },
      teams,
      count: teams.length,
    });
  } catch (error) {
    console.error('Get competition teams error:', error);
    return res.status(500).json({
      error: 'Failed to fetch teams',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/competitions/:id/matches
 * Récupérer les matchs d'une compétition
 */
router.get('/:id/matches', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, limit, offset } = req.query;

    const { prisma } = await import('../lib/prisma');

    const competition = await prisma.competition.findUnique({
      where: { id },
    });

    if (!competition) {
      return res.status(404).json({
        error: 'Competition not found',
      });
    }

    const where: any = { competitionId: id };

    if (status) {
      where.status = status;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        startTime: status === 'upcoming' ? 'asc' : 'desc',
      },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0,
    });

    res.set('Cache-Control', 'public, max-age=300'); // 5 min - matches synced every 6h
    return res.status(200).json({
      competition: {
        id: competition.id,
        name: competition.name,
        sport: competition.sport,
      },
      matches,
      count: matches.length,
    });
  } catch (error) {
    console.error('Get competition matches error:', error);
    return res.status(500).json({
      error: 'Failed to fetch matches',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
