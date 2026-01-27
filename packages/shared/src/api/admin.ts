import { UserRole } from '../interfaces/User';

// ========================================
// Dashboard
// ========================================

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    admins: number;
    newThisWeek: number;
  };
  leagues: {
    total: number;
    active: number;
    frozen: number;
  };
  bets: {
    total: number;
    pending: number;
    totalPointsWagered: number;
  };
  sync: {
    lastCompetitionsSync: Date | null;
    lastTeamsSync: Date | null;
    lastMatchesSync: Date | null;
    lastOddsSync: Date | null;
  };
}

export interface AdminDashboardResponse {
  data: AdminDashboardStats;
}

// ========================================
// Users Management
// ========================================

export interface AdminUserWithStats {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalBets: number;
    leaguesOwned: number;
    leaguesMember: number;
  };
}

export namespace AdminGetUsersRequest {
  export interface Query {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
  }
}

export interface AdminGetUsersResponse {
  data: AdminUserWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export namespace AdminUpdateUserRequest {
  export interface Body {
    role?: UserRole;
    isActive?: boolean;
  }
}

export interface AdminUpdateUserResponse {
  data: AdminUserWithStats;
  message: string;
}

export interface AdminDeleteUserResponse {
  message: string;
}

// ========================================
// Leagues Management
// ========================================

export interface AdminLeagueWithStats {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isActive: boolean;
  inviteCode: string;
  planId: string;
  createdAt: Date;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  stats: {
    totalMembers: number;
    totalBets: number;
    totalChallenges: number;
  };
  wallet: {
    balance: number;
    isFrozen: boolean;
  } | null;
}

export namespace AdminGetLeaguesRequest {
  export interface Query {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isFrozen?: boolean;
  }
}

export interface AdminGetLeaguesResponse {
  data: AdminLeagueWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========================================
// Bets Statistics
// ========================================

export interface AdminBetsStats {
  totalBets: number;
  betsByStatus: {
    pending: number;
    won: number;
    lost: number;
    void: number;
  };
  totalPointsWagered: number;
  totalPointsWon: number;
  averageBetAmount: number;
  topBettors: {
    userId: string;
    username: string;
    totalBets: number;
    winRate: number;
  }[];
}

export interface AdminBetsStatsResponse {
  data: AdminBetsStats;
}

// ========================================
// Sync Force
// ========================================

export type SyncType = 'competitions' | 'teams' | 'matches' | 'odds' | 'all';

export namespace AdminSyncForceRequest {
  export interface Body {
    type: SyncType;
  }
}

export interface SyncResult {
  success: boolean;
  message: string;
  itemsSynced?: number;
}

export interface AdminSyncForceResponse {
  message: string;
  results: Record<string, SyncResult>;
}
