// Search Analytics
// Track searches, clicks, and conversions

import { cache } from "@/lib/cache/cache-service";
import { logger } from "@/lib/monitoring/logger";
import { SearchAnalytics, SearchFilters } from "./types";
import { ANALYTICS_CONFIG } from "./config";

// Generate unique query ID
function generateQueryId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Track a search query
export async function trackSearch(
  query: string,
  tenantId: string,
  resultsCount: number,
  options: {
    userId?: string;
    sessionId: string;
    filters?: SearchFilters;
  }
): Promise<string> {
  if (!ANALYTICS_CONFIG.trackSearches) {
    return "";
  }

  const queryId = generateQueryId();

  const analytics: SearchAnalytics = {
    queryId,
    query: ANALYTICS_CONFIG.anonymize ? hashQuery(query) : query,
    tenantId,
    userId: options.userId,
    sessionId: options.sessionId,
    resultsCount,
    timestamp: new Date(),
    filters: options.filters,
    clickedProducts: [],
    convertedProducts: [],
  };

  // Store in cache for aggregation
  const cacheKey = "search_analytics:" + queryId;
  await cache.set(cacheKey, analytics, { ttl: 86400 }); // 24 hours

  // Update counters
  await incrementSearchCount(tenantId, query);

  // Log for monitoring
  logger.info("Search tracked", {
    queryId,
    query: analytics.query,
    tenantId,
    resultsCount,
  });

  return queryId;
}

// Track a click on a search result
export async function trackClick(
  queryId: string,
  productId: string,
  position: number
): Promise<void> {
  if (!ANALYTICS_CONFIG.trackClicks) {
    return;
  }

  const cacheKey = "search_analytics:" + queryId;
  const analytics = await cache.get<SearchAnalytics>(cacheKey);

  if (analytics) {
    analytics.clickedProducts = analytics.clickedProducts || [];
    analytics.clickedProducts.push(productId);
    await cache.set(cacheKey, analytics, { ttl: 86400 });

    logger.info("Search click tracked", {
      queryId,
      productId,
      position,
    });
  }
}

// Track a conversion from search
export async function trackConversion(
  queryId: string,
  productId: string
): Promise<void> {
  if (!ANALYTICS_CONFIG.trackConversions) {
    return;
  }

  const cacheKey = "search_analytics:" + queryId;
  const analytics = await cache.get<SearchAnalytics>(cacheKey);

  if (analytics) {
    analytics.convertedProducts = analytics.convertedProducts || [];
    analytics.convertedProducts.push(productId);
    await cache.set(cacheKey, analytics, { ttl: 86400 });

    logger.info("Search conversion tracked", {
      queryId,
      productId,
    });
  }
}

// Increment search count for popularity
async function incrementSearchCount(
  tenantId: string,
  query: string
): Promise<void> {
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = "search_counts:" + tenantId;

  let counts = await cache.get<Record<string, number>>(cacheKey);
  if (!counts) {
    counts = {};
  }

  counts[normalizedQuery] = (counts[normalizedQuery] || 0) + 1;

  await cache.set(cacheKey, counts, { ttl: 86400 * 7 }); // 7 days
}

// Get popular searches
export async function getPopularSearches(
  tenantId: string,
  limit: number = 10
): Promise<Array<{ query: string; count: number }>> {
  const cacheKey = "search_counts:" + tenantId;
  const counts = await cache.get<Record<string, number>>(cacheKey);

  if (!counts) {
    return [];
  }

  return Object.entries(counts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get zero-result searches
export async function getZeroResultSearches(
  tenantId: string,
  limit: number = 20
): Promise<string[]> {
  const cacheKey = "zero_result_searches:" + tenantId;
  const searches = await cache.get<string[]>(cacheKey);
  return searches ? searches.slice(0, limit) : [];
}

// Track zero-result search
export async function trackZeroResults(
  tenantId: string,
  query: string
): Promise<void> {
  const cacheKey = "zero_result_searches:" + tenantId;
  let searches = await cache.get<string[]>(cacheKey);

  if (!searches) {
    searches = [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  if (!searches.includes(normalizedQuery)) {
    searches.push(normalizedQuery);
    // Keep only last 100
    searches = searches.slice(-100);
    await cache.set(cacheKey, searches, { ttl: 86400 * 7 });
  }
}

// Get search metrics for dashboard
export async function getSearchMetrics(
  tenantId: string
): Promise<{
  totalSearches: number;
  uniqueQueries: number;
  avgResultsPerSearch: number;
  clickThroughRate: number;
  conversionRate: number;
}> {
  const cacheKey = "search_metrics:" + tenantId;
  let metrics = await cache.get<{
    totalSearches: number;
    uniqueQueries: number;
    avgResultsPerSearch: number;
    clickThroughRate: number;
    conversionRate: number;
  }>(cacheKey);

  if (!metrics) {
    // Return default metrics
    metrics = {
      totalSearches: 0,
      uniqueQueries: 0,
      avgResultsPerSearch: 0,
      clickThroughRate: 0,
      conversionRate: 0,
    };
  }

  return metrics;
}

// Hash query for anonymization
function hashQuery(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "q_" + Math.abs(hash).toString(36);
}

// Export session search history
export async function getSessionSearches(
  sessionId: string,
  limit: number = 50
): Promise<SearchAnalytics[]> {
  // In production, this would query from persistent storage
  // For now, return empty array
  return [];
}
