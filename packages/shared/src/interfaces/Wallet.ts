/**
 * League wallet interface
 */
export interface LeagueWallet {
  id: string;
  leagueId: string;
  balance: number;
  nextPaymentDate: Date | null;
  isFrozen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contribution interface
 */
export interface Contribution {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  paymentMethod: 'mock' | 'stripe';
  paymentId: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

/**
 * Contribution with user details
 */
export interface ContributionWithUser extends Contribution {
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

/**
 * Wallet details for API response
 */
export interface WalletDetails {
  id: string;
  balance: number;
  monthsCovered: number;
  nextPaymentDate: Date | null;
  isFrozen: boolean;
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
  };
  recentContributions: ContributionWithUser[];
}

/**
 * Monthly payment processing result
 */
export interface PaymentResult {
  success: boolean;
  amountDeducted: number;
  newBalance: number;
  nextPaymentDate: Date | null;
  error?: string;
}
