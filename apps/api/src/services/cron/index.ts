import * as cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { prisma } from '../../lib/prisma';
import { competitionsService } from '../thesportsdb/competitions.service';
import { teamsService } from '../thesportsdb/teams.service';
import { matchesService } from '../thesportsdb/matches.service';
import { oddsService } from '../theoddsapi/odds.service';
import { cleanupService } from '../cleanup';
import { walletService } from '../wallet.service';

/**
 * Configuration des tâches CRON
 * Timezone: Europe/Paris
 */
const CRON_CONFIG = {
  timezone: 'Europe/Paris',
  jobs: {
    // Wallet - Prélèvement mensuel à 1h00
    walletPayments: '0 1 * * *',
    // Cleanup - Nettoyage des données obsolètes à 2h00
    cleanup: '0 2 * * *',
    // TheSportsDB - Sync compétitions à 3h00
    syncCompetitions: '0 3 * * *',
    // TheSportsDB - Sync équipes à 4h00
    syncTeams: '0 4 * * *',
    // TheSportsDB - Sync matchs toutes les 6h (0h, 6h, 12h, 18h)
    syncMatches: '0 */6 * * *',
    // The Odds API - Sync cotes à 9h et 18h
    syncOdds: '0 9,18 * * *',
  },
} as const;

/**
 * Classe de gestion des tâches CRON planifiées
 */
class CronService {
  private scheduledTasks: ScheduledTask[] = [];

  /**
   * Initialise et démarre toutes les tâches CRON
   * Désactivé si ENABLE_CRON=false (utile pour environnement de dev)
   */
  async initialize(): Promise<void> {
    // Vérifier si les CRON sont activés (par défaut: true)
    const enableCron = process.env.ENABLE_CRON !== 'false';

    if (!enableCron) {
      console.log('⏰ [CRON] CRON jobs désactivés (ENABLE_CRON=false)');
      return;
    }

    console.log('⏰ [CRON] Initialisation des tâches planifiées...');
    console.log(`⏰ [CRON] Timezone: ${CRON_CONFIG.timezone}`);

    // CRON 0: Wallet payments (1x/jour à 1h)
    this.scheduleTask('wallet-payments', CRON_CONFIG.jobs.walletPayments, async () => {
      console.log('⏰ [CRON] Démarrage traitement paiements cagnotte...');
      const startTime = Date.now();
      try {
        const result = await walletService.processAllDuePayments();
        console.log(
          `💰 [CRON] Paiements traités: ${result.processed} succès, ${result.failed} échecs`,
        );
        await this.logCronExecution('cron-wallet-payments', 'success', Date.now() - startTime);
      } catch (error) {
        await this.logCronExecution('cron-wallet-payments', 'error', Date.now() - startTime, error);
      }
    });

    // CRON 1: Cleanup données obsolètes (1x/jour à 2h)
    this.scheduleTask('cleanup', CRON_CONFIG.jobs.cleanup, async () => {
      console.log('⏰ [CRON] Démarrage cleanup...');
      const startTime = Date.now();
      try {
        await cleanupService.runFullCleanup();
        await this.logCronExecution('cron-cleanup', 'success', Date.now() - startTime);
      } catch (error) {
        await this.logCronExecution('cron-cleanup', 'error', Date.now() - startTime, error);
      }
    });

    // CRON 1: Sync compétitions (1x/jour à 3h)
    this.scheduleTask('sync-competitions', CRON_CONFIG.jobs.syncCompetitions, async () => {
      console.log('⏰ [CRON] Démarrage sync compétitions...');
      const startTime = Date.now();
      try {
        await competitionsService.syncAllCompetitions();
        await this.logCronExecution('cron-competitions', 'success', Date.now() - startTime);
      } catch (error) {
        await this.logCronExecution('cron-competitions', 'error', Date.now() - startTime, error);
      }
    });

    // CRON 2: Sync équipes (1x/jour à 4h)
    this.scheduleTask('sync-teams', CRON_CONFIG.jobs.syncTeams, async () => {
      console.log('⏰ [CRON] Démarrage sync équipes...');
      const startTime = Date.now();
      try {
        await teamsService.syncAllTeams();
        await this.logCronExecution('cron-teams', 'success', Date.now() - startTime);
      } catch (error) {
        await this.logCronExecution('cron-teams', 'error', Date.now() - startTime, error);
      }
    });

    // CRON 3: Sync matchs (toutes les 6h)
    this.scheduleTask('sync-matches', CRON_CONFIG.jobs.syncMatches, async () => {
      console.log('⏰ [CRON] Démarrage sync matchs...');
      const startTime = Date.now();
      try {
        await matchesService.syncAllMatches();
        await this.logCronExecution('cron-matches', 'success', Date.now() - startTime);
      } catch (error) {
        await this.logCronExecution('cron-matches', 'error', Date.now() - startTime, error);
      }
    });

    // CRON 4: Sync cotes (2x/jour à 9h et 18h)
    this.scheduleTask('sync-odds', CRON_CONFIG.jobs.syncOdds, async () => {
      console.log('⏰ [CRON] Démarrage sync cotes (The Odds API)...');
      const startTime = Date.now();
      try {
        await oddsService.syncAllOdds();
        await this.logCronExecution('cron-odds', 'success', Date.now() - startTime);
      } catch (error) {
        await this.logCronExecution('cron-odds', 'error', Date.now() - startTime, error);
      }
    });

    this.printSchedule();
    console.log('✅ [CRON] Toutes les tâches sont planifiées');
  }

  /**
   * Planifie une tâche CRON
   */
  private scheduleTask(name: string, cronExpression: string, task: () => Promise<void>): void {
    const scheduledTask = cron.schedule(
      cronExpression,
      async () => {
        console.log(`⏰ [CRON] Exécution: ${name}`);
        try {
          await task();
          console.log(`✅ [CRON] Terminé: ${name}`);
        } catch (error) {
          console.error(`❌ [CRON] Échec: ${name}`, error);
        }
      },
      {
        timezone: CRON_CONFIG.timezone,
      },
    );

    this.scheduledTasks.push(scheduledTask);
    console.log(`⏰ [CRON] Tâche planifiée: ${name} (${cronExpression})`);
  }

  /**
   * Log l'exécution d'un CRON dans SyncLog
   */
  private async logCronExecution(
    type: string,
    status: 'success' | 'error',
    durationMs: number,
    error?: unknown,
  ): Promise<void> {
    try {
      await prisma.syncLog.create({
        data: {
          type,
          status,
          itemsSynced: 0,
          durationMs,
          error: error instanceof Error ? error.message : undefined,
        },
      });
    } catch (logError) {
      console.error('❌ [CRON] Impossible de logger:', logError);
    }
  }

  /**
   * Affiche le planning des tâches CRON
   */
  private printSchedule(): void {
    console.log('');
    console.log('📅 [CRON] Planning des tâches:');
    console.log('┌──────────────────────────────────────────────────────┐');
    console.log('│ Tâche               │ Horaire          │ Fréquence  │');
    console.log('├──────────────────────────────────────────────────────┤');
    console.log('│ Paiements Cagnotte  │ 01:00            │ 1x/jour    │');
    console.log('│ Cleanup             │ 02:00            │ 1x/jour    │');
    console.log('│ Sync Compétitions   │ 03:00            │ 1x/jour    │');
    console.log('│ Sync Équipes        │ 04:00            │ 1x/jour    │');
    console.log('│ Sync Matchs         │ 00:00, 06:00...  │ Toutes 6h  │');
    console.log('│ Sync Cotes          │ 09:00, 18:00     │ 2x/jour    │');
    console.log('└──────────────────────────────────────────────────────┘');
    console.log('');
  }

  /**
   * Arrête toutes les tâches CRON
   */
  stop(): void {
    console.log('🛑 [CRON] Arrêt des tâches planifiées...');
    for (const task of this.scheduledTasks) {
      task.stop();
    }
    this.scheduledTasks = [];
    console.log('✅ [CRON] Toutes les tâches sont arrêtées');
  }

  /**
   * Exécute manuellement une tâche CRON (pour tests/debug)
   */
  async runManually(
    taskName: 'cleanup' | 'competitions' | 'teams' | 'matches' | 'odds' | 'wallet',
  ): Promise<void> {
    console.log(`⏰ [CRON] Exécution manuelle: ${taskName}`);
    const startTime = Date.now();

    try {
      switch (taskName) {
        case 'wallet':
          await walletService.processAllDuePayments();
          break;
        case 'cleanup':
          await cleanupService.runFullCleanup();
          break;
        case 'competitions':
          await competitionsService.syncAllCompetitions();
          break;
        case 'teams':
          await teamsService.syncAllTeams();
          break;
        case 'matches':
          await matchesService.syncAllMatches();
          break;
        case 'odds':
          await oddsService.syncAllOdds();
          break;
      }
      console.log(
        `✅ [CRON] Exécution manuelle terminée: ${taskName} (${Date.now() - startTime}ms)`,
      );
    } catch (error) {
      console.error(`❌ [CRON] Échec exécution manuelle: ${taskName}`, error);
      throw error;
    }
  }
}

export const cronService = new CronService();
