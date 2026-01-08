import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  // TODO: Implémenter la logique d'inscription
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint d\'inscription à implémenter',
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  // TODO: Implémenter la logique de connexion
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de connexion à implémenter',
  });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  // TODO: Implémenter la récupération du profil utilisateur
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Endpoint de profil utilisateur à implémenter',
  });
});

export default router;
