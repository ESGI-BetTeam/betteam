import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { WalletDetails, ContributionWithUser, PaymentResult } from '@betteam/shared/interfaces/Wallet';

class WalletService {
  /**
   * Create a wallet for a league
   */
  async createWallet(leagueId: string): Promise<void> {
    await prisma.leagueWallet.create({
      data: {
        leagueId,
        balance: 0,
      },
    });
  }

  /**
   * Get or create wallet for a league
   */
  async getOrCreateWallet(leagueId: string): Promise<string> {
    let wallet = await prisma.leagueWallet.findUnique({
      where: { leagueId },
    });

    if (!wallet) {
      wallet = await prisma.leagueWallet.create({
        data: {
          leagueId,
          balance: 0,
        },
      });
    }

    return wallet.id;
  }

  /**
   * Get wallet details for a league
   */
  async getWallet(leagueId: string): Promise<WalletDetails | null> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        plan: true,
        wallet: {
          include: {
            contributions: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!league) {
      return null;
    }

    // Create wallet if it doesn't exist
    let wallet = league.wallet;
    if (!wallet) {
      await this.createWallet(leagueId);
      wallet = await prisma.leagueWallet.findUnique({
        where: { leagueId },
        include: {
          contributions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    }

    if (!wallet) {
      return null;
    }

    const monthsCovered = this.calculateMonthsCovered(wallet.balance, league.plan.monthlyPrice);

    return {
      id: wallet.id,
      balance: wallet.balance,
      monthsCovered,
      nextPaymentDate: wallet.nextPaymentDate,
      isFrozen: wallet.isFrozen,
      plan: {
        id: league.plan.id,
        name: league.plan.name,
        monthlyPrice: league.plan.monthlyPrice,
      },
      recentContributions: wallet.contributions.map((c) => ({
        id: c.id,
        walletId: c.walletId,
        userId: c.userId,
        amount: c.amount,
        paymentMethod: c.paymentMethod as 'mock' | 'stripe',
        paymentId: c.paymentId,
        status: c.status as 'pending' | 'completed' | 'failed',
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          username: c.user.username,
          avatar: c.user.avatar,
        },
      })),
    };
  }

  /**
   * Contribute to a league wallet (mock payment)
   * TODO: Integrate Stripe for real payments
   */
  async contribute(
    leagueId: string,
    userId: string,
    amount: number
  ): Promise<{ contribution: ContributionWithUser; newBalance: number; monthsCovered: number }> {
    if (amount <= 0) {
      throw new Error('Le montant doit être supérieur à 0.');
    }

    const walletId = await this.getOrCreateWallet(leagueId);

    // Mock payment - always succeeds
    // TODO: Replace with Stripe integration
    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create contribution
      const contribution = await tx.contribution.create({
        data: {
          walletId,
          userId,
          amount,
          paymentMethod: 'mock',
          paymentId,
          status: 'completed',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      // Update wallet balance
      const wallet = await tx.leagueWallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amount },
          isFrozen: false, // Unfreeze if frozen
        },
        include: {
          league: {
            include: { plan: true },
          },
        },
      });

      // If wallet was frozen and now has enough balance, set next payment date
      if (wallet.isFrozen === false && !wallet.nextPaymentDate && wallet.balance >= wallet.league.plan.monthlyPrice) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);

        await tx.leagueWallet.update({
          where: { id: walletId },
          data: { nextPaymentDate: nextMonth },
        });
      }

      const monthsCovered = this.calculateMonthsCovered(wallet.balance, wallet.league.plan.monthlyPrice);

      return {
        contribution: {
          id: contribution.id,
          walletId: contribution.walletId,
          userId: contribution.userId,
          amount: contribution.amount,
          paymentMethod: contribution.paymentMethod as 'mock' | 'stripe',
          paymentId: contribution.paymentId,
          status: contribution.status as 'pending' | 'completed' | 'failed',
          createdAt: contribution.createdAt,
          user: contribution.user,
        },
        newBalance: wallet.balance,
        monthsCovered,
      };
    });

    return result;
  }

  /**
   * Get contribution history for a wallet
   */
  async getContributionHistory(
    leagueId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ contributions: ContributionWithUser[]; total: number }> {
    const wallet = await prisma.leagueWallet.findUnique({
      where: { leagueId },
    });

    if (!wallet) {
      return { contributions: [], total: 0 };
    }

    const skip = (page - 1) * limit;

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.contribution.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      contributions: contributions.map((c) => ({
        id: c.id,
        walletId: c.walletId,
        userId: c.userId,
        amount: c.amount,
        paymentMethod: c.paymentMethod as 'mock' | 'stripe',
        paymentId: c.paymentId,
        status: c.status as 'pending' | 'completed' | 'failed',
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          username: c.user.username,
          avatar: c.user.avatar,
        },
      })),
      total,
    };
  }

  /**
   * Calculate months covered by current balance
   */
  calculateMonthsCovered(balance: number, monthlyPrice: number): number {
    if (monthlyPrice <= 0) {
      return -1; // Free plan, unlimited
    }
    return Math.floor(balance / monthlyPrice);
  }

  /**
   * Upgrade a league to a higher plan
   */
  async upgradePlan(leagueId: string, newPlanId: string): Promise<{ success: boolean; error?: string }> {
    // Parallelize independent queries
    const [league, newPlan] = await Promise.all([
      prisma.league.findUnique({
        where: { id: leagueId },
        include: { plan: true, wallet: true, _count: { select: { members: true } } },
      }),
      prisma.plan.findUnique({ where: { id: newPlanId } }),
    ]);

    if (!league) {
      return { success: false, error: 'Ligue non trouvée.' };
    }

    if (!newPlan) {
      return { success: false, error: 'Plan non trouvé.' };
    }

    // Check if this is actually an upgrade
    if (newPlan.monthlyPrice <= league.plan.monthlyPrice) {
      return { success: false, error: 'Ce plan n\'est pas un upgrade. Utilisez downgrade à la place.' };
    }

    // Check if member count is within new plan limits
    if (league._count.members > newPlan.maxMembers) {
      return { success: false, error: `Ce plan autorise maximum ${newPlan.maxMembers} membres. Votre ligue en a ${league._count.members}.` };
    }

    // For paid plans, check wallet balance
    if (newPlan.monthlyPrice > 0) {
      const walletId = await this.getOrCreateWallet(leagueId);
      const wallet = await prisma.leagueWallet.findUnique({ where: { id: walletId } });

      if (!wallet || wallet.balance < newPlan.monthlyPrice) {
        return {
          success: false,
          error: `Solde insuffisant. Il faut au moins ${newPlan.monthlyPrice}€ dans la cagnotte pour activer ce plan.`,
        };
      }
    }

    // Update plan and set next payment date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.league.update({
        where: { id: leagueId },
        data: { planId: newPlanId },
      });

      if (newPlan.monthlyPrice > 0) {
        await tx.leagueWallet.update({
          where: { leagueId },
          data: {
            nextPaymentDate: nextMonth,
            isFrozen: false,
          },
        });
      }
    });

    return { success: true };
  }

  /**
   * Downgrade a league to a lower plan
   */
  async downgradePlan(leagueId: string, newPlanId: string): Promise<{ success: boolean; error?: string }> {
    // Parallelize independent queries
    const [league, newPlan] = await Promise.all([
      prisma.league.findUnique({
        where: { id: leagueId },
        include: { plan: true, _count: { select: { members: true } } },
      }),
      prisma.plan.findUnique({ where: { id: newPlanId } }),
    ]);

    if (!league) {
      return { success: false, error: 'Ligue non trouvée.' };
    }

    if (!newPlan) {
      return { success: false, error: 'Plan non trouvé.' };
    }

    // Check if this is actually a downgrade
    if (newPlan.monthlyPrice >= league.plan.monthlyPrice) {
      return { success: false, error: 'Ce plan n\'est pas un downgrade. Utilisez upgrade à la place.' };
    }

    // Check if member count is within new plan limits
    if (league._count.members > newPlan.maxMembers) {
      return {
        success: false,
        error: `Ce plan autorise maximum ${newPlan.maxMembers} membres. Votre ligue en a ${league._count.members}. Réduisez le nombre de membres avant de downgrader.`,
      };
    }

    // Update plan
    await prisma.league.update({
      where: { id: leagueId },
      data: { planId: newPlanId },
    });

    // Clear next payment date if going to free plan
    if (newPlan.monthlyPrice === 0) {
      await prisma.leagueWallet.update({
        where: { leagueId },
        data: { nextPaymentDate: null },
      });
    }

    return { success: true };
  }

  /**
   * Process monthly payment for a league (called by CRON)
   */
  async processMonthlyPayment(leagueId: string): Promise<PaymentResult> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { plan: true, wallet: true, _count: { select: { members: true } } },
    });

    if (!league || !league.wallet) {
      return { success: false, amountDeducted: 0, newBalance: 0, nextPaymentDate: null, error: 'Ligue ou cagnotte non trouvée.' };
    }

    const plan = league.plan;
    const wallet = league.wallet;

    // Free plan doesn't need payment
    if (plan.monthlyPrice === 0) {
      return { success: true, amountDeducted: 0, newBalance: wallet.balance, nextPaymentDate: null };
    }

    // Check if balance is sufficient
    if (wallet.balance < plan.monthlyPrice) {
      // Insufficient balance - check if can downgrade to free
      const memberCount = league._count.members;

      if (memberCount <= 4) {
        // Auto-downgrade to Free plan
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.league.update({
            where: { id: leagueId },
            data: { planId: 'free' },
          });

          await tx.leagueWallet.update({
            where: { id: wallet.id },
            data: { nextPaymentDate: null, isFrozen: false },
          });
        });

        console.log(`⚠️ [WALLET] League ${leagueId} auto-downgraded to Free (insufficient balance, ${memberCount} members)`);
        return {
          success: false,
          amountDeducted: 0,
          newBalance: wallet.balance,
          nextPaymentDate: null,
          error: 'Solde insuffisant. Ligue rétrogradée au plan Free.',
        };
      } else {
        // Freeze the league
        await prisma.leagueWallet.update({
          where: { id: wallet.id },
          data: { isFrozen: true },
        });

        console.log(`🧊 [WALLET] League ${leagueId} frozen (insufficient balance, ${memberCount} members)`);
        return {
          success: false,
          amountDeducted: 0,
          newBalance: wallet.balance,
          nextPaymentDate: wallet.nextPaymentDate,
          error: 'Solde insuffisant. Ligue gelée. Ajoutez des fonds pour la débloquer.',
        };
      }
    }

    // Deduct monthly fee
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    const updatedWallet = await prisma.leagueWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: plan.monthlyPrice },
        nextPaymentDate: nextMonth,
      },
    });

    console.log(`✅ [WALLET] League ${leagueId} payment processed: -${plan.monthlyPrice}€, new balance: ${updatedWallet.balance}€`);

    return {
      success: true,
      amountDeducted: plan.monthlyPrice,
      newBalance: updatedWallet.balance,
      nextPaymentDate: nextMonth,
    };
  }

  /**
   * Freeze a league (e.g., due to insufficient funds)
   */
  async freezeLeague(leagueId: string): Promise<void> {
    await prisma.leagueWallet.update({
      where: { leagueId },
      data: { isFrozen: true },
    });
  }

  /**
   * Unfreeze a league
   */
  async unfreezeLeague(leagueId: string): Promise<void> {
    await prisma.leagueWallet.update({
      where: { leagueId },
      data: { isFrozen: false },
    });
  }

  /**
   * Check if a league is frozen
   */
  async isLeagueFrozen(leagueId: string): Promise<boolean> {
    const wallet = await prisma.leagueWallet.findUnique({
      where: { leagueId },
      select: { isFrozen: true },
    });

    return wallet?.isFrozen ?? false;
  }

  /**
   * Get leagues with payments due (for CRON)
   */
  async getLeaguesWithPaymentsDue(): Promise<string[]> {
    const now = new Date();

    const wallets = await prisma.leagueWallet.findMany({
      where: {
        nextPaymentDate: { lte: now },
        isFrozen: false,
      },
      select: { leagueId: true },
    });

    return wallets.map((w) => w.leagueId);
  }

  /**
   * Process all due payments (for CRON)
   */
  async processAllDuePayments(): Promise<{ processed: number; failed: number }> {
    const leagueIds = await this.getLeaguesWithPaymentsDue();

    let processed = 0;
    let failed = 0;

    for (const leagueId of leagueIds) {
      try {
        const result = await this.processMonthlyPayment(leagueId);
        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ [WALLET] Failed to process payment for league ${leagueId}:`, error);
        failed++;
      }
    }

    return { processed, failed };
  }
}

export const walletService = new WalletService();
