import { User } from './User';

export type BetStatus = 'pending' | 'won' | 'lost' | 'void';
export type PredictionType = 'winner'; // | 'score' | 'both_score' pour plus tard

export interface WinnerPrediction {
  type: 'winner';
  value: 'home' | 'draw' | 'away';
}

export type PredictionValue = WinnerPrediction;

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  leagueId: string;
  groupBetId: string | null;
  predictionType: PredictionType;
  predictionValue: string; // JSON string of PredictionValue
  amount: number;
  status: BetStatus;
  potentialWin: number | null;
  actualWin: number | null;
  createdAt: Date;
  settledAt: Date | null;
  user?: User;
  match?: BetMatch;
  groupBet?: GroupBetSummary;
}

export interface BetMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  startTime: Date;
  status: string;
}

export interface GroupBetSummary {
  id: string;
  status: string;
  closesAt: Date;
}
