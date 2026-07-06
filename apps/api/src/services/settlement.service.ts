import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { sendPushNotifications } from './notification.service';

/**
 * Bet settlement: once a match is finished (or cancelled), turn every pending
 * bet into won/lost/void and credit the resulting points back to the member.
 *
 * Scoring model:
 *  - Winner correct  -> payout = stake × odds (stored odds, fallback DEFAULT_ODDS)
 *  - Exact score too -> + stake × EXACT_SCORE_MULTIPLIER (both_score bets only)
 *  - Winner wrong    -> lost, nothing credited (stake was already deducted)
 *  - Match void      -> refund the stake
 *
 * The stake is deducted when the bet is placed, so on a win we credit the gross
 * payout (net gain = payout − stake).
 */

const DEFAULT_ODDS = 2.0; // Used when a match has no synced odds for the outcome.
const EXACT_SCORE_MULTIPLIER = 5; // Bonus multiplier for a correct exact score.

type Outcome = 'home' | 'draw' | 'away';

function outcomeFromScore(home: number, away: number): Outcome {
  return home > away ? 'home' : home < away ? 'away' : 'draw';
}

export interface SettlementResult {
  matchesSettled: number;
  betsSettled: number;
  pointsCredited: number;
}

class SettlementService {
  /**
   * Settle every pending bet whose match is finished/cancelled. Idempotent:
   * only `pending` bets are touched, so it is safe to run after each sync.
   */
  async settleFinishedMatches(): Promise<SettlementResult> {
    const pendingBets = await prisma.bet.findMany({
      where: {
        status: 'pending',
        match: { status: { in: ['finished', 'cancelled', 'postponed'] } },
      },
      include: { 
        match: { 
          include: { 
            odds: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } }
          } 
        },
        user: { select: { pushTokens: true } }
      },
    });

    let betsSettled = 0;
    let pointsCredited = 0;
    const matchIds = new Set<string>();
    const groupBetIds = new Set<string>();

    // Snapshot each affected league's standings BEFORE crediting points, so the
    // leaderboard can show how ranks moved as a result of this settlement.
    const affectedLeagueIds = new Set(pendingBets.map((b) => b.leagueId));
    await this.snapshotRanks([...affectedLeagueIds]);

    for (const bet of pendingBets) {
      const match = bet.match;
      matchIds.add(match.id);
      if (bet.groupBetId) groupBetIds.add(bet.groupBetId);

      // No usable final score -> void the bet and refund the stake.
      if (match.status !== 'finished' || match.homeScore == null || match.awayScore == null) {
        await this.voidBet(bet);
        betsSettled++;
        pointsCredited += bet.amount;
        continue;
      }

      const actual = outcomeFromScore(match.homeScore, match.awayScore);
      const actualWin = this.computeWin(bet, actual, match);
      await this.applySettlement(bet, actualWin);
      betsSettled++;
      pointsCredited += actualWin;

      // Send push notification
      if (bet.user.pushTokens && bet.user.pushTokens.length > 0) {
        const teamMatchStr = `${match.homeTeam.name} - ${match.awayTeam.name}`;
        const title = actualWin > 0 ? 'Pari gagné ! 🎉' : 'Pari perdu 😢';
        const body = actualWin > 0 
          ? `Vous avez remporté ${actualWin} points sur le match ${teamMatchStr}.` 
          : `Dommage, votre pari sur ${teamMatchStr} est perdu.`;
        
        // We don't await here to avoid slowing down settlement loop
        sendPushNotifications(bet.user.pushTokens, title, body).catch(err => {
          console.error('Failed to send settlement notification', err);
        });
      }
    }

    // Mark every touched group bet as settled.
    if (groupBetIds.size > 0) {
      await prisma.groupBet.updateMany({
        where: { id: { in: [...groupBetIds] }, status: { not: 'settled' } },
        data: { status: 'settled', settledAt: new Date() },
      });
    }

    if (betsSettled > 0) {
      console.log(
        `🏁 [SETTLE] ${betsSettled} pari(s) réglé(s) sur ${matchIds.size} match(s), ${pointsCredited} pts crédités`,
      );
    }

    return { matchesSettled: matchIds.size, betsSettled, pointsCredited };
  }

  /**
   * Persist each member's current rank (by points desc) as `previousRank` for
   * the given leagues. Called just before points are credited so the next
   * leaderboard read can compute the up/down delta against these standings.
   */
  private async snapshotRanks(leagueIds: string[]): Promise<void> {
    for (const leagueId of leagueIds) {
      const members = await prisma.leagueMember.findMany({
        where: { leagueId },
        orderBy: { points: 'desc' },
        select: { id: true },
      });
      await prisma.$transaction(
        members.map((m, index) =>
          prisma.leagueMember.update({
            where: { id: m.id },
            data: { previousRank: index + 1 },
          }),
        ),
      );
    }
  }

  /** Points to credit for a finished match (0 when the winner pick is wrong). */
  private computeWin(bet: any, actual: Outcome, match: any): number {
    let parsed: any;
    try {
      parsed = JSON.parse(bet.predictionValue);
    } catch {
      return 0;
    }

    if (parsed?.value !== actual) return 0; // Winner pick missed.

    let payout = Math.round(bet.amount * this.oddsFor(actual, match.odds));

    if (bet.predictionType === 'both_score') {
      const exact =
        Number(parsed.homeScore) === match.homeScore &&
        Number(parsed.awayScore) === match.awayScore;
      if (exact) payout += bet.amount * EXACT_SCORE_MULTIPLIER;
    }

    return payout;
  }

  private oddsFor(outcome: Outcome, odds: any): number {
    if (!odds) return DEFAULT_ODDS;
    const value =
      outcome === 'home' ? odds.homeWinOdds : outcome === 'away' ? odds.awayWinOdds : odds.drawOdds;
    return typeof value === 'number' && value > 1 ? value : DEFAULT_ODDS;
  }

  private async applySettlement(bet: any, actualWin: number): Promise<void> {
    const won = actualWin > 0;
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: won ? 'won' : 'lost', actualWin, settledAt: new Date() },
      });
      if (won) {
        await tx.leagueMember.updateMany({
          where: { leagueId: bet.leagueId, userId: bet.userId },
          data: { points: { increment: actualWin } },
        });
      }
    });
  }

  private async voidBet(bet: any): Promise<void> {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: 'void', actualWin: 0, settledAt: new Date() },
      });
      // Refund the stake that was deducted when the bet was placed.
      await tx.leagueMember.updateMany({
        where: { leagueId: bet.leagueId, userId: bet.userId },
        data: { points: { increment: bet.amount } },
      });
    });
  }
}

export const settlementService = new SettlementService();
