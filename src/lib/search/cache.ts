/**
 * Sistema de Caché para Búsquedas
 * Task 11.8: Performance - Query Caching
 *
 * Implementa un caché en memoria con TTL (Time To Live) para mejorar
 * el rendimiento de búsquedas frecuentes.
 *
 * En producción, esto se reemplazaría con Redis o similar.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class SearchCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutos por defecto
  }

  /**
   * Genera una clave de caché única basada en los parámetros
   */
  private generateKey(tenantId: string, query: string, filters: Record<string, any>): string {
    const filtersString = JSON.stringify(filters);
    return `search:${tenantId}:${query}:${filtersString}`;
  }

  /**
   * Verifica si una entrada está expirada
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Limpia entradas expiradas
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Limpia las entradas más antiguas si el caché está lleno
   */
  private evictOldest(): void {
    if (this.cache.size < this.maxSize) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Obtiene un valor del caché
   */
  get<T>(tenantId: string, query: string, filters: Record<string, any> = {}): T | null {
    const key = this.generateKey(tenantId, query, filters);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda un valor en el caché
   */
  set<T>(
    tenantId: string,
    query: string,
    data: T,
    filters: Record<string, any> = {},
    ttl?: number
  ): void {
    this.cleanupExpired();
    this.evictOldest();

    const key = this.generateKey(tenantId, query, filters);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalida todo el caché de un tenant
   * Útil cuando se actualiza/crea/elimina un producto
   */
  invalidateTenant(tenantId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`search:${tenantId}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalida una búsqueda específica
   */
  invalidate(tenantId: string, query: string, filters: Record<string, any> = {}): void {
    const key = this.generateKey(tenantId, query, filters);
    this.cache.delete(key);
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expired: number;
  } {
    let expiredCount = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Se puede calcular con contadores adicionales
      expired: expiredCount,
    };
  }
}

// Singleton instance
export const searchCache = new SearchCache();

/**
 * Wrapper para usar el caché con async functions
 */
export async function withCache<T>(
  tenantId: string,
  query: string,
  filters: Record<string, any>,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Intentar obtener del caché
  const cached = searchCache.get<T>(tenantId, query, filters);

  if (cached !== null) {
    console.log(`[CACHE HIT] ${query}`);
    return cached;
  }

  console.log(`[CACHE MISS] ${query}`);

  // Si no está en caché, ejecutar fetcher
  const result = await fetcher();

  // Guardar en caché
  searchCache.set(tenantId, query, result, filters, ttl);

  return result;
}
