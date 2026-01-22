import { User } from './User';
import { Bet } from './Bet';

export type GroupBetStatus = 'open' | 'closed' | 'settled';

export interface GroupBet {
  id: string;
  leagueId: string;
  matchId: string;
  createdById: string;
  status: GroupBetStatus;
  closesAt: Date;
  createdAt: Date;
  settledAt: Date | null;
  createdBy?: User;
  match?: GroupBetMatch;
  bets?: Bet[];
  _count?: {
    bets: number;
  };
}

export interface GroupBetMatch {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  startTime: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  competition: {
    id: string;
    name: string;
    sport: string;
  };
}

export interface GroupBetWithParticipation extends GroupBet {
  userBet: Bet | null;
  totalParticipants: number;
}
