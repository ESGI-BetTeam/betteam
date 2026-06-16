import { api } from './api';
import { User } from './auth.service';

export interface League {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
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

interface LeaguesApiResponse {
  leagues: League[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LeagueResponse {
  league: League;
}

// The API returns `{ leaderboard, totalMembers }`.
interface LeaderboardApiResponse {
  leaderboard: LeaderboardEntry[];
  totalMembers: number;
}

export interface CreateLeagueInput {
  name: string;
  description?: string;
  logoUrl?: string;
  isPrivate?: boolean;
}

export const leagueService = {
  // The API returns `{ leagues }`; we normalize to `{ data }` for callers.
  async getMyLeagues(): Promise<{ data: League[] }> {
    const { data } = await api.get<LeaguesApiResponse>('/leagues');
    return { data: data.leagues ?? [] };
  },

  async createLeague(input: CreateLeagueInput): Promise<League> {
    const { data } = await api.post<{ league: League; message: string }>('/leagues', input);
    return data.league;
  },

  // Uploads a league logo (multipart). `file` comes from the image picker.
  async uploadLogo(
    leagueId: string,
    file: { uri: string; name: string; type: string },
  ): Promise<League> {
    const form = new FormData();
    // React Native FormData accepts a { uri, name, type } file descriptor
    form.append('logo', { uri: file.uri, name: file.name, type: file.type } as never);
    const { data } = await api.post<{ league: League; message: string }>(
      `/leagues/${leagueId}/logo`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.league;
  },

  // Assigns the league's active competition (API supports a single one).
  async setCompetition(leagueId: string, competitionId: string): Promise<void> {
    await api.patch(`/leagues/${leagueId}/competition`, { competitionId });
  },

  async getLeague(id: string): Promise<LeagueResponse> {
    const { data } = await api.get<LeagueResponse>(`/leagues/${id}`);
    return data;
  },

  async getLeaderboard(
    leagueId: string,
  ): Promise<{ data: LeaderboardEntry[]; totalMembers: number }> {
    const { data } = await api.get<LeaderboardApiResponse>(`/leagues/${leagueId}/leaderboard`);
    return { data: data.leaderboard ?? [], totalMembers: data.totalMembers ?? 0 };
  },

  async getMembers(leagueId: string): Promise<{ data: LeagueMember[] }> {
    const { data } = await api.get(`/leagues/${leagueId}/members`);
    return data;
  },

  // Joins a league using only its invite code (resolved server-side).
  async joinByCode(inviteCode: string): Promise<League> {
    const { data } = await api.post<{ league: League; message: string }>('/leagues/join', {
      inviteCode: inviteCode.trim().toUpperCase(),
    });
    return data.league;
  },
};
