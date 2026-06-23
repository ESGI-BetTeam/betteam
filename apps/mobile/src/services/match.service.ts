import { api } from './api';

export interface Team {
  id: string;
  externalId: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  country: string | null;
}

export interface MatchOdds {
  id: string;
  matchId: string;
  homeWinOdds: number | null;
  drawOdds: number | null;
  awayWinOdds: number | null;
  bookmakerCount: number;
  syncedAt: string;
}

export interface Competition {
  id: string;
  externalId: string;
  name: string;
  sport: string;
  country: string | null;
  logoUrl: string | null;
  isActive: boolean;
  syncedAt: string;
}

export interface Match {
  id: string;
  externalId: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  round: string | null;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  odds?: MatchOdds;
  createdAt: string;
  updatedAt: string;
}

export interface GroupBet {
  id: string;
  leagueId: string;
  matchId: string;
  createdById: string;
  status: 'open' | 'closed' | 'settled';
  closesAt: string;
  createdAt: string;
  match?: Match;
  _count?: { bets: number };
}

interface MatchesResponse {
  matches: Match[];
  count: number;
}

// The API returns `{ challenges, total }`; we normalize to `{ data }` for callers.
interface ActiveChallengesApiResponse {
  challenges: GroupBet[];
  total: number;
}

// Winner pick. Exact-score prediction isn't supported by the API yet.
export type WinnerValue = 'home' | 'draw' | 'away';

export type PredictionType = 'winner' | 'both_score';

export interface PlaceBetInput {
  predictionType: PredictionType;
  predictionValue: string; // JSON string, e.g. '{"type":"winner","value":"home"}'
  amount: number;
}

interface PlaceBetResponse {
  bet: { id: string };
  message: string;
}

export const matchService = {
  async getUpcoming(): Promise<MatchesResponse> {
    const { data } = await api.get<MatchesResponse>('/matches/upcoming');
    return data;
  },

  async getToday(): Promise<MatchesResponse> {
    const { data } = await api.get<MatchesResponse>('/matches/today');
    return data;
  },

  async getActiveChallenges(leagueId: string): Promise<{ data: GroupBet[] }> {
    const { data } = await api.get<ActiveChallengesApiResponse>(
      `/leagues/${leagueId}/challenges/active`,
    );
    return { data: data.challenges ?? [] };
  },

  // Serializes a winner pick into the API's expected prediction payload.
  buildWinnerPrediction(value: WinnerValue): Pick<PlaceBetInput, 'predictionType' | 'predictionValue'> {
    return {
      predictionType: 'winner',
      predictionValue: JSON.stringify({ type: 'winner', value }),
    };
  },

  // Winner pick + exact score (bonus). The API requires the winner to match the
  // score, so callers should only use this when home/away imply `value`.
  buildScorePrediction(
    value: WinnerValue,
    homeScore: number,
    awayScore: number,
  ): Pick<PlaceBetInput, 'predictionType' | 'predictionValue'> {
    return {
      predictionType: 'both_score',
      predictionValue: JSON.stringify({ type: 'both_score', value, homeScore, awayScore }),
    };
  },

  async placeBet(
    leagueId: string,
    challengeId: string,
    input: PlaceBetInput,
  ): Promise<PlaceBetResponse> {
    const { data } = await api.post<PlaceBetResponse>(
      `/leagues/${leagueId}/challenges/${challengeId}/bets`,
      input,
    );
    return data;
  },
};
