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

interface ChallengesResponse {
  data: GroupBet[];
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

  async getActiveChallenges(leagueId: string): Promise<ChallengesResponse> {
    const { data } = await api.get<ChallengesResponse>(`/leagues/${leagueId}/challenges/active`);
    return data;
  },
};
