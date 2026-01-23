import { prisma } from '../../lib/prisma';
import { theSportsDBClient } from './client';
import {
  TheSportsDBTeamsResponse,
  TheSportsDBTeam,
} from '../../types/thesportsdb';

/**
 * Service de synchronisation des équipes depuis TheSportsDB
 */
class TeamsService {
  /**
   * Synchroniser toutes les équipes d'une compétition
   */
  async syncTeamsByCompetition(leagueId: string): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 Syncing teams for league ${leagueId}...`);

    try {
      // Vérifier que la compétition existe dans notre DB
      const competition = await prisma.competition.findUnique({
        where: { externalId: leagueId },
      });

      if (!competition) {
        throw new Error(`Competition ${leagueId} not found in database. Sync competition first.`);
      }

      const cacheKey = `teams:league:${leagueId}`;
      const cacheTTL = 24 * 60 * 60; // 24 heures

      const response = await theSportsDBClient.get<TheSportsDBTeamsResponse>(
        `/list/teams/${leagueId}`,
        cacheKey,
        cacheTTL
      );

      if (!response.list || response.list.length === 0) {
        console.warn(`⚠️ No teams found for league ${leagueId}`);
        return;
      }

      let syncCount = 0;
      for (const team of response.list) {
        await this.upsertTeam(team);
        syncCount++;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ${syncCount} teams synced for ${competition.name} in ${duration}ms`);

      // Logger dans SyncLog
      await prisma.syncLog.create({
        data: {
          type: 'teams',
          competitionId: competition.id,
          status: 'success',
          itemsSynced: syncCount,
          durationMs: duration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to sync teams for league ${leagueId}:`, error);

      await prisma.syncLog.create({
        data: {
          type: 'teams',
          status: 'error',
          itemsSynced: 0,
          durationMs: duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Synchroniser les équipes pour toutes les compétitions actives
   */
  async syncAllTeams(): Promise<void> {
    const startTime = Date.now();
    console.log('🔄 Syncing teams for all active competitions...');

    const competitions = await prisma.competition.findMany({
      where: { isActive: true },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const competition of competitions) {
      try {
        await this.syncTeamsByCompetition(competition.externalId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to sync teams for ${competition.name}, continuing...`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Teams sync completed: ${successCount} competitions success, ${errorCount} errors (${duration}ms)`
    );
  }

  /**
   * Synchroniser une équipe spécifique
   */
  async syncTeam(teamId: string): Promise<void> {
    console.log(`🔄 Syncing team ${teamId}...`);

    try {
      const cacheKey = `team:v2:${teamId}`;
      const cacheTTL = 24 * 60 * 60; // 24 heures

      const response = await theSportsDBClient.get<TheSportsDBTeamsResponse>(
        `/lookup/team/${teamId}`,
        cacheKey,
        cacheTTL
      );

      if (!response.list || response.list.length === 0) {
        throw new Error(`Team ${teamId} not found`);
      }

      await this.upsertTeam(response.list[0]);
      console.log(`✅ Team ${response.list[0].strTeam} synced`);
    } catch (error) {
      console.error(`❌ Failed to sync team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Upsert d'une équipe dans la base de données
   */
  private async upsertTeam(team: TheSportsDBTeam): Promise<void> {
    await prisma.team.upsert({
      where: {
        externalId: team.idTeam,
      },
      create: {
        externalId: team.idTeam,
        name: team.strTeam,
        shortName: team.strTeamShort || team.strAlternate || null,
        logoUrl: team.strBadge || team.strLogo || null,
        country: team.strCountry || null,
        syncedAt: new Date(),
      },
      update: {
        name: team.strTeam,
        shortName: team.strTeamShort || team.strAlternate || null,
        logoUrl: team.strBadge || team.strLogo || null,
        country: team.strCountry || null,
        syncedAt: new Date(),
      },
    });
  }

  /**
   * Récupérer toutes les équipes
   */
  async getAllTeams() {
    return prisma.team.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Récupérer les équipes avec pagination et filtres
   */
  async getTeamsWithPagination(options: {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    // Construire les conditions de recherche
    const where: any = {};

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { shortName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.country) {
      where.country = { equals: options.country, mode: 'insensitive' };
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              players: true,
              homeMatches: true,
              awayMatches: true,
            },
          },
        },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Rechercher des équipes par nom
   */
  async searchTeams(query: string) {
    return prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { shortName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Récupérer une équipe par son ID
   */
  async getTeamById(teamId: string) {
    return prisma.team.findUnique({
      where: { id: teamId },
      include: {
        homeMatches: {
          take: 5,
          orderBy: { startTime: 'desc' },
          include: {
            competition: true,
            awayTeam: true,
          },
        },
        awayMatches: {
          take: 5,
          orderBy: { startTime: 'desc' },
          include: {
            competition: true,
            homeTeam: true,
          },
        },
        _count: {
          select: {
            players: true,
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les matchs d'une équipe avec filtres
   */
  async getTeamMatches(teamId: string, options: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = Math.max(0, options.offset || 0);

    // Construire les conditions
    const where: any = {
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ],
    };

    if (options.status) {
      where.status = options.status;
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          competition: true,
          homeTeam: true,
          awayTeam: true,
          odds: true,
        },
      }),
      prisma.match.count({ where }),
    ]);

    return { matches, total };
  }

  /**
   * Récupérer les statistiques d'une équipe
   */
  async getTeamStats(teamId: string) {
    // Récupérer tous les matchs terminés
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeamId: teamId },
          { awayTeamId: teamId },
        ],
        status: 'finished',
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    });

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    for (const match of matches) {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      if (teamScore !== null && opponentScore !== null) {
        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          wins++;
        } else if (teamScore < opponentScore) {
          losses++;
        } else {
          draws++;
        }
      }
    }

    const totalMatches = wins + draws + losses;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Compter les matchs par rôle
    const [homeMatchesCount, awayMatchesCount, playersCount] = await Promise.all([
      prisma.match.count({ where: { homeTeamId: teamId } }),
      prisma.match.count({ where: { awayTeamId: teamId } }),
      prisma.player.count({ where: { teamId } }),
    ]);

    return {
      totalMatches,
      homeMatches: homeMatchesCount,
      awayMatches: awayMatchesCount,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      winRate,
      playersCount,
    };
  }

  /**
   * Récupérer la liste des pays disponibles
   */
  async getAvailableCountries() {
    const teams = await prisma.team.findMany({
      where: {
        country: { not: null },
      },
      select: {
        country: true,
      },
      distinct: ['country'],
      orderBy: {
        country: 'asc',
      },
    });

    return teams.map((t) => t.country).filter((c): c is string => c !== null);
  }
}

export const teamsService = new TeamsService();
