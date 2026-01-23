import { prisma } from '../lib/prisma';

// Constants
const FREE_PLAN_WEEKLY_BET_LIMIT = 3;
const FREE_PLAN_COMPETITION_CHANGE_DAYS = 7;
const MATCH_BETTING_WINDOW_DAYS = 7; // J-7
const MATCH_CLOSE_BEFORE_MINUTES = 10; // M-10

export interface BetValidationResult {
  valid: boolean;
  error?: string;
}

export interface WeeklyBetStatus {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  resetsAt: Date;
}

class BetsService {
  /**
   * Get the start of the current week (Monday 00:00:00)
   */
  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is day 1
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * Get the end of the current week (Sunday 23:59:59)
   */
  private getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }

  /**
   * Check if a user has reached their weekly bet limit (Free plan only)
   * For now, we assume all users are on Free plan since Plans are not implemented yet
   */
  async getWeeklyBetStatus(userId: string, leagueId: string): Promise<WeeklyBetStatus> {
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd();

    // Count bets this week
    const betsThisWeek = await prisma.bet.count({
      where: {
        userId,
        leagueId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // TODO: Check user's plan when Plans are implemented
    // For now, assume Free plan (3 bets/week limit)
    const isUnlimited = false; // Will be true for Premium/Premium+
    const limit = FREE_PLAN_WEEKLY_BET_LIMIT;

    return {
      used: betsThisWeek,
      limit,
      remaining: Math.max(0, limit - betsThisWeek),
      isUnlimited,
      resetsAt: weekEnd,
    };
  }

  /**
   * Check if a user can place a bet (weekly limit check)
   */
  async canPlaceBet(userId: string, leagueId: string): Promise<BetValidationResult> {
    const status = await this.getWeeklyBetStatus(userId, leagueId);

    if (status.isUnlimited) {
      return { valid: true };
    }

    if (status.remaining <= 0) {
      return {
        valid: false,
        error: `Vous avez atteint la limite de ${status.limit} paris par semaine. Limite réinitialisée le ${status.resetsAt.toLocaleDateString('fr-FR')}.`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if a match is within the betting window (J-7 to M-10)
   */
  isMatchBettable(matchStartTime: Date): BetValidationResult {
    const now = new Date();
    const maxBettingDate = new Date(matchStartTime);
    maxBettingDate.setDate(maxBettingDate.getDate() - MATCH_BETTING_WINDOW_DAYS);

    const closesAt = new Date(matchStartTime);
    closesAt.setMinutes(closesAt.getMinutes() - MATCH_CLOSE_BEFORE_MINUTES);

    // Check if we're too early (more than J-7)
    if (now < maxBettingDate) {
      const daysUntilOpen = Math.ceil((maxBettingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        valid: false,
        error: `Les paris ouvriront dans ${daysUntilOpen} jour(s), le ${maxBettingDate.toLocaleDateString('fr-FR')}.`,
      };
    }

    // Check if we're too late (less than M-10)
    if (now > closesAt) {
      return {
        valid: false,
        error: `Les paris sont fermés pour ce match (clôture 10 minutes avant le début).`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate the closes_at time for a challenge (M-10)
   */
  calculateClosesAt(matchStartTime: Date): Date {
    const closesAt = new Date(matchStartTime);
    closesAt.setMinutes(closesAt.getMinutes() - MATCH_CLOSE_BEFORE_MINUTES);
    return closesAt;
  }

  /**
   * Check if a league can change competition (Free plan: 1x/week)
   */
  async canChangeCompetition(leagueId: string): Promise<BetValidationResult> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { competitionChangedAt: true },
    });

    if (!league) {
      return { valid: false, error: 'Ligue non trouvée.' };
    }

    // If never changed, allow
    if (!league.competitionChangedAt) {
      return { valid: true };
    }

    // TODO: Check league's plan when Plans are implemented
    // For now, assume Free plan (1 change/week)
    const isUnlimited = false;

    if (isUnlimited) {
      return { valid: true };
    }

    const daysSinceChange = Math.floor(
      (Date.now() - league.competitionChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceChange < FREE_PLAN_COMPETITION_CHANGE_DAYS) {
      const daysRemaining = FREE_PLAN_COMPETITION_CHANGE_DAYS - daysSinceChange;
      return {
        valid: false,
        error: `Vous pourrez changer de compétition dans ${daysRemaining} jour(s).`,
      };
    }

    return { valid: true };
  }

  /**
   * Get days until competition can be changed
   */
  async getDaysUntilCompetitionChange(leagueId: string): Promise<number | null> {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { competitionChangedAt: true },
    });

    if (!league || !league.competitionChangedAt) {
      return null; // Can change now
    }

    // TODO: Check league's plan when Plans are implemented
    const isUnlimited = false;
    if (isUnlimited) {
      return null;
    }

    const daysSinceChange = Math.floor(
      (Date.now() - league.competitionChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceChange >= FREE_PLAN_COMPETITION_CHANGE_DAYS) {
      return null; // Can change now
    }

    return FREE_PLAN_COMPETITION_CHANGE_DAYS - daysSinceChange;
  }

  /**
   * Check if user is a member of the league
   */
  async isLeagueMember(userId: string, leagueId: string): Promise<boolean> {
    const membership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId,
        },
      },
    });
    return !!membership;
  }

  /**
   * Check if user is admin or owner of the league
   */
  async isLeagueAdminOrOwner(userId: string, leagueId: string): Promise<boolean> {
    const membership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId,
        },
      },
    });
    return !!membership && ['owner', 'admin'].includes(membership.role);
  }

  /**
   * Check if a challenge already exists for a match in a league
   */
  async challengeExists(leagueId: string, matchId: string): Promise<boolean> {
    const existing = await prisma.groupBet.findUnique({
      where: {
        leagueId_matchId: {
          leagueId,
          matchId,
        },
      },
    });
    return !!existing;
  }

  /**
   * Check if user has already bet on a challenge
   */
  async hasUserBetOnChallenge(userId: string, groupBetId: string): Promise<boolean> {
    const existing = await prisma.bet.findFirst({
      where: {
        userId,
        groupBetId,
      },
    });
    return !!existing;
  }

  /**
   * Validate prediction value format
   */
  validatePredictionValue(predictionType: string, predictionValue: string): BetValidationResult {
    try {
      const parsed = JSON.parse(predictionValue);

      if (predictionType === 'winner') {
        if (!parsed.type || parsed.type !== 'winner') {
          return { valid: false, error: 'Format de prédiction invalide.' };
        }
        if (!['home', 'draw', 'away'].includes(parsed.value)) {
          return { valid: false, error: 'Valeur de prédiction invalide. Utilisez "home", "draw" ou "away".' };
        }
        return { valid: true };
      }

      // Add more prediction types here when implemented
      return { valid: false, error: `Type de prédiction "${predictionType}" non supporté.` };
    } catch {
      return { valid: false, error: 'Format JSON invalide pour la prédiction.' };
    }
  }

  /**
   * Close expired challenges (status: open -> closed)
   * This should be called by a CRON job
   */
  async closeExpiredChallenges(): Promise<number> {
    const now = new Date();

    const result = await prisma.groupBet.updateMany({
      where: {
        status: 'open',
        closesAt: {
          lte: now,
        },
      },
      data: {
        status: 'closed',
      },
    });

    return result.count;
  }
}

export const betsService = new BetsService();
