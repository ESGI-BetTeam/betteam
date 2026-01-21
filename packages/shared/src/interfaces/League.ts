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

export interface League {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  ownerId: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  members?: LeagueMember[];
  _count?: {
    members: number;
  };
}
