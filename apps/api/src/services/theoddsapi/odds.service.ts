import { prisma } from '../../lib/prisma';
import {
  theOddsAPIClient,
  OddsEvent,
  ODDS_API_COMPETITION_MAPPING,
  THESPORTSDB_TO_ODDS_API,
} from './client';

/**
 * Résultat du matching d'un match
 */
interface MatchResult {
  matchId: string;
  oddsApiId: string;
  homeWinOdds: number;
  drawOdds: number;
  awayWinOdds: number;
  bookmakerCount: number;
  rawData: OddsEvent;
}

/**
 * Statistiques de synchronisation
 */
interface SyncStats {
  competitionsSynced: number;
  matchesProcessed: number;
  matchesMatched: number;
  matchesUpdated: number;
  errors: string[];
}

/**
 * Service de synchronisation des cotes
 *
 * Stratégie de matching:
 * 1. Récupérer les matchs à venir d'une compétition (BDD)
 * 2. Récupérer les cotes de The Odds API pour la même compétition
 * 3. Matcher par date (même jour) + noms d'équipes (normalisation)
 * 4. Calculer les cotes moyennes à partir de tous les bookmakers
 */
class OddsService {
  /**
   * Normaliser un nom d'équipe pour le matching
   * - Minuscules
   * - Suppression des caractères spéciaux
   * - Suppression des suffixes courants (FC, City, United, etc.)
   */
  normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s]/g, '') // Garder lettres, chiffres, espaces
      .replace(
        /\b(fc|afc|sc|cf|club|city|united|town|athletic|wanderers|rovers|albion|hotspur|county)\b/g,
        '',
      )
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculer la similarité entre deux noms d'équipes (Jaccard simplifié)
   */
  calculateSimilarity(name1: string, name2: string): number {
    const norm1 = this.normalizeTeamName(name1);
    const norm2 = this.normalizeTeamName(name2);

    // Si identiques après normalisation
    if (norm1 === norm2) return 1;

    // Calculer la similarité basée sur les mots communs
    const words1 = new Set(norm1.split(' ').filter((w) => w.length > 2));
    const words2 = new Set(norm2.split(' ').filter((w) => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
  }

  /**
   * Vérifier si deux matchs correspondent
   * - Même jour
   * - Équipes similaires (seuil de 0.5)
   */
  matchesCorrespond(
    dbMatch: { startTime: Date; homeTeam: { name: string }; awayTeam: { name: string } },
    oddsEvent: OddsEvent,
  ): boolean {
    // Vérifier que c'est le même jour
    const dbDate = new Date(dbMatch.startTime).toISOString().split('T')[0];
    const oddsDate = oddsEvent.commence_time.split('T')[0];

    if (dbDate !== oddsDate) return false;

    // Calculer la similarité des équipes
    const homeSimilarity = this.calculateSimilarity(dbMatch.homeTeam.name, oddsEvent.home_team);
    const awaySimilarity = this.calculateSimilarity(dbMatch.awayTeam.name, oddsEvent.away_team);

    // Seuil de similarité
    const SIMILARITY_THRESHOLD = 0.4;

    return homeSimilarity >= SIMILARITY_THRESHOLD && awaySimilarity >= SIMILARITY_THRESHOLD;
  }

  /**
   * Calculer les cotes moyennes à partir des bookmakers
   */
  calculateAverageOdds(oddsEvent: OddsEvent): {
    homeWinOdds: number;
    drawOdds: number;
    awayWinOdds: number;
    bookmakerCount: number;
  } {
    let homeTotal = 0;
    let drawTotal = 0;
    let awayTotal = 0;
    let count = 0;

    for (const bookmaker of oddsEvent.bookmakers) {
      const h2hMarket = bookmaker.markets.find((m) => m.key === 'h2h');
      if (!h2hMarket) continue;

      const homeOutcome = h2hMarket.outcomes.find((o) => o.name === oddsEvent.home_team);
      const awayOutcome = h2hMarket.outcomes.find((o) => o.name === oddsEvent.away_team);
      const drawOutcome = h2hMarket.outcomes.find((o) => o.name === 'Draw');

      if (homeOutcome && awayOutcome && drawOutcome) {
        homeTotal += homeOutcome.price;
        awayTotal += awayOutcome.price;
        drawTotal += drawOutcome.price;
        count++;
      }
    }

    if (count === 0) {
      return { homeWinOdds: 0, drawOdds: 0, awayWinOdds: 0, bookmakerCount: 0 };
    }

    return {
      homeWinOdds: Math.round((homeTotal / count) * 100) / 100,
      drawOdds: Math.round((drawTotal / count) * 100) / 100,
      awayWinOdds: Math.round((awayTotal / count) * 100) / 100,
      bookmakerCount: count,
    };
  }

  /**
   * Synchroniser les cotes pour une compétition spécifique
   *
   * @param theSportsDbLeagueId - ID TheSportsDB de la compétition (ex: "4334" pour Ligue 1)
   */
  async syncOddsForCompetition(theSportsDbLeagueId: string): Promise<{
    matchesProcessed: number;
    matchesMatched: number;
    matchesUpdated: number;
  }> {
    // Vérifier si le mapping existe
    const oddsApiKey = THESPORTSDB_TO_ODDS_API[theSportsDbLeagueId];
    if (!oddsApiKey) {
      console.log(`⚠️ No Odds API mapping for TheSportsDB league ${theSportsDbLeagueId}`);
      return { matchesProcessed: 0, matchesMatched: 0, matchesUpdated: 0 };
    }

    // Récupérer la compétition en BDD
    const competition = await prisma.competition.findFirst({
      where: { externalId: theSportsDbLeagueId },
    });

    if (!competition) {
      console.log(`⚠️ Competition ${theSportsDbLeagueId} not found in database`);
      return { matchesProcessed: 0, matchesMatched: 0, matchesUpdated: 0 };
    }

    console.log(`🎰 Syncing odds for ${competition.name} (${oddsApiKey})`);

    // Récupérer les matchs à venir de la compétition (7 jours)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingMatches = await prisma.match.findMany({
      where: {
        competitionId: competition.id,
        status: 'upcoming',
        startTime: {
          gte: now,
          lte: nextWeek,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    console.log(`📅 Found ${upcomingMatches.length} upcoming matches in database`);

    if (upcomingMatches.length === 0) {
      return { matchesProcessed: 0, matchesMatched: 0, matchesUpdated: 0 };
    }

    // Récupérer les cotes de The Odds API
    let oddsEvents: OddsEvent[] = [];
    try {
      oddsEvents = await theOddsAPIClient.getOdds(oddsApiKey, 'eu', 'h2h');
      console.log(`🎰 Retrieved ${oddsEvents.length} events from The Odds API`);
    } catch (error) {
      console.error(`❌ Failed to fetch odds for ${oddsApiKey}:`, error);
      return { matchesProcessed: upcomingMatches.length, matchesMatched: 0, matchesUpdated: 0 };
    }

    let matchesMatched = 0;
    let matchesUpdated = 0;

    // Matcher et mettre à jour les cotes
    for (const dbMatch of upcomingMatches) {
      // Trouver l'événement correspondant
      const matchingEvent = oddsEvents.find((event) => this.matchesCorrespond(dbMatch, event));

      if (matchingEvent) {
        matchesMatched++;
        console.log(`✅ Matched: ${dbMatch.homeTeam.name} vs ${dbMatch.awayTeam.name}`);
        console.log(`   -> ${matchingEvent.home_team} vs ${matchingEvent.away_team}`);

        // Calculer les cotes moyennes
        const avgOdds = this.calculateAverageOdds(matchingEvent);

        if (avgOdds.bookmakerCount > 0) {
          // Upsert les cotes en BDD
          await prisma.matchOdds.upsert({
            where: { matchId: dbMatch.id },
            create: {
              matchId: dbMatch.id,
              oddsApiId: matchingEvent.id,
              oddsHomeTeam: matchingEvent.home_team,
              oddsAwayTeam: matchingEvent.away_team,
              homeWinOdds: avgOdds.homeWinOdds,
              drawOdds: avgOdds.drawOdds,
              awayWinOdds: avgOdds.awayWinOdds,
              bookmakerCount: avgOdds.bookmakerCount,
              rawData: matchingEvent as any,
              syncedAt: new Date(),
            },
            update: {
              oddsApiId: matchingEvent.id,
              oddsHomeTeam: matchingEvent.home_team,
              oddsAwayTeam: matchingEvent.away_team,
              homeWinOdds: avgOdds.homeWinOdds,
              drawOdds: avgOdds.drawOdds,
              awayWinOdds: avgOdds.awayWinOdds,
              bookmakerCount: avgOdds.bookmakerCount,
              rawData: matchingEvent as any,
              syncedAt: new Date(),
            },
          });

          matchesUpdated++;
          console.log(
            `   📊 Odds: Home ${avgOdds.homeWinOdds} | Draw ${avgOdds.drawOdds} | Away ${avgOdds.awayWinOdds} (${avgOdds.bookmakerCount} bookmakers)`,
          );
        }
      } else {
        console.log(
          `⚠️ No match found for: ${dbMatch.homeTeam.name} vs ${dbMatch.awayTeam.name} (${dbMatch.startTime.toISOString()})`,
        );
      }
    }

    return {
      matchesProcessed: upcomingMatches.length,
      matchesMatched,
      matchesUpdated,
    };
  }

  /**
   * Synchroniser les cotes pour toutes les compétitions supportées
   */
  async syncAllOdds(): Promise<SyncStats> {
    if (!theOddsAPIClient.isConfigured()) {
      return {
        competitionsSynced: 0,
        matchesProcessed: 0,
        matchesMatched: 0,
        matchesUpdated: 0,
        errors: ['The Odds API key not configured'],
      };
    }

    const stats: SyncStats = {
      competitionsSynced: 0,
      matchesProcessed: 0,
      matchesMatched: 0,
      matchesUpdated: 0,
      errors: [],
    };

    // Récupérer les compétitions actives qui ont un mapping
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
        externalId: {
          in: Object.values(ODDS_API_COMPETITION_MAPPING),
        },
      },
    });

    console.log(`🎰 Starting odds sync for ${activeCompetitions.length} competitions`);

    for (const competition of activeCompetitions) {
      try {
        const result = await this.syncOddsForCompetition(competition.externalId);
        stats.competitionsSynced++;
        stats.matchesProcessed += result.matchesProcessed;
        stats.matchesMatched += result.matchesMatched;
        stats.matchesUpdated += result.matchesUpdated;
      } catch (error) {
        const errorMsg = `Failed to sync odds for ${competition.name}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    console.log(`✅ Odds sync completed:`);
    console.log(`   - Competitions: ${stats.competitionsSynced}`);
    console.log(`   - Matches processed: ${stats.matchesProcessed}`);
    console.log(`   - Matches matched: ${stats.matchesMatched}`);
    console.log(`   - Matches updated: ${stats.matchesUpdated}`);

    return stats;
  }

  /**
   * Récupérer les cotes d'un match spécifique
   */
  async getMatchOdds(matchId: string) {
    return prisma.matchOdds.findUnique({
      where: { matchId },
      include: {
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
            competition: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer les matchs avec leurs cotes
   */
  async getMatchesWithOdds(
    options: {
      competitionId?: string;
      limit?: number;
      onlyWithOdds?: boolean;
    } = {},
  ) {
    const { competitionId, limit = 50, onlyWithOdds = false } = options;

    const where: any = {
      status: 'upcoming',
    };

    if (competitionId) {
      where.competitionId = competitionId;
    }

    if (onlyWithOdds) {
      where.odds = { isNot: null };
    }

    return prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        odds: true,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });
  }

  /**
   * Obtenir les statistiques du service
   */
  getStats() {
    return {
      apiStats: theOddsAPIClient.getStats(),
      supportedCompetitionsMapping: ODDS_API_COMPETITION_MAPPING,
    };
  }
}

export const oddsService = new OddsService();
