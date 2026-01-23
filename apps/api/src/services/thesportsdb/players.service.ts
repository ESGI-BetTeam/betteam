import { prisma } from '../../lib/prisma';
import { theSportsDBClient } from './client';
import {
  TheSportsDBPlayersResponse,
  TheSportsDBPlayer,
} from '../../types/thesportsdb';

/**
 * Service de synchronisation des joueurs depuis TheSportsDB
 */
class PlayersService {
  /**
   * Synchroniser tous les joueurs d'une équipe
   */
  async syncTeamPlayers(teamExternalId: string): Promise<void> {
    const startTime = Date.now();
    console.log(`🔄 Syncing players for team ${teamExternalId}...`);

    try {
      // Vérifier que l'équipe existe dans notre DB
      const team = await prisma.team.findUnique({
        where: { externalId: teamExternalId },
      });

      if (!team) {
        throw new Error(`Team ${teamExternalId} not found in database. Sync team first.`);
      }

      const cacheKey = `players:team:${teamExternalId}`;
      const cacheTTL = 60 * 60; // 1 heure (les joueurs changent peu fréquemment)

      const response = await theSportsDBClient.get<TheSportsDBPlayersResponse>(
        `/lookup/team/players/${teamExternalId}`,
        cacheKey,
        cacheTTL
      );

      if (!response.player || response.player.length === 0) {
        console.warn(`⚠️ No players found for team ${teamExternalId}`);
        return;
      }

      let syncCount = 0;
      for (const player of response.player) {
        await this.upsertPlayer(player, team.id);
        syncCount++;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ${syncCount} players synced for ${team.name} in ${duration}ms`);

      // Logger dans SyncLog
      await prisma.syncLog.create({
        data: {
          type: 'players',
          status: 'success',
          itemsSynced: syncCount,
          durationMs: duration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Failed to sync players for team ${teamExternalId}:`, error);

      await prisma.syncLog.create({
        data: {
          type: 'players',
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
   * Synchroniser les joueurs pour toutes les équipes
   */
  async syncAllPlayers(): Promise<void> {
    const startTime = Date.now();
    console.log('🔄 Syncing players for all teams...');

    const teams = await prisma.team.findMany();

    let successCount = 0;
    let errorCount = 0;

    for (const team of teams) {
      try {
        await this.syncTeamPlayers(team.externalId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to sync players for ${team.name}, continuing...`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Players sync completed: ${successCount} teams success, ${errorCount} errors (${duration}ms)`
    );
  }

  /**
   * Upsert d'un joueur dans la base de données
   */
  private async upsertPlayer(player: TheSportsDBPlayer, teamId: string): Promise<void> {
    // Parser la date de naissance si disponible
    let dateOfBirth: Date | null = null;
    if (player.dateBorn) {
      const parsed = new Date(player.dateBorn);
      if (!isNaN(parsed.getTime())) {
        dateOfBirth = parsed;
      }
    }

    await prisma.player.upsert({
      where: {
        externalId: player.idPlayer,
      },
      create: {
        externalId: player.idPlayer,
        teamId: teamId,
        name: player.strPlayer,
        nationality: player.strNationality || null,
        position: player.strPosition || null,
        number: player.strNumber || null,
        dateOfBirth: dateOfBirth,
        height: player.strHeight || null,
        weight: player.strWeight || null,
        photoUrl: player.strThumb || player.strCutout || null,
        syncedAt: new Date(),
      },
      update: {
        teamId: teamId,
        name: player.strPlayer,
        nationality: player.strNationality || null,
        position: player.strPosition || null,
        number: player.strNumber || null,
        dateOfBirth: dateOfBirth,
        height: player.strHeight || null,
        weight: player.strWeight || null,
        photoUrl: player.strThumb || player.strCutout || null,
        syncedAt: new Date(),
      },
    });
  }

  /**
   * Récupérer tous les joueurs d'une équipe (depuis la BDD)
   */
  async getPlayersByTeamId(teamId: string) {
    return prisma.player.findMany({
      where: { teamId },
      orderBy: [
        { position: 'asc' },
        { number: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Récupérer un joueur par son ID
   */
  async getPlayerById(playerId: string) {
    return prisma.player.findUnique({
      where: { id: playerId },
      include: {
        team: true,
      },
    });
  }

  /**
   * Rechercher des joueurs par nom
   */
  async searchPlayers(query: string, limit: number = 20) {
    return prisma.player.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
          },
        },
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });
  }
}

export const playersService = new PlayersService();
