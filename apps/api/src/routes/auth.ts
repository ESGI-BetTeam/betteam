import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        error: 'Missing Fields',
        message: "Email, username and password are required.",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : "Nom d'utilisateur";
      return res.status(409).json({
        error: 'Conflict',
        message: `${field} is already used by another account.`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName,
        lastName,
      },
    });

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' } //replace by the env variable for availaibility datetime
    );

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: 'Inscription successful',
      user: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error('Erreur Register:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: "An error occurred during registration.",
    });
  }
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
