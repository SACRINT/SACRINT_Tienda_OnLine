/** Week 28: Performance Optimization - Tasks 28.1-28.12 */

const cache = new Map<string, { data: any; expires: number }>();

export function cacheSet(key: string, data: any, ttlSeconds: number = 300) {
  cache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000),
  });
}

export function cacheGet(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheClear(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
