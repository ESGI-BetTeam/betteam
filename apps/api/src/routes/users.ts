import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { User, PrivateUser } from '@betteam/shared/interfaces/User';
import {
  GetUserResponse,
  GetUsersResponse,
  GetUsersRequest,
  UpdateUserRequest,
  UpdateUserResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  DeleteUserResponse,
} from '@betteam/shared/api/users';
import { requireAuth, requireSelf, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const transformPrivateUserToUser = (privateUser: PrivateUser): User => {
  const { passwordHash, ...user } = privateUser;
  return user;
};

// GET /api/users/:id - Get user by ID
router.get(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<GetUserResponse | { error: string }>) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (!user.isActive) {
        return res.status(404).json({ error: 'User not found.' });
      }

      return res.status(200).json({
        user: transformPrivateUserToUser(user),
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/users - List users with pagination and search
router.get(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetUsersRequest.Query },
    res: Response<GetUsersResponse | { error: string }>
  ) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const search = req.query.search as string | undefined;
      const skip = (page - 1) * limit;

      const whereClause: any = {
        isActive: true,
      };

      if (search) {
        whereClause.OR = [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        users: users.map(transformPrivateUserToUser),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('List users error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PATCH /api/users/:id - Update user profile
router.patch(
  '/:id',
  requireAuth,
  requireSelf('id'),
  async (
    req: AuthenticatedRequest & { body: UpdateUserRequest.Body },
    res: Response<UpdateUserResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const { email, username, firstName, lastName, avatar } = req.body;

      // Build update data
      const updateData: Partial<{
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
      }> = {};

      if (email !== undefined) updateData.email = email;
      if (username !== undefined) updateData.username = username;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (avatar !== undefined) updateData.avatar = avatar;

      // Check for empty update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update.' });
      }

      // Check uniqueness constraints
      if (email || username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  ...(email ? [{ email }] : []),
                  ...(username ? [{ username }] : []),
                ],
              },
            ],
          },
        });

        if (existingUser) {
          const field = existingUser.email === email ? 'Email' : 'Username';
          return res.status(409).json({
            error: `${field} is already used by another account.`,
          });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json({
        user: transformPrivateUserToUser(updatedUser),
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/users/:id/password - Change password
router.post(
  '/:id/password',
  requireAuth,
  requireSelf('id'),
  async (
    req: AuthenticatedRequest & { body: UpdatePasswordRequest.Body },
    res: Response<UpdatePasswordResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required.',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long.',
        });
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });

      return res.status(200).json({
        message: 'Password updated successfully.',
      });
    } catch (error) {
      console.error('Update password error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// DELETE /api/users/:id - Soft delete (deactivate account)
router.delete(
  '/:id',
  requireAuth,
  requireSelf('id'),
  async (req: AuthenticatedRequest, res: Response<DeleteUserResponse | { error: string }>) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (!user.isActive) {
        return res.status(400).json({ error: 'Account is already deactivated.' });
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return res.status(200).json({
        message: 'Account deactivated successfully.',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

export default router;
