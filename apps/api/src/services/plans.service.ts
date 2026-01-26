import { prisma } from '../lib/prisma';
import { PlanSummary, PlanLimitCheck } from '@betteam/shared/interfaces/Plan';

class PlansService {
  /**
   * Get all available plans
   */
  async getAllPlans(): Promise<PlanSummary[]> {
    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPrice: 'asc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      maxMembers: plan.maxMembers,
      maxCompetitions: plan.maxCompetitions,
      maxChangesWeek: plan.maxChangesWeek,
      monthlyPrice: plan.monthlyPrice,
      features: plan.features as Record<string, boolean>,
    }));
  }

  /**
   * Get a plan by ID
   */
  async getPlanById(planId: string): Promise<PlanSummary | null> {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return null;
    }

    return {
      id: plan.id,
      name: plan.name,
      maxMembers: plan.maxMembers,
      maxCompetitions: plan.maxCompetitions,
      maxChangesWeek: plan.maxChangesWeek,
      monthlyPrice: plan.monthlyPrice,
      features: plan.features as Record<string, boolean>,
    };
  }

  /**
   * Get the plan for a league
   */
  async getLeaguePlan(leagueId: string): Promise<PlanSummary | null> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { plan: true },
    });

    if (!league || !league.plan) {
      return null;
    }

    return {
      id: league.plan.id,
      name: league.plan.name,
      maxMembers: league.plan.maxMembers,
      maxCompetitions: league.plan.maxCompetitions,
      maxChangesWeek: league.plan.maxChangesWeek,
      monthlyPrice: league.plan.monthlyPrice,
      features: league.plan.features as Record<string, boolean>,
    };
  }

  /**
   * Check plan limits for a league
   */
  async checkPlanLimits(leagueId: string): Promise<PlanLimitCheck> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        plan: true,
        _count: { select: { members: true } },
      },
    });

    if (!league || !league.plan) {
      throw new Error('League not found');
    }

    const plan = league.plan;
    const currentMembers = league._count.members;
    const isUnlimited = plan.maxChangesWeek === -1;

    // Count competition changes this week
    let changesThisWeek = 0;
    if (league.competitionChangedAt) {
      const weekStart = this.getWeekStart();
      if (league.competitionChangedAt >= weekStart) {
        changesThisWeek = 1;
      }
    }

    return {
      canAddMember: currentMembers < plan.maxMembers,
      canChangeCompetition: isUnlimited || changesThisWeek < plan.maxChangesWeek,
      currentMembers,
      maxMembers: plan.maxMembers,
      changesThisWeek,
      maxChangesWeek: plan.maxChangesWeek,
      isUnlimited,
    };
  }

  /**
   * Check if a league can add a new member
   */
  async canAddMember(leagueId: string): Promise<{ allowed: boolean; error?: string }> {
    const limits = await this.checkPlanLimits(leagueId);

    if (!limits.canAddMember) {
      return {
        allowed: false,
        error: `Cette ligue a atteint sa limite de ${limits.maxMembers} membres. Passez à un plan supérieur pour en ajouter plus.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if a league can change competition
   */
  async canChangeCompetition(leagueId: string): Promise<{ allowed: boolean; error?: string; daysUntilChange?: number }> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { plan: true },
    });

    if (!league || !league.plan) {
      return { allowed: false, error: 'Ligue non trouvée.' };
    }

    const plan = league.plan;

    // Unlimited changes for paid plans
    if (plan.maxChangesWeek === -1) {
      return { allowed: true };
    }

    // If never changed, allow
    if (!league.competitionChangedAt) {
      return { allowed: true };
    }

    // Check if change was within the week
    const weekStart = this.getWeekStart();
    if (league.competitionChangedAt < weekStart) {
      return { allowed: true };
    }

    // Calculate days until can change again
    const daysSinceChange = Math.floor(
      (Date.now() - league.competitionChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilChange = 7 - daysSinceChange;

    return {
      allowed: false,
      error: `Vous pourrez changer de compétition dans ${daysUntilChange} jour(s). Passez à un plan supérieur pour des changements illimités.`,
      daysUntilChange,
    };
  }

  /**
   * Get the start of the current week (Monday 00:00:00)
   */
  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}

export const plansService = new PlansService();
