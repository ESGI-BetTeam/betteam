import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { User, PrivateUser } from '@betteam/shared/interfaces/User';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

const transformPrivateUserToUser = (privateUser: PrivateUser): User => {
  const { passwordHash, ...user } = privateUser;
  return user;
};

/**
 * Middleware that requires authentication.
 * Verifies JWT token and attaches the user to the request.
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Malformed token.' });
      return;
    }

    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    } catch (err) {
      res.status(403).json({ error: 'Invalid or expired token.' });
      return;
    }

    if (!payload || typeof payload.userId !== 'string') {
      res.status(403).json({ error: 'Invalid token payload.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated.' });
      return;
    }

    req.user = transformPrivateUserToUser(user);
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

/**
 * Middleware that checks if the authenticated user is the owner of the resource.
 * Must be used after requireAuth middleware.
 */
export const requireSelf = (paramName: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const resourceId = req.params[paramName];

    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.userId !== resourceId) {
      res.status(403).json({ error: 'You can only modify your own account.' });
      return;
    }

    next();
  };
};
