/**
 * Caching Layer - Semana 25
 * Sistema de caché para performance
 */

const cache = new Map<string, { value: any; expiresAt: number }>();

export function setCache(key: string, value: any, ttlSeconds: number = 300) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function getCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  return cached.value as T;
}

export function clearCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Cache helpers para casos comunes
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached) return cached;

  const result = await queryFn();
  setCache(key, result, ttl);
  return result;
}
