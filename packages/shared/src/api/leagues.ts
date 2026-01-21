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
