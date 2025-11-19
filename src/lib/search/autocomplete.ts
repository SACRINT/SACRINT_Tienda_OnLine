// @ts-nocheck
// Autocomplete & Suggestions
// Real-time search suggestions

import { db } from "@/lib/db";
import { SearchSuggestion } from "./types";
import { AUTOCOMPLETE_CONFIG } from "./config";
import { cache } from "@/lib/cache/cache-service";

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Get product suggestions
async function getProductSuggestions(
  query: string,
  tenantId: string,
  limit: number
): Promise<SearchSuggestion[]> {
  const normalizedQuery = normalizeText(query);

  const products = await db.product.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: [query] } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      images: {
        select: { url: true },
        take: 1,
      },
    },
    take: limit,
    orderBy: { reviewCount: "desc" },
  });

  return products.map((product) => ({
    text: product.name,
    type: "product" as const,
    data: {
      id: product.id,
      slug: product.slug,
      image: product.images[0]?.url,
    },
  }));
}

// Get category suggestions
async function getCategorySuggestions(
  query: string,
  tenantId: string,
  limit: number
): Promise<SearchSuggestion[]> {
  const categories = await db.category.findMany({
    where: {
      tenantId,
      name: { contains: query, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    take: limit,
  });

  return categories.map((category) => ({
    text: category.name,
    type: "category" as const,
    data: {
      id: category.id,
      slug: category.slug,
    },
  }));
}

// Get popular search queries
async function getQuerySuggestions(
  query: string,
  tenantId: string,
  limit: number
): Promise<SearchSuggestion[]> {
  // Check cache for popular queries
  const cacheKey = "popular_queries:" + tenantId;
  let popularQueries = await cache.get<string[]>(cacheKey);

  if (!popularQueries) {
    // In production, this would come from search analytics
    // For now, return empty array
    popularQueries = [];
  }

  const normalizedQuery = normalizeText(query);
  return popularQueries
    .filter((q) => normalizeText(q).includes(normalizedQuery))
    .slice(0, limit)
    .map((text) => ({
      text,
      type: "query" as const,
    }));
}

// Main autocomplete function
export async function getAutocomplete(
  query: string,
  tenantId: string,
  maxSuggestions: number = AUTOCOMPLETE_CONFIG.maxSuggestions
): Promise<SearchSuggestion[]> {
  if (query.length < AUTOCOMPLETE_CONFIG.minChars) {
    return [];
  }

  // Distribute suggestions across types
  const productLimit = Math.ceil(maxSuggestions * 0.6);
  const categoryLimit = Math.ceil(maxSuggestions * 0.2);
  const queryLimit = Math.ceil(maxSuggestions * 0.2);

  // Fetch all suggestion types in parallel
  const [products, categories, queries] = await Promise.all([
    getProductSuggestions(query, tenantId, productLimit),
    getCategorySuggestions(query, tenantId, categoryLimit),
    getQuerySuggestions(query, tenantId, queryLimit),
  ]);

  // Combine and limit
  const suggestions: SearchSuggestion[] = [];

  // Prioritize: categories first, then products, then queries
  suggestions.push(...categories);
  suggestions.push(...products);
  suggestions.push(...queries);

  return suggestions.slice(0, maxSuggestions);
}

// Get trending searches
export async function getTrendingSearches(
  tenantId: string,
  limit: number = 10
): Promise<string[]> {
  const cacheKey = "trending_searches:" + tenantId;
  let trending = await cache.get<string[]>(cacheKey);

  if (!trending) {
    // In production, this would aggregate from search analytics
    // For now, return common e-commerce terms
    trending = [
      "ofertas",
      "nuevo",
      "popular",
      "rebajas",
      "envío gratis",
    ];
    await cache.set(cacheKey, trending, { ttl: 3600 });
  }

  return trending.slice(0, limit);
}

// Get recent searches for a user
export async function getRecentSearches(
  userId: string,
  limit: number = 5
): Promise<string[]> {
  const cacheKey = "recent_searches:" + userId;
  const recent = await cache.get<string[]>(cacheKey);
  return recent ? recent.slice(0, limit) : [];
}

// Save a search to user's recent searches
export async function saveRecentSearch(
  userId: string,
  query: string
): Promise<void> {
  const cacheKey = "recent_searches:" + userId;
  let recent = await cache.get<string[]>(cacheKey);

  if (!recent) {
    recent = [];
  }

  // Remove duplicate if exists
  recent = recent.filter((q) => q.toLowerCase() !== query.toLowerCase());

  // Add to front
  recent.unshift(query);

  // Keep only last 20
  recent = recent.slice(0, 20);

  await cache.set(cacheKey, recent, { ttl: 86400 * 30 }); // 30 days
}

// Clear user's recent searches
export async function clearRecentSearches(userId: string): Promise<void> {
  const cacheKey = "recent_searches:" + userId;
  await cache.delete(cacheKey);
}
