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

      if (!response.teams || response.teams.length === 0) {
        console.warn(`⚠️ No teams found for league ${leagueId}`);
        return;
      }

      let syncCount = 0;
      for (const team of response.teams) {
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
      const cacheKey = `team:${teamId}`;
      const cacheTTL = 24 * 60 * 60; // 24 heures

      const response = await theSportsDBClient.get<TheSportsDBTeamsResponse>(
        `/lookupteam.php?id=${teamId}`,
        cacheKey,
        cacheTTL
      );

      if (!response.teams || response.teams.length === 0) {
        throw new Error(`Team ${teamId} not found`);
      }

      await this.upsertTeam(response.teams[0]);
      console.log(`✅ Team ${response.teams[0].strTeam} synced`);
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
        },
        awayMatches: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
      },
    });
  }
}

export const teamsService = new TeamsService();
