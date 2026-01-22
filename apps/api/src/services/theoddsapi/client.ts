import axios, { AxiosInstance, AxiosError } from 'axios';
import { cacheService } from '../cache/cache.service';

/**
 * Types pour The Odds API
 */
export interface OddsOutcome {
  name: string; // Nom de l'équipe ou "Draw"
  price: number; // Cote décimale
}

export interface OddsMarket {
  key: string; // "h2h", "spreads", "totals"
  last_update: string;
  outcomes: OddsOutcome[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO 8601
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

/**
 * Mapping des compétitions The Odds API <-> TheSportsDB
 *
 * The Odds API sport_key -> TheSportsDB league ID
 */
export const ODDS_API_COMPETITION_MAPPING: Record<string, string> = {
  // Football - Top 5 leagues européennes
  'soccer_epl': '4328',                   // Premier League England
  'soccer_france_ligue_one': '4334',      // Ligue 1 France
  'soccer_germany_bundesliga': '4331',    // Bundesliga Germany
  'soccer_italy_serie_a': '4332',         // Serie A Italy
  'soccer_spain_la_liga': '4335',         // La Liga Spain
};

/**
 * Mapping inverse: TheSportsDB league ID -> The Odds API sport_key
 */
export const THESPORTSDB_TO_ODDS_API: Record<string, string> = Object.entries(
  ODDS_API_COMPETITION_MAPPING
).reduce((acc, [oddsKey, sportsDbId]) => {
  acc[sportsDbId] = oddsKey;
  return acc;
}, {} as Record<string, string>);

/**
 * Client HTTP pour The Odds API
 *
 * API gratuite: 500 requêtes/mois
 * Stratégie: Mise à jour 2x/jour à 9h et 18h via CRON
 *
 * Documentation: https://the-odds-api.com/
 */
class TheOddsAPIClient {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private readonly baseURL = 'https://api.the-odds-api.com/v4';

  // Suivi des requêtes pour le monitoring (500/mois max)
  private requestCount = 0;
  private monthStart = new Date();

  constructor() {
    this.apiKey = process.env.THE_ODDS_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ THE_ODDS_API_KEY not set. Odds sync will be disabled.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour logger les requêtes
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`🎰 TheOddsAPI Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs et suivre le quota
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // The Odds API retourne les infos de quota dans les headers
        const remaining = response.headers['x-requests-remaining'];
        const used = response.headers['x-requests-used'];
        if (remaining !== undefined) {
          console.log(`📊 TheOddsAPI Quota: ${used} used, ${remaining} remaining`);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.error('❌ TheOddsAPI: Invalid API key');
        } else if (error.response?.status === 429) {
          console.error('❌ TheOddsAPI: Rate limit exceeded (monthly quota)');
        } else if (error.response?.status === 422) {
          console.error('❌ TheOddsAPI: Invalid parameters', error.response.data);
        }
        return Promise.reject(error);
      }
    );

    console.log(`✅ TheOddsAPI Client initialized (Key: ${this.apiKey ? 'configured' : 'NOT SET'})`);
  }

  /**
   * Vérifier si le client est configuré
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Effectuer une requête GET avec gestion du cache
   */
  async get<T>(endpoint: string, params: Record<string, string> = {}, cacheKey?: string, cacheTTL?: number): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('TheOddsAPI: API key not configured');
    }

    // Vérifier le cache si une clé est fournie
    if (cacheKey && cacheService.has(cacheKey)) {
      console.log(`💾 Cache HIT: ${cacheKey}`);
      return cacheService.get<T>(cacheKey)!;
    }

    // Ajouter la clé API aux paramètres
    const queryParams = new URLSearchParams({
      ...params,
      apiKey: this.apiKey,
    });

    const response = await this.axiosInstance.get<T>(`${endpoint}?${queryParams}`);
    const result = response.data;

    // Mettre en cache si une clé est fournie
    if (cacheKey && result) {
      cacheService.set(cacheKey, result, cacheTTL);
      console.log(`💾 Cache SET: ${cacheKey} (TTL: ${cacheTTL || 'default'}s)`);
    }

    this.requestCount++;
    return result;
  }

  /**
   * Récupérer les cotes pour une compétition
   *
   * @param sportKey - Clé du sport (ex: "soccer_france_ligue_one")
   * @param regions - Région des bookmakers (eu, uk, us, au)
   * @param markets - Type de marché (h2h = 1X2)
   */
  async getOdds(
    sportKey: string,
    regions: string = 'eu',
    markets: string = 'h2h'
  ): Promise<OddsEvent[]> {
    const cacheKey = `odds_${sportKey}_${regions}_${markets}`;
    // Cache de 2h pour économiser les requêtes
    const cacheTTL = 2 * 60 * 60;

    return this.get<OddsEvent[]>(
      `/sports/${sportKey}/odds`,
      { regions, markets },
      cacheKey,
      cacheTTL
    );
  }

  /**
   * Récupérer la liste des sports disponibles
   */
  async getSports(): Promise<Array<{ key: string; title: string; active: boolean }>> {
    const cacheKey = 'odds_sports_list';
    const cacheTTL = 24 * 60 * 60; // 24h

    return this.get(`/sports`, {}, cacheKey, cacheTTL);
  }

  /**
   * Obtenir les statistiques du client
   */
  getStats() {
    return {
      isConfigured: this.isConfigured(),
      requestCountThisSession: this.requestCount,
      supportedCompetitions: Object.keys(ODDS_API_COMPETITION_MAPPING),
    };
  }
}

// Exporter une instance unique (singleton)
export const theOddsAPIClient = new TheOddsAPIClient();
