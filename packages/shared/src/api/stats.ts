// ========================================
// Global Statistics
// ========================================

export interface GlobalStats {
  totalBets: number;
  totalUsers: number;
  totalLeagues: number;
  totalMatches: number;
  betsByStatus: {
    pending: number;
    won: number;
    lost: number;
    void: number;
  };
  totalPointsWagered: number;
  totalPointsWon: number;
  averageBetAmount: number;
  globalWinRate: number;
  topBettors: TopBettor[];
}

export interface GlobalStatsResponse {
  data: GlobalStats;
}

// ========================================
// User Statistics
// ========================================

export interface UserStats {
  userId: string;
  username: string;
  totalBets: number;
  betsByStatus: {
    pending: number;
    won: number;
    lost: number;
    void: number;
  };
  winRate: number;
  totalPointsWagered: number;
  totalPointsWon: number;
  totalPointsLost: number;
  netPoints: number;
  averageBetAmount: number;
  currentStreak: {
    type: 'win' | 'loss' | 'none';
    count: number;
  };
  bestWinStreak: number;
  worstLossStreak: number;
  leaguesCount: number;
  favoriteSport: string | null;
  recentBets: RecentBet[];
}

export interface RecentBet {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictionType: string;
  predictionValue: string;
  amount: number;
  status: string;
  potentialWin: number | null;
  actualWin: number | null;
  createdAt: Date;
  settledAt: Date | null;
}

export interface UserStatsResponse {
  data: UserStats;
}

// ========================================
// League Statistics
// ========================================

export interface LeagueStats {
  leagueId: string;
  leagueName: string;
  totalMembers: number;
  totalBets: number;
  totalChallenges: number;
  betsByStatus: {
    pending: number;
    won: number;
    lost: number;
    void: number;
  };
  totalPointsWagered: number;
  totalPointsWon: number;
  averageBetAmount: number;
  leagueWinRate: number;
  topMembers: LeagueMemberStats[];
  recentActivity: LeagueActivity[];
}

export interface LeagueMemberStats {
  userId: string;
  username: string;
  points: number;
  totalBets: number;
  winRate: number;
  totalPointsWagered: number;
  totalPointsWon: number;
  currentStreak: {
    type: 'win' | 'loss' | 'none';
    count: number;
  };
}

export interface LeagueActivity {
  type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'challenge_created';
  userId: string;
  username: string;
  description: string;
  createdAt: Date;
}

export interface LeagueStatsResponse {
  data: LeagueStats;
}

// ========================================
// Shared
// ========================================

export interface TopBettor {
  userId: string;
  username: string;
  totalBets: number;
  winRate: number;
  totalPointsWon: number;
  netPoints: number;
}
