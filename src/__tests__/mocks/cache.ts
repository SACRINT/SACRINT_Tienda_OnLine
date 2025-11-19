// Cache Mock for Testing

const cacheStore = new Map<string, { value: unknown; expiry: number }>();

export const mockCache = {
  get: jest.fn(async <T>(key: string): Promise<T | null> => {
    const item = cacheStore.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      cacheStore.delete(key);
      return null;
    }
    return item.value as T;
  }),

  set: jest.fn(
    async (
      key: string,
      value: unknown,
      options?: { ttl?: number; tags?: string[] }
    ): Promise<void> => {
      const expiry = options?.ttl ? Date.now() + options.ttl * 1000 : 0;
      cacheStore.set(key, { value, expiry });
    }
  ),

  delete: jest.fn(async (key: string): Promise<void> => {
    cacheStore.delete(key);
  }),

  clear: jest.fn(async (): Promise<void> => {
    cacheStore.clear();
  }),

  has: jest.fn(async (key: string): Promise<boolean> => {
    return cacheStore.has(key);
  }),

  // Test helpers
  _getStore: () => cacheStore,
  _reset: () => {
    cacheStore.clear();
    mockCache.get.mockClear();
    mockCache.set.mockClear();
    mockCache.delete.mockClear();
    mockCache.clear.mockClear();
    mockCache.has.mockClear();
  },
};

// Mock the cache module
jest.mock("@/lib/cache/cache-service", () => ({
  cache: mockCache,
  CACHE_TTL: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 1800,
    HOUR: 3600,
    DAY: 86400,
  },
}));

export { cacheStore };
