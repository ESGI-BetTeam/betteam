import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/matches
router.get('/', (req: Request, res: Response) => {
  // TODO: Implémenter la récupération des matchs
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de liste des matchs à implémenter',
  });
});

export default router;
