import axios, { AxiosInstance, AxiosError } from 'axios';
import { cacheService } from '../cache/cache.service';

/**
 * Client HTTP pour TheSportsDB avec rate limiting et gestion du cache
 *
 * API gratuite (V1): 30 requêtes/minute
 * API premium (V2): Plus de requêtes + live scores toutes les 2min
 */
class TheSportsDBClient {
  private axiosInstance: AxiosInstance;
  private apiKey: string;
  private baseURL: string;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private requestCount = 0;
  private requestWindowStart = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 30; // Rate limit gratuit
  private readonly REQUEST_WINDOW_MS = 60 * 1000; // 1 minute

  constructor() {
    this.apiKey = process.env.THESPORTSDB_API_KEY || '3';

    // IMPORTANT: Les endpoints standards (lookupleague, lookup_all_teams, etc.) utilisent toujours V1
    // Seuls les livescores utilisent V2 avec une clé premium
    this.baseURL = 'https://www.thesportsdb.com/api/v1/json';
    const isPremium = this.apiKey !== '3' && this.apiKey.length > 5;

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour logger les requêtes
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`🌐 TheSportsDB Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          console.error('❌ Rate limit exceeded (429). Retrying after delay...');
          await this.delay(2000);
          return this.axiosInstance.request(error.config!);
        }
        return Promise.reject(error);
      }
    );

    console.log(`✅ TheSportsDB Client initialized (${isPremium ? 'Premium Key' : 'Free Key'} - V1 API)`);
  }

  /**
   * Effectuer une requête GET avec gestion du cache et du rate limiting
   */
  async get<T>(endpoint: string, cacheKey?: string, cacheTTL?: number): Promise<T> {
    // Vérifier le cache si une clé est fournie
    if (cacheKey && cacheService.has(cacheKey)) {
      console.log(`💾 Cache HIT: ${cacheKey}`);
      return cacheService.get<T>(cacheKey)!;
    }

    // Ajouter à la queue et attendre l'exécution
    const result = await this.addToQueue<T>(() =>
      this.axiosInstance.get<T>(`/${this.apiKey}${endpoint}`)
    );

    // Mettre en cache si une clé est fournie
    if (cacheKey && result) {
      cacheService.set(cacheKey, result, cacheTTL);
      console.log(`💾 Cache SET: ${cacheKey} (TTL: ${cacheTTL || 'default'}s)`);
    }

    return result;
  }

  /**
   * Ajouter une requête à la queue avec rate limiting
   */
  private async addToQueue<T>(requestFn: () => Promise<any>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Vérifier le rate limiting
          await this.checkRateLimit();

          const response = await requestFn();
          resolve(response.data);
        } catch (error) {
          reject(error);
        }
      });

      // Démarrer le traitement de la queue si pas déjà en cours
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Traiter la queue de requêtes
   */
  private async processQueue() {
    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        // Délai entre chaque requête pour être gentil avec l'API
        await this.delay(100);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Vérifier et appliquer le rate limiting
   */
  private async checkRateLimit() {
    const now = Date.now();
    const elapsed = now - this.requestWindowStart;

    // Réinitialiser le compteur si la fenêtre de temps est dépassée
    if (elapsed >= this.REQUEST_WINDOW_MS) {
      this.requestCount = 0;
      this.requestWindowStart = now;
    }

    // Si on a atteint la limite, attendre
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = this.REQUEST_WINDOW_MS - elapsed;
      console.warn(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await this.delay(waitTime);
      this.requestCount = 0;
      this.requestWindowStart = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Délai (promisifié)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Obtenir les statistiques du client
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      windowStart: new Date(this.requestWindowStart).toISOString(),
    };
  }
}

// Exporter une instance unique (singleton)
export const theSportsDBClient = new TheSportsDBClient();
