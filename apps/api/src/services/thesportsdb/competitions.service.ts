import { prisma } from '../../lib/prisma';
import { theSportsDBClient } from './client';
import {
  TheSportsDBLeagueResponse,
  TheSportsDBLeague,
} from '../../types/thesportsdb';

/**
 * IDs des compétitions à synchroniser selon la roadmap
 */
export const COMPETITION_IDS = {
  // Football (5 ligues)
  LIGUE_1: '7335',
  PREMIER_LEAGUE: '7293',
  LA_LIGA: '7351',
  BUNDESLIGA: '7338',
  SERIE_A: '7286',

  // Rugby (2 compétitions)
  TOP_14: '16',
  UNITED_RUGBY_CHAMPIONSHIP: '76',

  // Tennis (2 circuits)
  ATP_WORLD_TOUR: '4464',
  WTA_TOUR: '',

  // Basketball
  NBA: '12',

  // Cyclisme
  UCI_WORLD_TOUR: '',

  // Hockey sur glace
  NHL: '57',

  // Formule 1
  FORMULA_1: '',
} as const;

/**
 * Service de synchronisation des compétitions depuis TheSportsDB
 */
class CompetitionsService {
  /**
   * Synchroniser une compétition spécifique
   */
  async syncCompetition(leagueId: string): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 Syncing competition ${leagueId}...`);

    try {
      const cacheKey = `league:${leagueId}`;
      const cacheTTL = 24 * 60 * 60; // 24 heures

      const response = await theSportsDBClient.get<TheSportsDBLeagueResponse>(
        `/lookupleague.php?id=${leagueId}`,
        cacheKey,
        cacheTTL
      );

      if (!response.leagues || response.leagues.length === 0) {
        throw new Error(`Competition ${leagueId} not found`);
      }

      const league = response.leagues[0];
      await this.upsertCompetition(league);

      const duration = Date.now() - startTime;
      console.log(`✅ Competition ${league.strLeague} synced in ${duration}ms`);

      // Logger dans SyncLog
      await prisma.syncLog.create({
        data: {
          type: 'competitions',
          status: 'success',
          itemsSynced: 1,
          durationMs: duration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to sync competition ${leagueId}:`, error);

      await prisma.syncLog.create({
        data: {
          type: 'competitions',
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
   * Synchroniser toutes les compétitions définies
   */
  async syncAllCompetitions(): Promise<void> {
    const startTime = Date.now();
    const leagueIds = Object.values(COMPETITION_IDS);

    console.log(`🔄 Syncing ${leagueIds.length} competitions...`);

    let successCount = 0;
    let errorCount = 0;

    for (const leagueId of leagueIds) {
      try {
        await this.syncCompetition(leagueId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to sync ${leagueId}, continuing...`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Sync completed: ${successCount} success, ${errorCount} errors (${duration}ms)`
    );
  }

  /**
   * Synchroniser uniquement les compétitions de football
   */
  async syncFootballCompetitions(): Promise<void> {
    const footballIds = [
      COMPETITION_IDS.LIGUE_1,
      COMPETITION_IDS.PREMIER_LEAGUE,
      COMPETITION_IDS.LA_LIGA,
      COMPETITION_IDS.BUNDESLIGA,
      COMPETITION_IDS.SERIE_A,
    ];

    console.log(`⚽ Syncing ${footballIds.length} football competitions...`);

    for (const leagueId of footballIds) {
      try {
        await this.syncCompetition(leagueId);
      } catch (error) {
        console.error(`Failed to sync ${leagueId}, continuing...`);
      }
    }
  }

  /**
   * Upsert d'une compétition dans la base de données
   */
  private async upsertCompetition(league: TheSportsDBLeague): Promise<void> {
    await prisma.competition.upsert({
      where: {
        externalId: league.idLeague,
      },
      create: {
        externalId: league.idLeague,
        name: league.strLeague,
        sport: league.strSport.toLowerCase(),
        country: league.strCountry || null,
        logoUrl: league.strBadge || league.strLogo || null,
        isActive: true,
        syncedAt: new Date(),
      },
      update: {
        name: league.strLeague,
        sport: league.strSport.toLowerCase(),
        country: league.strCountry || null,
        logoUrl: league.strBadge || league.strLogo || null,
        syncedAt: new Date(),
      },
    });
  }

  /**
   * Récupérer toutes les compétitions actives
   */
  async getActiveCompetitions() {
    return prisma.competition.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Récupérer les compétitions par sport
   */
  async getCompetitionsBySport(sport: string) {
    return prisma.competition.findMany({
      where: {
        sport: sport.toLowerCase(),
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}

export const competitionsService = new CompetitionsService();
