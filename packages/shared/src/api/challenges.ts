import { GroupBet, GroupBetStatus, GroupBetWithParticipation } from '../interfaces/Challenge';

// ============================================
// POST /api/leagues/:leagueId/challenges - Create a challenge
// ============================================

export namespace CreateChallengeRequest {
  export interface Body {
    matchId: string;
  }
}

export interface CreateChallengeResponse {
  challenge: GroupBet;
  message: string;
}

// ============================================
// GET /api/leagues/:leagueId/challenges - List challenges
// ============================================

export namespace GetChallengesRequest {
  export interface Query {
    page?: number;
    limit?: number;
    status?: GroupBetStatus;
  }
}

export interface GetChallengesResponse {
  challenges: GroupBetWithParticipation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// GET /api/leagues/:leagueId/challenges/active - Get active challenges
// ============================================

export interface GetActiveChallengesResponse {
  challenges: GroupBetWithParticipation[];
  total: number;
}

// ============================================
// GET /api/leagues/:leagueId/challenges/:id - Get challenge details
// ============================================

export interface GetChallengeResponse {
  challenge: GroupBetWithParticipation;
}

// ============================================
// League Competition Management
// ============================================

// GET /api/leagues/:leagueId/competition
export interface GetLeagueCompetitionResponse {
  competition: {
    id: string;
    name: string;
    sport: string;
    country: string | null;
    logoUrl: string | null;
  } | null;
  changedAt: Date | null;
  canChangeIn: number | null; // Nombre de jours avant de pouvoir changer (null si illimité)
}

// PATCH /api/leagues/:leagueId/competition
export namespace UpdateLeagueCompetitionRequest {
  export interface Body {
    competitionId: string;
  }
}

export interface UpdateLeagueCompetitionResponse {
  competition: {
    id: string;
    name: string;
    sport: string;
    country: string | null;
    logoUrl: string | null;
  };
  changedAt: Date;
  message: string;
}

// ============================================
// Available matches for challenges
// ============================================

// GET /api/leagues/:leagueId/available-matches
export namespace GetAvailableMatchesRequest {
  export interface Query {
    page?: number;
    limit?: number;
  }
}

export interface AvailableMatch {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  startTime: Date;
  status: string;
  round: string | null;
  hasChallenge: boolean; // True si un challenge existe déjà pour ce match
}

export interface GetAvailableMatchesResponse {
  matches: AvailableMatch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
