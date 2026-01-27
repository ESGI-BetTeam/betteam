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
  JoinLeagueRequest,
  JoinLeagueResponse,
  LeaveLeagueResponse,
  GetLeagueMembersRequest,
  GetLeagueMembersResponse,
  UpdateMemberRoleRequest,
  UpdateMemberRoleResponse,
  KickMemberResponse,
  GetLeaderboardRequest,
  GetLeaderboardResponse,
  LeaderboardEntry,
  GetLeagueStatsResponse,
  GetLeagueHistoryRequest,
  GetLeagueHistoryResponse,
  BetHistoryEntry,
} from '@betteam/shared/api/leagues';
import { League, LeagueMember } from '@betteam/shared/interfaces/League';

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
            planId: 'free', // Default to free plan
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

        // Create wallet for the league
        await tx.leagueWallet.create({
          data: {
            leagueId: newLeague.id,
            balance: 0,
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

// ============================================
// LEAGUE MEMBERS ENDPOINTS
// ============================================

/**
 * Transform Prisma member to API response format
 */
const transformMember = (member: any): LeagueMember => {
  const { user, ...rest } = member;
  return {
    ...rest,
    user: user
      ? {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      : undefined,
  };
};

// POST /api/leagues/:id/join - Join a league via invite code
router.post(
  '/:id/join',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: JoinLeagueRequest.Body },
    res: Response<JoinLeagueResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { inviteCode } = req.body;

      if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code is required.' });
      }

      const league = await prisma.league.findUnique({
        where: { id },
        include: {
          plan: true,
          wallet: true,
          members: {
            where: { userId },
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

      // Check if league is frozen
      if (league.wallet?.isFrozen) {
        return res.status(400).json({ error: 'Cette ligue est gelée. Contactez un administrateur pour ajouter des fonds.' });
      }

      // Check invite code
      if (league.inviteCode !== inviteCode.toUpperCase()) {
        return res.status(400).json({ error: 'Invalid invite code.' });
      }

      // Check if already a member
      if (league.members.length > 0) {
        return res.status(409).json({ error: 'You are already a member of this league.' });
      }

      // Check max members limit based on plan
      const maxMembers = league.plan?.maxMembers ?? 4;
      if (league._count.members >= maxMembers) {
        return res.status(400).json({
          error: `Cette ligue a atteint sa limite de ${maxMembers} membres. Demandez à un administrateur de passer à un plan supérieur.`,
        });
      }

      // Add user as member
      const member = await prisma.leagueMember.create({
        data: {
          leagueId: id,
          userId,
          role: 'member',
          points: 1000, // Starting points
        },
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
      });

      return res.status(201).json({
        member: transformMember(member),
        message: 'Successfully joined the league.',
      });
    } catch (error) {
      console.error('Join league error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/leagues/:id/leave - Leave a league
router.post(
  '/:id/leave',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<LeaveLeagueResponse | { error: string }>) => {
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

      const membership = league.members[0];
      if (!membership) {
        return res.status(400).json({ error: 'You are not a member of this league.' });
      }

      // Owner cannot leave, they must delete the league or transfer ownership
      if (membership.role === 'owner') {
        return res.status(400).json({
          error: 'As the owner, you cannot leave the league. Transfer ownership or delete the league instead.',
        });
      }

      await prisma.leagueMember.delete({
        where: { id: membership.id },
      });

      return res.status(200).json({
        message: 'Successfully left the league.',
      });
    } catch (error) {
      console.error('Leave league error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/leagues/:id/members - List league members
router.get(
  '/:id/members',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetLeagueMembersRequest.Query },
    res: Response<GetLeagueMembersResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const sortBy = (req.query.sortBy as string) || 'points';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      const skip = (page - 1) * limit;

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

      // Check if user is a member (for private leagues)
      const isMember = league.members.length > 0;
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'You do not have access to this league.' });
      }

      // Build orderBy clause
      let orderBy: any = {};
      if (sortBy === 'points') {
        orderBy = { points: sortOrder };
      } else if (sortBy === 'joinedAt') {
        orderBy = { joinedAt: sortOrder };
      } else if (sortBy === 'username') {
        orderBy = { user: { username: sortOrder } };
      } else {
        orderBy = { points: 'desc' };
      }

      const [members, total] = await Promise.all([
        prisma.leagueMember.findMany({
          where: { leagueId: id },
          skip,
          take: limit,
          orderBy,
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
        }),
        prisma.leagueMember.count({ where: { leagueId: id } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        members: members.map(transformMember),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('List league members error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PATCH /api/leagues/:id/members/:userId - Update member role
router.patch(
  '/:id/members/:userId',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: UpdateMemberRoleRequest.Body },
    res: Response<UpdateMemberRoleResponse | { error: string }>
  ) => {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUserId = req.userId!;
      const { role } = req.body;

      if (!role || !['admin', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Valid role (admin or member) is required.' });
      }

      const league = await prisma.league.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

      if (!league) {
        return res.status(404).json({ error: 'League not found.' });
      }

      if (!league.isActive) {
        return res.status(404).json({ error: 'League not found.' });
      }

      // Find current user's membership
      const currentUserMembership = league.members.find((m) => m.userId === currentUserId);
      if (!currentUserMembership) {
        return res.status(403).json({ error: 'You are not a member of this league.' });
      }

      // Only owner can change roles
      if (currentUserMembership.role !== 'owner') {
        return res.status(403).json({ error: 'Only the league owner can change member roles.' });
      }

      // Find target user's membership
      const targetMembership = league.members.find((m) => m.userId === targetUserId);
      if (!targetMembership) {
        return res.status(404).json({ error: 'Member not found in this league.' });
      }

      // Cannot change owner's role
      if (targetMembership.role === 'owner') {
        return res.status(400).json({ error: 'Cannot change the owner\'s role.' });
      }

      // Update the role
      const updatedMember = await prisma.leagueMember.update({
        where: { id: targetMembership.id },
        data: { role },
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
      });

      return res.status(200).json({
        member: transformMember(updatedMember),
        message: `Member role updated to ${role}.`,
      });
    } catch (error) {
      console.error('Update member role error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// DELETE /api/leagues/:id/members/:userId - Kick member from league
router.delete(
  '/:id/members/:userId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<KickMemberResponse | { error: string }>) => {
    try {
      const { id, userId: targetUserId } = req.params;
      const currentUserId = req.userId!;

      const league = await prisma.league.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

      if (!league) {
        return res.status(404).json({ error: 'League not found.' });
      }

      if (!league.isActive) {
        return res.status(404).json({ error: 'League not found.' });
      }

      // Find current user's membership
      const currentUserMembership = league.members.find((m) => m.userId === currentUserId);
      if (!currentUserMembership) {
        return res.status(403).json({ error: 'You are not a member of this league.' });
      }

      // Only owner and admins can kick members
      if (!['owner', 'admin'].includes(currentUserMembership.role)) {
        return res.status(403).json({ error: 'Only league owners and admins can remove members.' });
      }

      // Find target user's membership
      const targetMembership = league.members.find((m) => m.userId === targetUserId);
      if (!targetMembership) {
        return res.status(404).json({ error: 'Member not found in this league.' });
      }

      // Cannot kick the owner
      if (targetMembership.role === 'owner') {
        return res.status(400).json({ error: 'Cannot remove the league owner.' });
      }

      // Admins cannot kick other admins
      if (currentUserMembership.role === 'admin' && targetMembership.role === 'admin') {
        return res.status(403).json({ error: 'Admins cannot remove other admins.' });
      }

      await prisma.leagueMember.delete({
        where: { id: targetMembership.id },
      });

      return res.status(200).json({
        message: 'Member removed from the league.',
      });
    } catch (error) {
      console.error('Kick member error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ============================================
// LEAGUE LEADERBOARD & STATS ENDPOINTS
// ============================================

// GET /api/leagues/:id/leaderboard - Get league leaderboard
router.get(
  '/:id/leaderboard',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetLeaderboardRequest.Query },
    res: Response<GetLeaderboardResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as unknown as string) || 50));

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

      // Check access for private leagues
      const isMember = league.members.length > 0;
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'You do not have access to this league.' });
      }

      // Run members query and aggregated bet stats in parallel (eliminates N+1)
      const [members, allBetStats, totalMembers] = await Promise.all([
        prisma.leagueMember.findMany({
          where: { leagueId: id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { points: 'desc' },
          take: limit,
        }),
        // Single aggregated query for all members' bet stats
        prisma.bet.groupBy({
          by: ['userId', 'status'],
          where: { leagueId: id },
          _count: true,
        }),
        prisma.leagueMember.count({ where: { leagueId: id } }),
      ]);

      // Build a map of userId -> { total, won, lost } from the single query
      const betStatsMap = new Map<string, { total: number; won: number; lost: number }>();
      for (const row of allBetStats) {
        const entry = betStatsMap.get(row.userId) ?? { total: 0, won: 0, lost: 0 };
        entry.total += row._count;
        if (row.status === 'won') entry.won += row._count;
        if (row.status === 'lost') entry.lost += row._count;
        betStatsMap.set(row.userId, entry);
      }

      const leaderboard: LeaderboardEntry[] = members.map((member, index) => {
        const stats = betStatsMap.get(member.userId) ?? { total: 0, won: 0, lost: 0 };
        const winRate = stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0;

        return {
          rank: index + 1,
          userId: member.userId,
          username: member.user.username,
          avatar: member.user.avatar,
          points: member.points,
          totalBets: stats.total,
          wonBets: stats.won,
          lostBets: stats.lost,
          winRate,
          joinedAt: member.joinedAt,
        };
      });

      return res.status(200).json({
        leaderboard,
        totalMembers,
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/leagues/:id/stats - Get league statistics
router.get(
  '/:id/stats',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<GetLeagueStatsResponse | { error: string }>) => {
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

      // Check access for private leagues
      const isMember = league.members.length > 0;
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'You do not have access to this league.' });
      }

      // Run all independent queries in parallel
      const [totalMembers, betStats, mostActiveBets, userBetStatsByStatus, lastBet] = await Promise.all([
        // Total members
        prisma.leagueMember.count({ where: { leagueId: id } }),
        // Bet statistics by status
        prisma.bet.groupBy({
          by: ['status'],
          where: { leagueId: id },
          _count: true,
          _sum: { amount: true, actualWin: true },
        }),
        // Most active user (top 1 by bet count)
        prisma.bet.groupBy({
          by: ['userId'],
          where: { leagueId: id },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 1,
        }),
        // All bets grouped by userId + status (eliminates N+1 for best performer)
        prisma.bet.groupBy({
          by: ['userId', 'status'],
          where: { leagueId: id },
          _count: true,
        }),
        // Last activity
        prisma.bet.findFirst({
          where: { leagueId: id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      const totalBets = betStats.reduce((acc, stat) => acc + stat._count, 0);
      const totalBetsWon = betStats.find((s) => s.status === 'won')?._count || 0;
      const totalBetsLost = betStats.find((s) => s.status === 'lost')?._count || 0;
      const totalBetsPending = betStats.find((s) => s.status === 'pending')?._count || 0;

      const totalPointsWagered = betStats.reduce((acc, stat) => acc + (stat._sum.amount || 0), 0);
      const totalPointsWon = betStats
        .filter((s) => s.status === 'won')
        .reduce((acc, stat) => acc + (stat._sum.actualWin || 0), 0);

      const averageWinRate = totalBets > 0 ? Math.round((totalBetsWon / totalBets) * 100) : 0;

      // Compute per-user totals and won counts from the batched query
      const userTotalsMap = new Map<string, { total: number; won: number }>();
      for (const row of userBetStatsByStatus) {
        const entry = userTotalsMap.get(row.userId) ?? { total: 0, won: 0 };
        entry.total += row._count;
        if (row.status === 'won') {
          entry.won += row._count;
        }
        userTotalsMap.set(row.userId, entry);
      }

      // Find best performer (highest win rate with minimum 5 bets) - no extra queries
      let bestPerformerId: string | null = null;
      let bestWinRate = 0;
      let bestWonCount = 0;
      for (const [userId, stats] of userTotalsMap) {
        if (stats.total >= 5) {
          const winRate = (stats.won / stats.total) * 100;
          if (winRate > bestWinRate) {
            bestWinRate = winRate;
            bestPerformerId = userId;
            bestWonCount = stats.won;
          }
        }
      }

      // Batch-fetch user info for mostActive + bestPerformer in a single query
      const userIdsToFetch = new Set<string>();
      if (mostActiveBets.length > 0) userIdsToFetch.add(mostActiveBets[0].userId);
      if (bestPerformerId) userIdsToFetch.add(bestPerformerId);

      const usersMap = new Map<string, { id: string; username: string; avatar: string | null }>();
      if (userIdsToFetch.size > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: [...userIdsToFetch] } },
          select: { id: true, username: true, avatar: true },
        });
        for (const u of users) {
          usersMap.set(u.id, u);
        }
      }

      let mostActiveUser = null;
      if (mostActiveBets.length > 0) {
        const user = usersMap.get(mostActiveBets[0].userId);
        if (user) {
          mostActiveUser = {
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            totalBets: mostActiveBets[0]._count,
          };
        }
      }

      let bestPerformer = null;
      if (bestPerformerId) {
        const user = usersMap.get(bestPerformerId);
        if (user) {
          bestPerformer = {
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            winRate: Math.round(bestWinRate),
            wonBets: bestWonCount,
          };
        }
      }

      return res.status(200).json({
        stats: {
          totalMembers,
          totalBets,
          totalBetsWon,
          totalBetsLost,
          totalBetsPending,
          averageWinRate,
          totalPointsWagered,
          totalPointsWon,
          mostActiveUser,
          bestPerformer,
          createdAt: league.createdAt,
          lastActivityAt: lastBet?.createdAt || null,
        },
      });
    } catch (error) {
      console.error('Get league stats error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/leagues/:id/history - Get league bet history
router.get(
  '/:id/history',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetLeagueHistoryRequest.Query },
    res: Response<GetLeagueHistoryResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));
      const status = req.query.status as string | undefined;
      const filterUserId = req.query.userId as string | undefined;
      const skip = (page - 1) * limit;

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

      // Check access for private leagues
      const isMember = league.members.length > 0;
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'You do not have access to this league.' });
      }

      // Build where clause
      const whereClause: any = { leagueId: id };
      if (status && ['pending', 'won', 'lost', 'void'].includes(status)) {
        whereClause.status = status;
      }
      if (filterUserId) {
        whereClause.userId = filterUserId;
      }

      const [bets, total] = await Promise.all([
        prisma.bet.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            match: {
              include: {
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
              },
            },
          },
        }),
        prisma.bet.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const betHistory: BetHistoryEntry[] = bets.map((bet) => ({
        id: bet.id,
        oddsUser: {
          oddsUserId: bet.user.id,
          username: bet.user.username,
          avatar: bet.user.avatar,
        },
        match: {
          id: bet.match.id,
          homeTeam: bet.match.homeTeam.name,
          awayTeam: bet.match.awayTeam.name,
          homeScore: bet.match.homeScore,
          awayScore: bet.match.awayScore,
          startTime: bet.match.startTime,
          status: bet.match.status,
        },
        predictionType: bet.predictionType,
        predictionValue: bet.predictionValue,
        amount: bet.amount,
        status: bet.status,
        potentialWin: bet.potentialWin,
        actualWin: bet.actualWin,
        createdAt: bet.createdAt,
        settledAt: bet.settledAt,
      }));

      return res.status(200).json({
        bets: betHistory,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get league history error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ============================================
// LEAGUE COMPETITION ENDPOINTS
// ============================================

import { betsService } from '../services/bets.service';
import { walletService } from '../services/wallet.service';
import { plansService } from '../services/plans.service';
import {
  GetLeagueCompetitionResponse,
  UpdateLeagueCompetitionRequest,
  UpdateLeagueCompetitionResponse,
} from '@betteam/shared/api/challenges';
import {
  GetWalletResponse,
  ContributeRequest,
  ContributeResponse,
  GetWalletHistoryRequest,
  GetWalletHistoryResponse,
  UpgradeLeagueRequest,
  UpgradeLeagueResponse,
  DowngradeLeagueRequest,
  DowngradeLeagueResponse,
} from '@betteam/shared/api/wallet';

// GET /api/leagues/:id/competition - Get league's current competition
router.get(
  '/:id/competition',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<GetLeagueCompetitionResponse | { error: string }>) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const league = await prisma.league.findUnique({
        where: { id },
        include: {
          currentCompetition: true,
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

      // Check membership for private leagues
      const isMember = league.members.length > 0;
      if (league.isPrivate && !isMember) {
        return res.status(403).json({ error: 'You do not have access to this league.' });
      }

      // Get days until competition can be changed
      const canChangeIn = await betsService.getDaysUntilCompetitionChange(id);

      return res.status(200).json({
        competition: league.currentCompetition
          ? {
              id: league.currentCompetition.id,
              name: league.currentCompetition.name,
              sport: league.currentCompetition.sport,
              country: league.currentCompetition.country,
              logoUrl: league.currentCompetition.logoUrl,
            }
          : null,
        changedAt: league.competitionChangedAt,
        canChangeIn,
      });
    } catch (error) {
      console.error('Get league competition error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// PATCH /api/leagues/:id/competition - Update league's competition
router.patch(
  '/:id/competition',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: UpdateLeagueCompetitionRequest.Body },
    res: Response<UpdateLeagueCompetitionResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const { competitionId } = req.body;
      const userId = req.userId!;

      if (!competitionId) {
        return res.status(400).json({ error: 'Competition ID is required.' });
      }

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

      // Check if user is admin or owner
      const userMembership = league.members[0];
      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        return res.status(403).json({ error: 'Only league owners and admins can change the competition.' });
      }

      // Check if competition exists
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
      });

      if (!competition) {
        return res.status(404).json({ error: 'Competition not found.' });
      }

      if (!competition.isActive) {
        return res.status(400).json({ error: 'This competition is not active.' });
      }

      // Check if can change competition (weekly limit for free plan)
      const canChange = await betsService.canChangeCompetition(id);
      if (!canChange.valid) {
        return res.status(400).json({ error: canChange.error! });
      }

      // Update league competition
      const now = new Date();
      await prisma.league.update({
        where: { id },
        data: {
          currentCompetitionId: competitionId,
          competitionChangedAt: now,
        },
      });

      return res.status(200).json({
        competition: {
          id: competition.id,
          name: competition.name,
          sport: competition.sport,
          country: competition.country,
          logoUrl: competition.logoUrl,
        },
        changedAt: now,
        message: 'Competition updated successfully.',
      });
    } catch (error) {
      console.error('Update league competition error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ============================================
// LEAGUE WALLET ENDPOINTS
// ============================================

// GET /api/leagues/:id/wallet - Get wallet details
router.get(
  '/:id/wallet',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response<GetWalletResponse | { error: string }>) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Verify user is a member of the league
      const membership = await prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: { leagueId: id, userId },
        },
      });

      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this league.' });
      }

      const wallet = await walletService.getWallet(id);

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found.' });
      }

      return res.status(200).json({ wallet });
    } catch (error) {
      console.error('Get wallet error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/leagues/:id/wallet/contribute - Contribute to wallet
router.post(
  '/:id/wallet/contribute',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: ContributeRequest.Body },
    res: Response<ContributeResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0.' });
      }

      // Verify user is a member of the league
      const membership = await prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: { leagueId: id, userId },
        },
      });

      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this league.' });
      }

      const result = await walletService.contribute(id, userId, amount);

      return res.status(201).json({
        contribution: result.contribution,
        newBalance: result.newBalance,
        monthsCovered: result.monthsCovered,
        message: 'Contribution successful. Thank you!',
      });
    } catch (error) {
      console.error('Contribute error:', error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// GET /api/leagues/:id/wallet/history - Get contribution history
router.get(
  '/:id/wallet/history',
  requireAuth,
  async (
    req: AuthenticatedRequest & { query: GetWalletHistoryRequest.Query },
    res: Response<GetWalletHistoryResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const page = Math.max(1, parseInt(req.query.page as unknown as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as unknown as string) || 20));

      // Verify user is a member of the league
      const membership = await prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: { leagueId: id, userId },
        },
      });

      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this league.' });
      }

      const { contributions, total } = await walletService.getContributionHistory(id, page, limit);
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        contributions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get contribution history error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/leagues/:id/upgrade - Upgrade league plan
router.post(
  '/:id/upgrade',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: UpgradeLeagueRequest.Body },
    res: Response<UpgradeLeagueResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: 'Plan ID is required.' });
      }

      // Verify user is owner or admin
      const membership = await prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: { leagueId: id, userId },
        },
      });

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ error: 'Only league owners and admins can upgrade the plan.' });
      }

      const result = await walletService.upgradePlan(id, planId);

      if (!result.success) {
        return res.status(400).json({ error: result.error! });
      }

      const plan = await plansService.getPlanById(planId);

      if (!plan) {
        return res.status(500).json({ error: 'Plan not found after upgrade.' });
      }

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      return res.status(200).json({
        plan,
        nextPaymentDate: nextMonth,
        message: `Plan upgraded to ${plan.name} successfully!`,
      });
    } catch (error) {
      console.error('Upgrade plan error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// POST /api/leagues/:id/downgrade - Downgrade league plan
router.post(
  '/:id/downgrade',
  requireAuth,
  async (
    req: AuthenticatedRequest & { body: DowngradeLeagueRequest.Body },
    res: Response<DowngradeLeagueResponse | { error: string }>
  ) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { planId } = req.body;

      if (!planId) {
        return res.status(400).json({ error: 'Plan ID is required.' });
      }

      // Verify user is owner or admin
      const membership = await prisma.leagueMember.findUnique({
        where: {
          leagueId_userId: { leagueId: id, userId },
        },
      });

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ error: 'Only league owners and admins can downgrade the plan.' });
      }

      const result = await walletService.downgradePlan(id, planId);

      if (!result.success) {
        return res.status(400).json({ error: result.error! });
      }

      const plan = await plansService.getPlanById(planId);

      if (!plan) {
        return res.status(500).json({ error: 'Plan not found after downgrade.' });
      }

      return res.status(200).json({
        plan,
        message: `Plan downgraded to ${plan.name} successfully.`,
      });
    } catch (error) {
      console.error('Downgrade plan error:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

export default router;
