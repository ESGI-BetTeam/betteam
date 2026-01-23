import { User } from './User';

export type LeagueMemberRole = 'owner' | 'admin' | 'member';

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  role: LeagueMemberRole;
  points: number;
  joinedAt: Date;
  user?: User;
}

export interface LeagueCompetition {
  id: string;
  name: string;
  sport: string;
  country: string | null;
  logoUrl: string | null;
}

export interface League {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  inviteCode: string;
  isActive: boolean;
  currentCompetitionId: string | null;
  competitionChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  currentCompetition?: LeagueCompetition | null;
  members?: LeagueMember[];
  _count?: {
    members: number;
    groupBets?: number;
  };
}
