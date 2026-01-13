import NodeCache from 'node-cache';

/**
 * Service de cache simple en mémoire
 * Utilisé pour mettre en cache les réponses de TheSportsDB
 */
class CacheService {
  private cache: NodeCache;

  constructor() {
    // Initialiser le cache avec un TTL par défaut de 1h (3600 secondes)
    this.cache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 600, // Vérifier les clés expirées toutes les 10 minutes
      useClones: false, // Améliore les performances
    });

    console.log('✅ Cache service initialized');
  }

  /**
   * Récupérer une valeur du cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Stocker une valeur dans le cache
   * @param key - Clé unique
   * @param value - Valeur à stocker
   * @param ttl - Durée de vie en secondes (optionnel)
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Supprimer une clé du cache
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Vider tout le cache
   */
  flush(): void {
    this.cache.flushAll();
    console.log('Cache flushed');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Vérifier si une clé existe dans le cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Exporter une instance unique (singleton)
export const cacheService = new CacheService();