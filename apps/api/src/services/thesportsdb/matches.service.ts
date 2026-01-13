import { prisma } from '../../lib/prisma';
import { theSportsDBClient } from './client';
import {
  TheSportsDBEventsResponse,
  TheSportsDBEvent,
} from '../../types/thesportsdb';

/**
 * Service de synchronisation des matchs depuis TheSportsDB
 */
class MatchesService {
  /**
   * Synchroniser les matchs à venir d'une compétition
   */
  async syncUpcomingMatches(leagueId: string): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 Syncing upcoming matches for league ${leagueId}...`);

    try {
      const competition = await prisma.competition.findUnique({
        where: { externalId: leagueId },
      });

      if (!competition) {
        throw new Error(`Competition ${leagueId} not found. Sync competition first.`);
      }

      const cacheKey = `matches:upcoming:${leagueId}`;
      const cacheTTL = 60 * 60; // 1 heure

      const response = await theSportsDBClient.get<TheSportsDBEventsResponse>(
        `/eventsnextleague.php?id=${leagueId}`,
        cacheKey,
        cacheTTL
      );

      if (!response.events || response.events.length === 0) {
        console.warn(`⚠️ No upcoming matches for league ${leagueId}`);
        return;
      }

      let syncCount = 0;
      for (const event of response.events) {
        await this.upsertMatch(event, competition.id, 'upcoming');
        syncCount++;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ${syncCount} upcoming matches synced for ${competition.name} in ${duration}ms`);

      await prisma.syncLog.create({
        data: {
          type: 'matches',
          competitionId: competition.id,
          status: 'success',
          itemsSynced: syncCount,
          durationMs: duration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to sync upcoming matches for league ${leagueId}:`, error);

      await prisma.syncLog.create({
        data: {
          type: 'matches',
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
   * Synchroniser les matchs passés d'une compétition (15 derniers)
   */
  async syncPastMatches(leagueId: string): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 Syncing past matches for league ${leagueId}...`);

    try {
      const competition = await prisma.competition.findUnique({
        where: { externalId: leagueId },
      });

      if (!competition) {
        throw new Error(`Competition ${leagueId} not found. Sync competition first.`);
      }

      const cacheKey = `matches:past:${leagueId}`;
      const cacheTTL = 15 * 60; // 15 minutes

      const response = await theSportsDBClient.get<TheSportsDBEventsResponse>(
        `/eventspastleague.php?id=${leagueId}`,
        cacheKey,
        cacheTTL
      );

      if (!response.events || response.events.length === 0) {
        console.warn(`⚠️ No past matches for league ${leagueId}`);
        return;
      }

      let syncCount = 0;
      for (const event of response.events) {
        await this.upsertMatch(event, competition.id, 'finished');
        syncCount++;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ${syncCount} past matches synced for ${competition.name} in ${duration}ms`);

      await prisma.syncLog.create({
        data: {
          type: 'matches',
          competitionId: competition.id,
          status: 'success',
          itemsSynced: syncCount,
          durationMs: duration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to sync past matches for league ${leagueId}:`, error);

      await prisma.syncLog.create({
        data: {
          type: 'matches',
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
   * Synchroniser tous les matchs (upcoming + past) pour une compétition
   */
  async syncAllMatchesForCompetition(leagueId: string): Promise<void> {
    console.log(`🔄 Syncing all matches for league ${leagueId}...`);
    await this.syncUpcomingMatches(leagueId);
    await this.syncPastMatches(leagueId);
  }

  /**
   * Synchroniser les matchs pour toutes les compétitions actives
   */
  async syncAllMatches(): Promise<void> {
    const startTime = Date.now();
    console.log('🔄 Syncing matches for all active competitions...');

    const competitions = await prisma.competition.findMany({
      where: { isActive: true },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const competition of competitions) {
      try {
        await this.syncAllMatchesForCompetition(competition.externalId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to sync matches for ${competition.name}, continuing...`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Matches sync completed: ${successCount} competitions success, ${errorCount} errors (${duration}ms)`
    );
  }

  /**
   * Upsert d'un match dans la base de données
   */
  private async upsertMatch(
    event: TheSportsDBEvent,
    competitionId: string,
    defaultStatus: string
  ): Promise<void> {
    // Trouver les équipes par leur externalId
    const homeTeam = await prisma.team.findUnique({
      where: { externalId: event.idHomeTeam },
    });

    const awayTeam = await prisma.team.findUnique({
      where: { externalId: event.idAwayTeam },
    });

    if (!homeTeam || !awayTeam) {
      console.warn(`⚠️ Teams not found for match ${event.idEvent}. Skipping...`);
      return;
    }

    // Construire la date/heure du match
    const matchDateTime = this.parseMatchDateTime(event.dateEvent, event.strTime);

    // Déterminer le statut
    let status = defaultStatus;
    if (event.strStatus) {
      status = this.mapStatus(event.strStatus);
    }

    // Parser les scores
    const homeScore = event.intHomeScore ? parseInt(event.intHomeScore) : null;
    const awayScore = event.intAwayScore ? parseInt(event.intAwayScore) : null;

    await prisma.match.upsert({
      where: {
        externalId: event.idEvent,
      },
      create: {
        externalId: event.idEvent,
        competitionId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startTime: matchDateTime,
        status,
        homeScore,
        awayScore,
        venue: event.strVenue || null,
        round: event.intRound ? `Round ${event.intRound}` : null,
        syncedAt: new Date(),
      },
      update: {
        startTime: matchDateTime,
        status,
        homeScore,
        awayScore,
        venue: event.strVenue || null,
        round: event.intRound ? `Round ${event.intRound}` : null,
        syncedAt: new Date(),
      },
    });
  }

  /**
   * Parser la date et heure du match
   */
  private parseMatchDateTime(dateStr: string, timeStr?: string): Date {
    // Format TheSportsDB: "2026-01-15" et temps "20:00:00"
    if (timeStr) {
      return new Date(`${dateStr}T${timeStr}Z`);
    }
    return new Date(`${dateStr}T12:00:00Z`); // Midi UTC par défaut
  }

  /**
   * Mapper le statut TheSportsDB vers notre statut
   */
  private mapStatus(status: string): string {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('not started') || statusLower.includes('ns')) {
      return 'upcoming';
    }
    if (statusLower.includes('finished') || statusLower.includes('ft')) {
      return 'finished';
    }
    if (statusLower.includes('postponed')) {
      return 'postponed';
    }
    if (statusLower.includes('cancelled')) {
      return 'cancelled';
    }
    if (statusLower.includes('live') || statusLower.includes('1h') || statusLower.includes('2h')) {
      return 'live';
    }

    return 'upcoming';
  }

  /**
   * Récupérer les matchs avec filtres
   */
  async getMatches(filters: {
    competitionId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.competitionId) {
      where.competitionId = filters.competitionId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    return prisma.match.findMany({
      where,
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        startTime: 'asc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Récupérer un match par son ID
   */
  async getMatchById(matchId: string) {
    return prisma.match.findUnique({
      where: { id: matchId },
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
        bets: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }
}

export const matchesService = new MatchesService();
