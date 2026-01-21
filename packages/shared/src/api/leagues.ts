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

// ============================================
// LEAGUE LEADERBOARD & STATS ENDPOINTS
// ============================================

// Leaderboard entry with user stats
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  points: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  joinedAt: Date;
}

// GET /api/leagues/:id/leaderboard - Get league leaderboard
export namespace GetLeaderboardRequest {
  export interface Query {
    limit?: number;
  }
}

export interface GetLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalMembers: number;
}

// League statistics
export interface LeagueStats {
  totalMembers: number;
  totalBets: number;
  totalBetsWon: number;
  totalBetsLost: number;
  totalBetsPending: number;
  averageWinRate: number;
  totalPointsWagered: number;
  totalPointsWon: number;
  mostActiveUser: {
    userId: string;
    username: string;
    avatar: string | null;
    totalBets: number;
  } | null;
  bestPerformer: {
    userId: string;
    username: string;
    avatar: string | null;
    winRate: number;
    wonBets: number;
  } | null;
  createdAt: Date;
  lastActivityAt: Date | null;
}

// GET /api/leagues/:id/stats - Get league statistics
export interface GetLeagueStatsResponse {
  stats: LeagueStats;
}

// Bet history entry
export interface BetHistoryEntry {
  id: string;
  oddsUser: {
    oddsUserId: string;
    username: string;
    avatar: string | null;
  };
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    startTime: Date;
    status: string;
  };
  predictionType: string;
  predictionValue: string;
  amount: number;
  status: string;
  potentialWin: number | null;
  actualWin: number | null;
  createdAt: Date;
  settledAt: Date | null;
}

// GET /api/leagues/:id/history - Get league bet history
export namespace GetLeagueHistoryRequest {
  export interface Query {
    page?: number;
    limit?: number;
    status?: 'pending' | 'won' | 'lost' | 'void';
    userId?: string;
  }
}

export interface GetLeagueHistoryResponse {
  bets: BetHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
