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
  logoUrl: string | null;
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
  // Points balance of the requesting user in this league (null if not a member).
  // Populated on the "my leagues" listing so callers avoid a per-league fetch.
  myPoints?: number | null;
  // Whether the requesting user has already topped up their points here.
  myHasRecharged?: boolean;
  _count?: {
    members: number;
    groupBets?: number;
  };
}
