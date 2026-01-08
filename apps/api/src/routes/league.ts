import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/leagues
router.get('/', (req: Request, res: Response) => {
  // TODO: Implémenter la récupération de toutes les ligues
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de liste des ligues à implémenter',
  });
});

// POST /api/leagues
router.post('/', (req: Request, res: Response) => {
  // TODO: Implémenter la création d'une ligue
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de création de ligue à implémenter',
  });
});

// GET /api/leagues/:leagueId
router.get('/:leagueId', (req: Request, res: Response) => {
  // TODO: Implémenter la récupération d'une ligue spécifique
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de détails de ligue à implémenter',
  });
});

export default router;
