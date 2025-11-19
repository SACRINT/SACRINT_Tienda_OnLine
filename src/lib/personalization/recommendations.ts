// Recommendation Engine
// Product recommendations based on user behavior

export interface UserBehavior {
  userId: string;
  viewedProducts: string[];
  purchasedProducts: string[];
  searchQueries: string[];
  categories: string[];
}

export interface Recommendation {
  productId: string;
  score: number;
  reason: "viewed" | "purchased" | "similar" | "trending" | "personalized";
}

// Get recommendations based on viewing history
export function getViewBasedRecommendations(
  viewedProducts: string[],
  allProducts: Array<{ id: string; categoryId: string; tags: string[] }>,
  limit: number = 8
): Recommendation[] {
  if (viewedProducts.length === 0) return [];

  // Get categories and tags from viewed products
  const viewedProductData = allProducts.filter((p) => viewedProducts.includes(p.id));
  const viewedCategories = new Set(viewedProductData.map((p) => p.categoryId));
  const viewedTags = new Set(viewedProductData.flatMap((p) => p.tags));

  // Score products
  const scores: Map<string, number> = new Map();

  for (const product of allProducts) {
    if (viewedProducts.includes(product.id)) continue;

    let score = 0;

    // Category match
    if (viewedCategories.has(product.categoryId)) {
      score += 3;
    }

    // Tag matches
    for (const tag of product.tags) {
      if (viewedTags.has(tag)) {
        score += 1;
      }
    }

    if (score > 0) {
      scores.set(product.id, score);
    }
  }

  // Sort and return top recommendations
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, score]) => ({
      productId,
      score,
      reason: "similar" as const,
    }));
}

// Get "frequently bought together" recommendations
export function getFrequentlyBoughtTogether(
  productId: string,
  orderHistory: Array<{ items: string[] }>,
  limit: number = 4
): Recommendation[] {
  const coOccurrences: Map<string, number> = new Map();

  for (const order of orderHistory) {
    if (order.items.includes(productId)) {
      for (const item of order.items) {
        if (item !== productId) {
          coOccurrences.set(item, (coOccurrences.get(item) || 0) + 1);
        }
      }
    }
  }

  return Array.from(coOccurrences.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pid, score]) => ({
      productId: pid,
      score,
      reason: "purchased" as const,
    }));
}

// Get trending products
export function getTrendingProducts(
  recentOrders: Array<{ items: string[]; createdAt: Date }>,
  limit: number = 8
): Recommendation[] {
  const productCounts: Map<string, number> = new Map();
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  for (const order of recentOrders) {
    const age = now - order.createdAt.getTime();
    const recency = Math.max(0, 1 - age / weekMs); // Decay over a week

    for (const item of order.items) {
      productCounts.set(item, (productCounts.get(item) || 0) + recency);
    }
  }

  return Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, score]) => ({
      productId,
      score,
      reason: "trending" as const,
    }));
}

// Combine multiple recommendation sources
export function combineRecommendations(
  sources: Recommendation[][],
  limit: number = 12
): Recommendation[] {
  const combined: Map<string, Recommendation> = new Map();

  for (const source of sources) {
    for (const rec of source) {
      const existing = combined.get(rec.productId);
      if (existing) {
        existing.score += rec.score;
      } else {
        combined.set(rec.productId, { ...rec });
      }
    }
  }

  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
