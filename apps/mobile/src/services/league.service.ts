import { api } from './api';
import { User } from './auth.service';

export interface League {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  inviteCode: string;
  isActive: boolean;
  currentCompetitionId: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  currentCompetition?: Competition;
  members?: LeagueMember[];
  _count?: { members: number; groupBets?: number };
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

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  points: number;
  joinedAt: string;
  user?: User;
}

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
  joinedAt: string;
}

interface LeaguesResponse {
  data: League[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LeagueResponse {
  data: League;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
}

export const leagueService = {
  async getMyLeagues(): Promise<LeaguesResponse> {
    const { data } = await api.get<LeaguesResponse>('/leagues');
    return data;
  },

  async getLeague(id: string): Promise<LeagueResponse> {
    const { data } = await api.get<LeagueResponse>(`/leagues/${id}`);
    return data;
  },

  async getLeaderboard(leagueId: string): Promise<LeaderboardResponse> {
    const { data } = await api.get<LeaderboardResponse>(`/leagues/${leagueId}/leaderboard`);
    return data;
  },

  async getMembers(leagueId: string): Promise<{ data: LeagueMember[] }> {
    const { data } = await api.get(`/leagues/${leagueId}/members`);
    return data;
  },
};
