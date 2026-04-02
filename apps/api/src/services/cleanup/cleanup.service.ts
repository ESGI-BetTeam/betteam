import { prisma } from '../../lib/prisma';

/**
 * Résultat du nettoyage
 */
interface CleanupResult {
  matchOddsDeleted: number;
  matchesDeleted: number;
  syncLogsDeleted: number;
  errors: string[];
}

/**
 * Service de nettoyage des données obsolètes
 *
 * Mode safe :
 * - Supprime les MatchOdds des matchs terminés (cotes inutiles)
 * - Supprime les Match terminés SANS paris ni challenges (pour garder l'historique)
 * - Supprime les anciens SyncLogs
 */
class CleanupService {
  /**
   * Nettoyer les cotes des matchs terminés
   * Les cotes ne sont plus utiles une fois le match terminé
   */
  async cleanupFinishedMatchOdds(): Promise<number> {
    const result = await prisma.matchOdds.deleteMany({
      where: {
        match: {
          status: {
            in: ['finished', 'cancelled', 'postponed'],
          },
        },
      },
    });

    console.log(`🧹 Deleted ${result.count} MatchOdds for finished matches`);
    return result.count;
  }

  /**
   * Nettoyer les matchs terminés qui n'ont aucun pari ni challenge
   * On garde les matchs avec historique de paris pour les statistiques
   */
  async cleanupFinishedMatchesWithoutBets(): Promise<number> {
    // Trouver les matchs terminés sans paris ni challenges
    const matchesToDelete = await prisma.match.findMany({
      where: {
        status: {
          in: ['finished', 'cancelled', 'postponed'],
        },
        bets: {
          none: {},
        },
        groupBets: {
          none: {},
        },
      },
      select: {
        id: true,
      },
    });

    if (matchesToDelete.length === 0) {
      console.log('🧹 No finished matches without bets to delete');
      return 0;
    }

    const matchIds = matchesToDelete.map((m) => m.id);

    // Supprimer les matchs (MatchOdds sera supprimé en cascade)
    const result = await prisma.match.deleteMany({
      where: {
        id: {
          in: matchIds,
        },
      },
    });

    console.log(`🧹 Deleted ${result.count} finished matches without bets`);
    return result.count;
  }

  /**
   * Nettoyer les anciens logs de synchronisation
   * @param daysToKeep Nombre de jours à conserver (défaut: 30)
   */
  async cleanupOldSyncLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.syncLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`🧹 Deleted ${result.count} SyncLogs older than ${daysToKeep} days`);
    return result.count;
  }

  /**
   * Nettoyer les tokens expirés
   */
  async cleanupExpiredTokens(): Promise<{ refreshTokens: number; passwordResetTokens: number }> {
    const now = new Date();

    const refreshResult = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
      },
    });

    const passwordResetResult = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
      },
    });

    console.log(`🧹 Deleted ${refreshResult.count} expired refresh tokens`);
    console.log(`🧹 Deleted ${passwordResetResult.count} expired/used password reset tokens`);

    return {
      refreshTokens: refreshResult.count,
      passwordResetTokens: passwordResetResult.count,
    };
  }

  /**
   * Exécuter le nettoyage complet (mode safe)
   */
  async runFullCleanup(): Promise<CleanupResult> {
    console.log('🧹 Starting full cleanup (safe mode)...');
    const startTime = Date.now();

    const result: CleanupResult = {
      matchOddsDeleted: 0,
      matchesDeleted: 0,
      syncLogsDeleted: 0,
      errors: [],
    };

    try {
      // 1. Supprimer les cotes des matchs terminés
      result.matchOddsDeleted = await this.cleanupFinishedMatchOdds();
    } catch (error) {
      const errorMsg = `Failed to cleanup MatchOdds: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    try {
      // 2. Supprimer les matchs terminés sans paris
      result.matchesDeleted = await this.cleanupFinishedMatchesWithoutBets();
    } catch (error) {
      const errorMsg = `Failed to cleanup Matches: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    try {
      // 3. Supprimer les anciens logs de sync
      result.syncLogsDeleted = await this.cleanupOldSyncLogs(30);
    } catch (error) {
      const errorMsg = `Failed to cleanup SyncLogs: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    try {
      // 4. Supprimer les tokens expirés
      await this.cleanupExpiredTokens();
    } catch (error) {
      const errorMsg = `Failed to cleanup tokens: ${error}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Cleanup completed in ${duration}ms`);
    console.log(`   - MatchOdds deleted: ${result.matchOddsDeleted}`);
    console.log(`   - Matches deleted: ${result.matchesDeleted}`);
    console.log(`   - SyncLogs deleted: ${result.syncLogsDeleted}`);

    return result;
  }

  /**
   * Obtenir les statistiques avant nettoyage
   */
  async getCleanupStats(): Promise<{
    finishedMatchOdds: number;
    finishedMatchesWithoutBets: number;
    oldSyncLogs: number;
    expiredTokens: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const now = new Date();

    const [
      finishedMatchOdds,
      finishedMatchesWithoutBets,
      oldSyncLogs,
      expiredRefreshTokens,
      expiredPasswordTokens,
    ] = await Promise.all([
      prisma.matchOdds.count({
        where: {
          match: {
            status: { in: ['finished', 'cancelled', 'postponed'] },
          },
        },
      }),
      prisma.match.count({
        where: {
          status: { in: ['finished', 'cancelled', 'postponed'] },
          bets: { none: {} },
          groupBets: { none: {} },
        },
      }),
      prisma.syncLog.count({
        where: { createdAt: { lt: cutoffDate } },
      }),
      prisma.refreshToken.count({
        where: {
          OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
        },
      }),
      prisma.passwordResetToken.count({
        where: {
          OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }],
        },
      }),
    ]);

    return {
      finishedMatchOdds,
      finishedMatchesWithoutBets,
      oldSyncLogs,
      expiredTokens: expiredRefreshTokens + expiredPasswordTokens,
    };
  }
}

export const cleanupService = new CleanupService();
