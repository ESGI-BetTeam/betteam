import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/bets
router.post('/', (req: Request, res: Response) => {
  // TODO: Implémenter la création d'un pari
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de création de pari à implémenter',
  });
});

// GET /api/bets
router.get('/', (req: Request, res: Response) => {
  // TODO: Implémenter la récupération des paris
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de liste des paris à implémenter',
  });
});

export default router;
