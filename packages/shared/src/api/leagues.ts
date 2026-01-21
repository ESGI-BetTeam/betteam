import { League, LeagueMember } from '../interfaces/League';

// POST /api/leagues - Create a league
export namespace CreateLeagueRequest {
  export interface Body {
    name: string;
    description?: string;
    isPrivate?: boolean;
  }
}

export interface CreateLeagueResponse {
  league: League;
  message: string;
}

// GET /api/leagues - List user's leagues
export namespace GetLeaguesRequest {
  export interface Query {
    page?: number;
    limit?: number;
    search?: string;
  }
}

export interface GetLeaguesResponse {
  leagues: League[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/leagues/:id - Get league details
export interface GetLeagueResponse {
  league: League;
}

// PATCH /api/leagues/:id - Update league
export namespace UpdateLeagueRequest {
  export interface Body {
    name?: string;
    description?: string;
    isPrivate?: boolean;
  }
}

export interface UpdateLeagueResponse {
  league: League;
  message: string;
}

// DELETE /api/leagues/:id - Delete league
export interface DeleteLeagueResponse {
  message: string;
}

// POST /api/leagues/:id/regenerate-code - Regenerate invite code
export interface RegenerateInviteCodeResponse {
  inviteCode: string;
  message: string;
}

// ============================================
// LEAGUE MEMBERS ENDPOINTS
// ============================================

// POST /api/leagues/:id/join - Join a league via invite code
export namespace JoinLeagueRequest {
  export interface Body {
    inviteCode: string;
  }
}

export interface JoinLeagueResponse {
  member: LeagueMember;
  message: string;
}

// POST /api/leagues/:id/leave - Leave a league
export interface LeaveLeagueResponse {
  message: string;
}

// GET /api/leagues/:id/members - List league members
export namespace GetLeagueMembersRequest {
  export interface Query {
    page?: number;
    limit?: number;
    sortBy?: 'points' | 'joinedAt' | 'username';
    sortOrder?: 'asc' | 'desc';
  }
}

export interface GetLeagueMembersResponse {
  members: LeagueMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// PATCH /api/leagues/:id/members/:userId - Update member role
export namespace UpdateMemberRoleRequest {
  export interface Body {
    role: 'admin' | 'member';
  }
}

export interface UpdateMemberRoleResponse {
  member: LeagueMember;
  message: string;
}

// DELETE /api/leagues/:id/members/:userId - Kick member from league
export interface KickMemberResponse {
  message: string;
}
