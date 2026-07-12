import { api } from './api';

export interface Competition {
  id: string;
  name: string;
  sport: string;
  logoUrl: string | null;
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface League {
  id: string;
  name: string;
  logoUrl: string | null;
  _count: { members: number };
}

export interface DemoMatch {
  id: string;
  externalId: string;
  homeTeam: Team;
  awayTeam: Team;
  competition: Competition;
  startTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  expectedScore: { homeScore: number; awayScore: number };
  groupBets: Array<{ id: string; status: string; _count: { bets: number } }>;
}

export interface CreateDemoMatchInput {
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime?: string;
  expectedHomeScore: number;
  expectedAwayScore: number;
  leagueId?: string;
}

export interface SettlementResult {
  matchesSettled: number;
  betsSettled: number;
  pointsCredited: number;
}

export const adminService = {
  async getLeagues(): Promise<League[]> {
    const { data } = await api.get<{ data: League[] }>('/admin/demo/leagues');
    return data.data;
  },

  async getCompetitions(): Promise<Competition[]> {
    const { data } = await api.get<{ data: Competition[] }>('/admin/demo/competitions');
    return data.data;
  },

  async getTeams(search?: string): Promise<Team[]> {
    const { data } = await api.get<{ data: Team[] }>('/admin/demo/teams', {
      params: search ? { search } : undefined,
    });
    return data.data;
  },

  async getDemoMatches(): Promise<DemoMatch[]> {
    const { data } = await api.get<{ data: DemoMatch[] }>('/admin/demo/matches');
    return data.data;
  },

  async createDemoMatch(input: CreateDemoMatchInput): Promise<DemoMatch> {
    const { data } = await api.post<{ data: DemoMatch }>('/admin/demo/matches', input);
    return data.data;
  },

  async finishMatch(
    matchId: string,
    scores?: { homeScore: number; awayScore: number },
  ): Promise<DemoMatch> {
    const { data } = await api.post<{ data: DemoMatch }>(
      `/admin/demo/matches/${matchId}/finish`,
      scores ?? {},
    );
    return data.data;
  },

  async settleAll(): Promise<SettlementResult> {
    const { data } = await api.post<{ data: SettlementResult }>('/admin/demo/settle');
    return data.data;
  },
};
