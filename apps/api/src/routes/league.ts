import { Router, Response } from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  CreateLeagueRequest,
  CreateLeagueResponse,
  GetLeaguesRequest,
  GetLeaguesResponse,
  GetLeagueResponse,
  UpdateLeagueRequest,
  UpdateLeagueResponse,
  DeleteLeagueResponse,
  RegenerateInviteCodeResponse,
} from '@betteam/shared/api/leagues';
import { League } from '@betteam/shared/interfaces/League';

const router = Router();

/**
 * Generate a unique invite code (8 characters, alphanumeric uppercase)
 */
const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Transform Prisma league to API response format
 */
const transformLeague = (league: any): League => {
  const { owner, members, _count, ...rest } = league;
  return {
    ...rest,
    owner: owner
      ? {
          id: owner.id,
          email: owner.email,
          username: owner.username,
          firstName: owner.firstName,
          lastName: owner.lastName,
          avatar: owner.avatar,
          isActive: owner.isActive,
          createdAt: owner.createdAt,
          updatedAt: owner.updatedAt,
        }
      : undefined,
    members: members?.map((m: any) => ({
      id: m.id,
      leagueId: m.leagueId,
      userId: m.userId,
      role: m.role,
      points: m.points,
      joinedAt: m.joinedAt,
      user: m.user
        ? {
            id: m.user.id,
            email: m.user.email,
            username: m.user.username,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            avatar: m.user.avatar,
            isActive: m.user.isActive,
            createdAt: m.user.createdAt,
            updatedAt: m.user.updatedAt,
          }
        : undefined,
    })),
    _count,
  };
};

// POST /api/leagues - Create a new league
router.post(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: CreateLeagueRequest.Body },
    res: Response<CreateLeagueResponse | { error: string }>
  ) => {
    try {
      const { name, description, isPrivate = true } = req.body;
      const userId = req.userId!;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'League name is required.' });
      }

      if (name.length > 100) {
        return res.status(400).json({ error: 'League name must be 100 characters or less.' });
      }

      if (description && description.length > 500) {
        return res.status(400).json({ error: 'Description must be 500 characters or less.' });
      }

      // Generate unique invite code
      let inviteCode: string;
      let isUnique = false;
      do {
        inviteCode = generateInviteCode();
        const existing = await prisma.league.findUnique({ where: { inviteCode } });
        isUnique = !existing;
      } while (!isUnique);

      // Create league and add owner as first member in a transaction
      const league = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const newLeague = await tx.league.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            isPrivate,
            ownerId: userId,
            inviteCode,
          },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        // Add owner as first member with 'owner' role
        await tx.leagueMember.create({
          data: {
            leagueId: newLeague.id,
            userId,
            role: 'owner',
            points: 1000, // Starting points
          },
        });

        // Return league with member count
        return tx.league.findUnique({
          where: { id: newLeague.id },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            _count: {
              select: { members: true },
            },
          },
        });
      });

      return res.status(201).json({
        league: transformLeague(league),
        message: 'League created successfully.',
      });
    } catch (error) {
      console.error('Create league error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/leagues - List leagues the user is a member of
router.get(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetLeaguesRequest.Query },
    res: Response<GetLeaguesResponse | { error: string }>
  ) => {
    try {
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const search = req.query.search as string | undefined;
      const skip = (page - 1) * limit;

      // Build where clause: user must be a member of the league
      const whereClause: any = {
        isActive: true,
        members: {
          some: {
            userId,
          },
        },
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [leagues, total] = await Promise.all([
        prisma.league.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            _count: {
              select: { members: true },
            },
          },
        }),
        prisma.league.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        leagues: leagues.map(transformLeague),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('List leagues error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/leagues/:id - Get league details
router.get(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<GetLeagueResponse | { error: string }>) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const league = await prisma.league.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  isActive: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
            orderBy: { points: 'desc' },
          },
          _count: {
            select: { members: true },
          },
        },
      });

      if (!league) {
        return res.status(404).json({ error: 'League not found.' });
      }

      if (!league.isActive) {
        return res.status(404).json({ error: 'League not found.' });
      }

      // Check if user is a member (for private leagues)
      const isMember = league.members.some((m: { userId: string }) => m.userId === userId);
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'You do not have access to this league.' });
      }

      // Hide invite code if user is not admin/owner
      const userMembership = league.members.find((m: { userId: string; role: string }) => m.userId === userId);
      const canSeeInviteCode = userMembership && ['owner', 'admin'].includes(userMembership.role);

      const responseLeague = transformLeague(league);
      if (!canSeeInviteCode) {
        responseLeague.inviteCode = '********';
      }

      return res.status(200).json({
        league: responseLeague,
      });
    } catch (error) {
      console.error('Get league error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PATCH /api/leagues/:id - Update league
router.patch(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: UpdateLeagueRequest.Body },
    res: Response<UpdateLeagueResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { name, description, isPrivate } = req.body;

      // Find league and check ownership
      const league = await prisma.league.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId },
          },
        },
      });

      if (!league) {
        return res.status(404).json({ error: 'League not found.' });
      }

      if (!league.isActive) {
        return res.status(404).json({ error: 'League not found.' });
      }

      // Check if user is owner or admin
      const userMembership = league.members[0];
      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        return res.status(403).json({ error: 'Only league owners and admins can update the league.' });
      }

      // Build update data
      const updateData: any = {};
      if (name !== undefined) {
        if (name.trim().length === 0) {
          return res.status(400).json({ error: 'League name cannot be empty.' });
        }
        if (name.length > 100) {
          return res.status(400).json({ error: 'League name must be 100 characters or less.' });
        }
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        if (description && description.length > 500) {
          return res.status(400).json({ error: 'Description must be 500 characters or less.' });
        }
        updateData.description = description?.trim() || null;
      }
      if (isPrivate !== undefined) {
        updateData.isPrivate = isPrivate;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update.' });
      }

      const updatedLeague = await prisma.league.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          _count: {
            select: { members: true },
          },
        },
      });

      return res.status(200).json({
        league: transformLeague(updatedLeague),
        message: 'League updated successfully.',
      });
    } catch (error) {
      console.error('Update league error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// DELETE /api/leagues/:id - Delete league (soft delete)
router.delete(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<DeleteLeagueResponse | { error: string }>) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const league = await prisma.league.findUnique({
        where: { id },
      });

      if (!league) {
        return res.status(404).json({ error: 'League not found.' });
      }

      if (!league.isActive) {
        return res.status(404).json({ error: 'League not found.' });
      }

      // Only owner can delete
      if (league.ownerId !== userId) {
        return res.status(403).json({ error: 'Only the league owner can delete the league.' });
      }

      await prisma.league.update({
        where: { id },
        data: { isActive: false },
      });

      return res.status(200).json({
        message: 'League deleted successfully.',
      });
    } catch (error) {
      console.error('Delete league error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/leagues/:id/regenerate-code - Regenerate invite code
router.post(
  '/:id/regenerate-code',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<RegenerateInviteCodeResponse | { error: string }>) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const league = await prisma.league.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId },
          },
        },
      });

      if (!league) {
        return res.status(404).json({ error: 'League not found.' });
      }

      if (!league.isActive) {
        return res.status(404).json({ error: 'League not found.' });
      }

      // Check if user is owner or admin
      const userMembership = league.members[0];
      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        return res.status(403).json({ error: 'Only league owners and admins can regenerate the invite code.' });
      }

      // Generate new unique invite code
      let inviteCode: string;
      let isUnique = false;
      do {
        inviteCode = generateInviteCode();
        const existing = await prisma.league.findUnique({ where: { inviteCode } });
        isUnique = !existing;
      } while (!isUnique);

      await prisma.league.update({
        where: { id },
        data: { inviteCode },
      });

      return res.status(200).json({
        inviteCode,
        message: 'Invite code regenerated successfully.',
      });
    } catch (error) {
      console.error('Regenerate invite code error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

export default router;
