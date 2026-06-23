import { api } from './api';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

// Match summary as returned on a bet (team names are flattened to strings).
export interface BetMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  startTime: string;
  status: string;
}

export interface Bet {
  id: string;
  matchId: string;
  leagueId: string;
  groupBetId: string | null;
  predictionType: 'winner' | 'both_score';
  predictionValue: string; // JSON string
  amount: number;
  status: BetStatus;
  potentialWin: number | null;
  actualWin: number | null;
  createdAt: string;
  settledAt: string | null;
  match?: BetMatch;
}

interface BetsApiResponse {
  bets: Bet[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const betService = {
  // The current user's bets, newest first.
  async getMyBets(status?: BetStatus): Promise<{ data: Bet[] }> {
    const { data } = await api.get<BetsApiResponse>('/bets', {
      params: status ? { status, limit: 50 } : { limit: 50 },
    });
    return { data: data.bets ?? [] };
  },
};
