import { Router, Request, Response } from 'express';
import { cleanupService } from '../services/cleanup';

const router = Router();

/**
 * GET /api/cleanup/stats
 * Obtenir les statistiques avant nettoyage
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cleanupService.getCleanupStats();

    return res.status(200).json({
      message: 'Cleanup statistics',
      stats,
      description: {
        finishedMatchOdds: 'Cotes de matchs terminés à supprimer',
        finishedMatchesWithoutBets: 'Matchs terminés sans paris à supprimer',
        oldSyncLogs: 'Logs de sync de plus de 30 jours à supprimer',
        expiredTokens: 'Tokens expirés à supprimer',
      },
    });
  } catch (error) {
    console.error('Get cleanup stats error:', error);
    return res.status(500).json({
      error: 'Failed to get cleanup stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/cleanup/run
 * Exécuter le nettoyage complet (mode safe)
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    console.log('🧹 Manual cleanup triggered');

    const result = await cleanupService.runFullCleanup();

    return res.status(200).json({
      message: 'Cleanup completed successfully',
      result,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      error: 'Failed to run cleanup',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/cleanup/match-odds
 * Nettoyer uniquement les cotes des matchs terminés
 */
router.post('/match-odds', async (req: Request, res: Response) => {
  try {
    const count = await cleanupService.cleanupFinishedMatchOdds();

    return res.status(200).json({
      message: 'Match odds cleanup completed',
      matchOddsDeleted: count,
    });
  } catch (error) {
    console.error('Match odds cleanup error:', error);
    return res.status(500).json({
      error: 'Failed to cleanup match odds',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/cleanup/matches
 * Nettoyer uniquement les matchs terminés sans paris
 */
router.post('/matches', async (req: Request, res: Response) => {
  try {
    const count = await cleanupService.cleanupFinishedMatchesWithoutBets();

    return res.status(200).json({
      message: 'Matches cleanup completed',
      matchesDeleted: count,
    });
  } catch (error) {
    console.error('Matches cleanup error:', error);
    return res.status(500).json({
      error: 'Failed to cleanup matches',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
