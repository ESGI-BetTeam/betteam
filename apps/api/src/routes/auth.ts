import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User, PrivateUser} from '@betteam/shared/interfaces/User';
import { RegisterRequest } from '@betteam/shared/api/registerRequest';
import { RegisterResponse } from '@betteam/shared/api/registerResponse';  
import { LoginRequest } from '@betteam/shared/api/loginRequest';
import { LoginResponse } from '@betteam/shared/api/loginResponse';
import { AuthMeResponse } from '@betteam/shared/api/authmeResponse';

const router = Router();

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET!,
    { 
      expiresIn:  '7d',
    }
  );
};

const transformPrivateUserToUser = (privateUser: PrivateUser): User => {
  const { passwordHash, ...user } = privateUser;
  return user;
}

// POST /api/auth/register
router.post('/register', async (req: Request<{}, {}, RegisterRequest.Body>, res: Response<RegisterResponse | { error: string }>)=> {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        error: "Email, username and password are required.",
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
      const field = existingUser.email === email ? 'Email' : "Username";
      return res.status(409).json({
        error: `${field} is already used by another account.`,
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

    const token = generateToken(newUser.id)

    const publicUser = transformPrivateUserToUser(newUser);

    return res.status(201).json({
      user: publicUser,
      token,
    });

  } catch (error) {
    console.error('Erreur Register:', error);
    return res.status(500).json({
      error: 'Internal Server Error, an error occurred during registration.',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request<{}, {}, LoginRequest.Body>, res: Response<LoginResponse | { error: string }>) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // On cherche l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user.id);
    const publicUser = transformPrivateUserToUser(user);

    return res.status(200).json({
      message: 'Login successful',
      user: publicUser,
      token,
    });

  } catch (error) {
    console.error('Erreur Login:', error);
    return res.status(500).json({ error: 'Internal Server Error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response<AuthMeResponse | { error: string }>) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided.' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Malformed token.' });
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    if (!payload || typeof payload.userId !== 'string') {
        return res.status(403).json({ error: 'Invalid token payload.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const publicUser = transformPrivateUserToUser(user);
    
    return res.status(200).json({
      user: publicUser,
    });

  } catch (error) {
    console.error('Erreur Auth Me:', error);
    return res.status(500).json({
      error: 'Internal Server Error while fetching user profile.',
    });
  }
});

export default router;
