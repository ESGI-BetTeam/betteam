import { User } from "@/services/auth.service";

export interface UserStats {
  userId: string;
  username: string;
  totalBets: number;
  betsByStatus: BetsByStatus;
  winRate: number;
  totalPointsWagered: number;
  totalPointsWon: number;
  totalPointsLost: number;
  netPoints: number;
  averageBetAmount: number;
  currentStreak: Streak;
  bestWinStreak: number;
  worstLossStreak: number;
  leaguesCount: number;
  favoriteSport: string;
  recentBets: Bet[];
}

export interface BetsByStatus {
	pending: number;
	won: number;
	lost: number;
	void: number;
}

export interface Streak {
	type: 'win' | 'loss';
	count: number;
}

export interface Bet {
	id: string;
	matchId: string;
	homeTeam: string;
	awayTeam: string;
	predictionType: string;
	predictionValue: string;
	amount: number;
	status: 'pending' | 'won' | 'lost' | 'void';
	potentialWin: number;
	actualWin: number;
	createdAt: string;
	settledAt: string;
}

export interface UserWithStats {
  user: User;
  stats: UserStats;
}