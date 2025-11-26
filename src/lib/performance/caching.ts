/** Week 28: Caching */
const cache = new Map();
export const cacheManager = { get: (k: string) => cache.get(k), set: (k: string, v: any) => cache.set(k, v) };
