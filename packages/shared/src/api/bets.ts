import { Bet, BetStatus, PredictionType } from '../interfaces/Bet';

// ============================================
// GET /api/bets - List user's bets
// ============================================

export namespace GetBetsRequest {
  export interface Query {
    page?: number;
    limit?: number;
    status?: BetStatus;
    leagueId?: string;
  }
}

export interface GetBetsResponse {
  bets: Bet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// GET /api/bets/:id - Get bet details
// ============================================

export interface GetBetResponse {
  bet: Bet;
}

// ============================================
// GET /api/bets/history - Get bet history
// ============================================

export namespace GetBetHistoryRequest {
  export interface Query {
    page?: number;
    limit?: number;
    status?: BetStatus;
    leagueId?: string;
    startDate?: string;
    endDate?: string;
  }
}

export interface GetBetHistoryResponse {
  bets: Bet[];
  stats: {
    totalBets: number;
    wonBets: number;
    lostBets: number;
    pendingBets: number;
    winRate: number;
    totalPointsWagered: number;
    totalPointsWon: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// POST /api/leagues/:leagueId/challenges/:challengeId/bets - Place a bet
// ============================================

export namespace PlaceBetRequest {
  export interface Body {
    predictionType: PredictionType;
    predictionValue: string; // JSON string
    amount: number;
  }
}

export interface PlaceBetResponse {
  bet: Bet;
  message: string;
}

// ============================================
// GET /api/leagues/:leagueId/challenges/:challengeId/bets - Get challenge bets
// ============================================

export namespace GetChallengeBetsRequest {
  export interface Query {
    page?: number;
    limit?: number;
  }
}

export interface ChallengeBetEntry {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  predictionType: PredictionType;
  predictionValue: string;
  amount: number;
  status: BetStatus;
  potentialWin: number | null;
  actualWin: number | null;
  createdAt: Date;
}

export interface GetChallengeBetsResponse {
  bets: ChallengeBetEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Weekly bet limit check
// ============================================

export interface WeeklyBetLimitResponse {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  resetsAt: Date;
}
