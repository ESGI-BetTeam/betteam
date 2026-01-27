import { WalletDetails, ContributionWithUser } from '../interfaces/Wallet';
import { PlanSummary } from '../interfaces/Plan';

/**
 * GET /api/leagues/:id/wallet - Get wallet details
 */
export interface GetWalletResponse {
  wallet: WalletDetails;
}

/**
 * POST /api/leagues/:id/wallet/contribute - Contribute to wallet
 */
export namespace ContributeRequest {
  export interface Body {
    amount: number;
  }
}

export interface ContributeResponse {
  contribution: ContributionWithUser;
  newBalance: number;
  monthsCovered: number;
  message: string;
}

/**
 * GET /api/leagues/:id/wallet/history - Get contribution history
 */
export namespace GetWalletHistoryRequest {
  export interface Query {
    page?: number;
    limit?: number;
  }
}

export interface GetWalletHistoryResponse {
  contributions: ContributionWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * POST /api/leagues/:id/upgrade - Upgrade league plan
 */
export namespace UpgradeLeagueRequest {
  export interface Body {
    planId: string;
  }
}

export interface UpgradeLeagueResponse {
  plan: PlanSummary;
  nextPaymentDate: Date;
  message: string;
}

/**
 * POST /api/leagues/:id/downgrade - Downgrade league plan
 */
export namespace DowngradeLeagueRequest {
  export interface Body {
    planId: string;
  }
}

export interface DowngradeLeagueResponse {
  plan: PlanSummary;
  message: string;
}
