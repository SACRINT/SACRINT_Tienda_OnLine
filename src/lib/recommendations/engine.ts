/**
 * Product Recommendations Engine
 * Provides personalized product recommendations using multiple strategies:
 * - Collaborative Filtering (users who bought this also bought...)
 * - Content-Based (similar products)
 * - Trending products
 * - Personalized based on user history
 */

import { db } from "@/lib/db/client";
import { logger } from "@/lib/monitoring/logger";
import { cache } from "@/lib/cache/redis";

export interface RecommendationStrategy {
  name: string;
  weight: number;
}

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  imageUrl: string | null;
  score: number;
  reason?: string;
}

/**
 * Get "frequently bought together" recommendations
 * Based on order history
 */
export async function getFrequentlyBoughtTogether(
  tenantId: string,
  productId: string,
  limit: number = 6,
): Promise<RecommendedProduct[]> {
  const cacheKey = `recommendations:fbt:${tenantId}:${productId}`;
  const cached = await cache.get<RecommendedProduct[]>(cacheKey);

  if (cached) {
    logger.cache("hit", cacheKey);
    return cached;
  }

  logger.cache("miss", cacheKey);

  try {
    // Find orders that contain this product
    const ordersWithProduct = await db.orderItem.findMany({
      where: {
        productId,
        order: {
          tenantId,
          status: "PROCESSING",
        },
      },
      select: {
        orderId: true,
      },
      take: 1000, // Limit to recent orders
    });

    const orderIds = ordersWithProduct.map((item: any) => item.orderId);

    if (orderIds.length === 0) {
      return [];
    }

    // Find other products in those orders
    const coOccurrences = await db.orderItem.groupBy({
      by: ["productId"],
      where: {
        orderId: { in: orderIds },
        productId: { not: productId },
        product: {
          published: true,
          stock: { gt: 0 },
        },
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: "desc",
        },
      },
      take: limit * 2, // Get extra to filter out unavailable
    });

    // Get product details
    const productIds = coOccurrences.map((item: any) => item.productId);
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        published: true,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        images: {
          select: { url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      take: limit,
    });

    const countMap = new Map(
      coOccurrences.map((item: any) => [item.productId, item._count.productId]),
    );

    const recommendations: RecommendedProduct[] = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: Number(p.basePrice),
      imageUrl: p.images[0]?.url || null,
      score: Number(countMap.get(p.id) || 0) / orderIds.length,
      reason: "Comprado frecuentemente juntos",
    }));

    // Cache for 1 hour
    await cache.set(cacheKey, recommendations, 3600);

    return recommendations;
  } catch (error) {
    logger.error("Failed to get frequently bought together", error as Error, {
      tenantId,
      productId,
    });
    return [];
  }
}

/**
 * Get similar products based on category and attributes
 */
export async function getSimilarProducts(
  tenantId: string,
  productId: string,
  limit: number = 6,
): Promise<RecommendedProduct[]> {
  const cacheKey = `recommendations:similar:${tenantId}:${productId}`;
  const cached = await cache.get<RecommendedProduct[]>(cacheKey);

  if (cached) {
    logger.cache("hit", cacheKey);
    return cached;
  }

  logger.cache("miss", cacheKey);

  try {
    // Get source product
    const sourceProduct = await db.product.findUnique({
      where: { id: productId, tenantId },
      select: {
        categoryId: true,
        basePrice: true,
        name: true,
      },
    });

    if (!sourceProduct) {
      return [];
    }

    // Find similar products in same category
    const similar = await db.product.findMany({
      where: {
        tenantId,
        id: { not: productId },
        categoryId: sourceProduct.categoryId,
        published: true,
        stock: { gt: 0 },
        // Price range: ±30%
        basePrice: {
          gte: Number(sourceProduct.basePrice) * 0.7,
          lte: Number(sourceProduct.basePrice) * 1.3,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        images: {
          select: { url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      take: limit,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    // Calculate similarity scores based on price and name
    const recommendations: RecommendedProduct[] = similar.map((p: any) => {
      const priceDiff = Math.abs(Number(p.basePrice) - Number(sourceProduct.basePrice));
      const priceScore = 1 - priceDiff / Number(sourceProduct.basePrice);

      // Simple name similarity (shared words)
      const sourceWords = new Set(sourceProduct.name.toLowerCase().split(/\s+/));
      const targetWords = p.name.toLowerCase().split(/\s+/);
      const commonWords = targetWords.filter((w: string) => sourceWords.has(w)).length;
      const nameScore = commonWords / sourceWords.size;

      const score = priceScore * 0.3 + nameScore * 0.7;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: Number(p.basePrice),
        imageUrl: p.images[0]?.url || null,
        score,
        reason: "Producto similar",
      };
    });

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Cache for 2 hours
    await cache.set(cacheKey, recommendations, 7200);

    return recommendations;
  } catch (error) {
    logger.error("Failed to get similar products", error as Error, {
      tenantId,
      productId,
    });
    return [];
  }
}

/**
 * Get trending/popular products
 */
export async function getTrendingProducts(
  tenantId: string,
  limit: number = 12,
): Promise<RecommendedProduct[]> {
  const cacheKey = `recommendations:trending:${tenantId}`;
  const cached = await cache.get<RecommendedProduct[]>(cacheKey);

  if (cached) {
    logger.cache("hit", cacheKey);
    return cached;
  }

  logger.cache("miss", cacheKey);

  try {
    // Get products with most orders in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await db.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          tenantId,
          status: "PROCESSING",
          createdAt: { gte: thirtyDaysAgo },
        },
        product: {
          published: true,
          stock: { gt: 0 },
        },
      },
      _count: {
        productId: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          productId: "desc",
        },
      },
      take: limit * 2,
    });

    // Get product details
    const productIds = trending.map((item: any) => item.productId);
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        published: true,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        images: {
          select: { url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      take: limit,
    });

    const countMap = new Map(trending.map((item: any) => [item.productId, item._count.productId]));

    const totalOrders = trending.reduce((sum: number, item: any) => sum + item._count.productId, 0);

    const recommendations: RecommendedProduct[] = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: Number(p.basePrice),
      imageUrl: p.images[0]?.url || null,
      score: Number(countMap.get(p.id) || 0) / totalOrders,
      reason: "Producto popular",
    }));

    // Cache for 1 hour
    await cache.set(cacheKey, recommendations, 3600);

    return recommendations;
  } catch (error) {
    logger.error("Failed to get trending products", error as Error, {
      tenantId,
    });
    return [];
  }
}

/**
 * Get personalized recommendations for a user
 */
export async function getPersonalizedRecommendations(
  tenantId: string,
  userId: string,
  limit: number = 12,
): Promise<RecommendedProduct[]> {
  const cacheKey = `recommendations:personalized:${tenantId}:${userId}`;
  const cached = await cache.get<RecommendedProduct[]>(cacheKey);

  if (cached) {
    logger.cache("hit", cacheKey);
    return cached;
  }

  logger.cache("miss", cacheKey);

  try {
    // Get user's order history
    const userOrders = await db.order.findMany({
      where: {
        userId,
        tenantId,
        status: "PROCESSING",
      },
      include: {
        items: {
          select: {
            productId: true,
            product: {
              select: {
                categoryId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Last 20 orders
    });

    if (userOrders.length === 0) {
      // No history, return trending products
      return getTrendingProducts(tenantId, limit);
    }

    // Extract purchased product IDs and categories
    const purchasedProductIds = new Set<string>();
    const categoryFrequency = new Map<string, number>();

    for (const order of userOrders) {
      for (const item of order.items) {
        purchasedProductIds.add(item.productId);

        const categoryId = item.product.categoryId;
        if (categoryId) {
          categoryFrequency.set(categoryId, (categoryFrequency.get(categoryId) || 0) + 1);
        }
      }
    }

    // Get top categories
    const topCategories = Array.from(categoryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId]) => categoryId);

    // Find products in user's favorite categories that they haven't bought
    const recommendations = await db.product.findMany({
      where: {
        tenantId,
        categoryId: { in: topCategories },
        id: { notIn: Array.from(purchasedProductIds) },
        published: true,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        featured: true,
        categoryId: true,
        images: {
          select: { url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      take: limit * 2,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    // Score based on category preference
    const result: RecommendedProduct[] = recommendations.map((p: any) => {
      const categoryScore = (categoryFrequency.get(p.categoryId || "") || 0) / userOrders.length;
      const featuredBonus = p.featured ? 0.2 : 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: Number(p.basePrice),
        imageUrl: p.images[0]?.url || null,
        score: categoryScore + featuredBonus,
        reason: "Recomendado para ti",
      };
    });

    // Sort by score and limit
    result.sort((a, b) => b.score - a.score);
    const limited = result.slice(0, limit);

    // Cache for 30 minutes
    await cache.set(cacheKey, limited, 1800);

    return limited;
  } catch (error) {
    logger.error("Failed to get personalized recommendations", error as Error, {
      tenantId,
      userId,
    });
    return [];
  }
}

/**
 * Get combined recommendations using multiple strategies
 */
export async function getCombinedRecommendations(
  tenantId: string,
  options: {
    userId?: string;
    productId?: string;
    limit?: number;
    strategies?: Array<{
      type: "fbt" | "similar" | "trending" | "personalized";
      weight: number;
    }>;
  },
): Promise<RecommendedProduct[]> {
  const {
    userId,
    productId,
    limit = 12,
    strategies = [
      { type: "fbt", weight: 0.3 },
      { type: "similar", weight: 0.3 },
      { type: "personalized", weight: 0.2 },
      { type: "trending", weight: 0.2 },
    ],
  } = options;

  try {
    const allRecommendations = new Map<string, RecommendedProduct>();

    // Get recommendations from each strategy
    for (const strategy of strategies) {
      let results: RecommendedProduct[] = [];

      switch (strategy.type) {
        case "fbt":
          if (productId) {
            results = await getFrequentlyBoughtTogether(tenantId, productId, limit);
          }
          break;

        case "similar":
          if (productId) {
            results = await getSimilarProducts(tenantId, productId, limit);
          }
          break;

        case "personalized":
          if (userId) {
            results = await getPersonalizedRecommendations(tenantId, userId, limit);
          }
          break;

        case "trending":
          results = await getTrendingProducts(tenantId, limit);
          break;
      }

      // Merge results with weighted scores
      for (const product of results) {
        const existing = allRecommendations.get(product.id);
        if (existing) {
          existing.score += product.score * strategy.weight;
        } else {
          allRecommendations.set(product.id, {
            ...product,
            score: product.score * strategy.weight,
          });
        }
      }
    }

    // Convert to array, sort by score, and limit
    const finalRecommendations = Array.from(allRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    logger.info(
      {
        tenantId,
        userId,
        productId,
        count: finalRecommendations.length,
      },
      "Combined recommendations generated",
    );

    return finalRecommendations;
  } catch (error) {
    logger.error("Failed to get combined recommendations", error as Error, {
      tenantId,
      userId,
      productId,
    });
    return [];
  }
}
