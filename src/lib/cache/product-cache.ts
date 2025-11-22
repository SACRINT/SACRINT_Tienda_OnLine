/**
 * Product Caching Layer
 * Caches product queries for improved performance
 */

import { cache, CacheKeys } from "./redis";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/monitoring/logger";

// Cache TTLs (in seconds)
const CACHE_TTL = {
  PRODUCT_DETAIL: 60 * 15, // 15 minutes
  PRODUCT_LIST: 60 * 5, // 5 minutes
  PRODUCT_SEARCH: 60 * 10, // 10 minutes
  CATEGORIES: 60 * 30, // 30 minutes
};

/**
 * Get product by ID with caching
 */
export async function getCachedProduct(tenantId: string, productId: string) {
  const cacheKey = CacheKeys.product(productId);

  try {
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Product cache hit: ${productId}`);
      return cached;
    }

    // Cache miss - fetch from database
    logger.debug(`Product cache miss: ${productId}`);
    const product = await db.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          where: {
            stock: { gt: 0 },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (product) {
      await cache.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);
    }

    return product;
  } catch (error) {
    logger.error({ error: error }, "Error in getCachedProduct");
    // Fallback to direct DB query on cache error
    return db.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        variants: true,
        category: true,
      },
    });
  }
}

/**
 * Get product by slug with caching
 */
export async function getCachedProductBySlug(tenantId: string, slug: string) {
  const cacheKey = `product:slug:${tenantId}:${slug}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await db.product.findFirst({
      where: {
        slug,
        tenantId,
        published: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          where: {
            stock: { gt: 0 },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (product) {
      await cache.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);
      // Also cache by ID for consistency
      await cache.set(CacheKeys.product(product.id), product, CACHE_TTL.PRODUCT_DETAIL);
    }

    return product;
  } catch (error) {
    logger.error({ error: error }, "Error in getCachedProductBySlug");
    return db.product.findFirst({
      where: {
        slug,
        tenantId,
        published: true,
      },
      include: {
        images: true,
        variants: true,
        category: true,
      },
    });
  }
}

/**
 * Get paginated products with caching
 */
export async function getCachedProducts(
  tenantId: string,
  page: number = 1,
  limit: number = 20,
  filters?: {
    categoryId?: string;
    published?: boolean;
    search?: string;
  },
) {
  const filterStr = JSON.stringify(filters || {});
  const cacheKey = CacheKeys.products(tenantId, page, filterStr);

  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Products cache hit: page ${page}`);
      return cached;
    }

    logger.debug(`Products cache miss: page ${page}`);

    const where: any = { tenantId };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: {
            take: 1,
            orderBy: { order: "asc" },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    const result = {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, result, CACHE_TTL.PRODUCT_LIST);

    return result;
  } catch (error) {
    logger.error({ error: error }, "Error in getCachedProducts");
    const where: any = { tenantId };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: {
            take: 1,
            orderBy: { order: "asc" },
          },
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

/**
 * Get categories with caching
 */
export async function getCachedCategories(tenantId: string) {
  const cacheKey = CacheKeys.categories(tenantId);

  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await db.category.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            products: {
              where: { published: true },
            },
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    await cache.set(cacheKey, categories, CACHE_TTL.CATEGORIES);

    return categories;
  } catch (error) {
    logger.error({ error: error }, "Error in getCachedCategories");
    return db.category.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { products: true },
        },
        parent: true,
      },
      orderBy: { name: "asc" },
    });
  }
}

/**
 * Invalidate product cache
 */
export async function invalidateProductCache(productId: string) {
  try {
    await cache.del(CacheKeys.product(productId));
    // Also invalidate product lists that might contain this product
    await cache.delPattern("products:*");
    logger.info(`Product cache invalidated: ${productId}`);
  } catch (error) {
    logger.error({ error: error }, "Error invalidating product cache");
  }
}

/**
 * Invalidate all products cache for a tenant
 */
export async function invalidateProductsCache(tenantId: string) {
  try {
    await cache.delPattern(`products:${tenantId}:*`);
    logger.info(`Products cache invalidated for tenant: ${tenantId}`);
  } catch (error) {
    logger.error({ error: error }, "Error invalidating products cache");
  }
}

/**
 * Invalidate category cache
 */
export async function invalidateCategoryCache(tenantId: string) {
  try {
    await cache.del(CacheKeys.categories(tenantId));
    await cache.delPattern(`category:*`);
    logger.info(`Category cache invalidated for tenant: ${tenantId}`);
  } catch (error) {
    logger.error({ error: error }, "Error invalidating category cache");
  }
}
