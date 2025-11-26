/**
 * Shipping Rates Cache - Task 16.5
 * In-memory cache for shipping rates (24h TTL)
 * In production: Use Redis for distributed caching
 */

import { getProvider, ShippingProviderType, getSupportedProviders } from "./provider-manager";

interface CachedRate {
  rate: number;
  provider: ShippingProviderType;
  expiresAt: number;
}

interface RateCacheKey {
  fromZip: string;
  toZip: string;
  weight: number;
  provider: ShippingProviderType;
}

// In-memory cache (replace with Redis in production)
const ratesCache = new Map<string, CachedRate>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getCacheKey(params: RateCacheKey): string {
  return `${params.provider}:${params.fromZip}:${params.toZip}:${params.weight}`;
}

export async function getCachedRate(params: RateCacheKey): Promise<number | null> {
  const key = getCacheKey(params);
  const cached = ratesCache.get(key);

  if (!cached) return null;

  // Check if expired
  if (Date.now() > cached.expiresAt) {
    ratesCache.delete(key);
    return null;
  }

  return cached.rate;
}

export async function setCachedRate(params: RateCacheKey, rate: number): Promise<void> {
  const key = getCacheKey(params);
  ratesCache.set(key, {
    rate,
    provider: params.provider,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

export async function getShippingRate(
  fromZip: string,
  toZip: string,
  weight: number,
  provider: ShippingProviderType
): Promise<number> {
  // Try cache first
  const cached = await getCachedRate({ fromZip, toZip, weight, provider });
  if (cached !== null) {
    return cached;
  }

  // Fetch from provider
  const providerInstance = getProvider(provider);
  const rate = await providerInstance.calculateRate(fromZip, toZip, weight);

  // Cache the result
  await setCachedRate({ fromZip, toZip, weight, provider }, rate);

  return rate;
}

export async function compareRates(
  fromZip: string,
  toZip: string,
  weight: number
): Promise<Array<{ provider: ShippingProviderType; rate: number; estimatedDays?: number }>> {
  const providers = getSupportedProviders();

  const ratePromises = providers.map(async (provider) => {
    try {
      const rate = await getShippingRate(fromZip, toZip, weight, provider);
      return {
        provider,
        rate,
        estimatedDays: getEstimatedDeliveryDays(provider),
      };
    } catch (error) {
      console.error(`Error fetching rate from ${provider}:`, error);
      return null;
    }
  });

  const results = await Promise.all(ratePromises);
  return results.filter((r) => r !== null) as Array<{ provider: ShippingProviderType; rate: number; estimatedDays?: number }>;
}

function getEstimatedDeliveryDays(provider: ShippingProviderType): number {
  // Default estimates (would come from provider API in production)
  const estimates: Record<ShippingProviderType, number> = {
    ESTAFETA: 3,
    MERCADO_ENVIOS: 4,
    FEDEX: 2,
    DHL: 2,
    UPS: 3,
    CUSTOM: 5,
  };
  return estimates[provider] || 5;
}

// Background task to refresh popular routes (run every 6 hours)
export async function refreshPopularRoutes(): Promise<void> {
  // Get popular routes from database
  // For now, this is a placeholder
  console.log("Refreshing popular shipping routes...");

  // Example: refresh top 100 routes
  const popularRoutes = [
    { fromZip: "06600", toZip: "64000", weight: 1 },
    { fromZip: "01000", toZip: "44100", weight: 2 },
    // ... more popular routes
  ];

  for (const route of popularRoutes) {
    for (const provider of getSupportedProviders()) {
      try {
        await getShippingRate(route.fromZip, route.toZip, route.weight, provider);
      } catch (error) {
        console.error(`Failed to refresh route for ${provider}:`, error);
      }
    }
  }

  console.log(`Refreshed ${popularRoutes.length} popular routes`);
}

// Clear expired cache entries
export function clearExpiredCache(): void {
  const now = Date.now();
  let cleared = 0;

  for (const [key, value] of ratesCache.entries()) {
    if (now > value.expiresAt) {
      ratesCache.delete(key);
      cleared++;
    }
  }

  console.log(`Cleared ${cleared} expired cache entries`);
}

// Get cache statistics
export function getCacheStats(): {
  size: number;
  providers: Record<ShippingProviderType, number>;
} {
  const stats = {
    size: ratesCache.size,
    providers: {} as Record<ShippingProviderType, number>,
  };

  for (const value of ratesCache.values()) {
    stats.providers[value.provider] = (stats.providers[value.provider] || 0) + 1;
  }

  return stats;
}
