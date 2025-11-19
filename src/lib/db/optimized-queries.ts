// @ts-nocheck
// Optimized Database Queries
// High-performance queries with caching and efficient selects

import { db } from "./client";
import {
  cache,
  cacheKeys,
  cacheTags,
  CACHE_TTL,
} from "@/lib/cache/cache-service";
import {
  OPTIMIZED_SELECTS,
  getPaginationArgs,
  createPaginatedResult,
  type PaginationParams,
  logQueryTime,
} from "./optimization";
import type { Prisma } from "@prisma/client";

// Types
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

export interface ProductSortOptions {
  field: "createdAt" | "basePrice" | "name";
  order: "asc" | "desc";
}

// Get products with caching and optimization
export async function getOptimizedProducts(
  tenantId: string,
  filters: ProductFilters = {},
  sort: ProductSortOptions = { field: "createdAt", order: "desc" },
  pagination: PaginationParams = {}
) {
  const start = performance.now();

  // Build cache key
  const cacheKey = `products:${tenantId}:${JSON.stringify({ filters, sort, pagination })}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    logQueryTime("getProducts (cached)", performance.now() - start);
    return cached;
  }

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    tenantId,
    published: true,
  };

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.basePrice = {};
    if (filters.minPrice !== undefined) {
      where.basePrice.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.basePrice.lte = filters.maxPrice;
    }
  }

  if (filters.inStock) {
    where.stock = { gt: 0 };
  }

  if (filters.featured) {
    where.featured = true;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Get pagination args
  const { skip, take, page, limit } = getPaginationArgs(pagination);

  // Execute query
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: OPTIMIZED_SELECTS.productList,
      orderBy: { [sort.field]: sort.order },
      skip,
      take,
    }),
    db.product.count({ where }),
  ]);

  const result = createPaginatedResult(products, total, page, limit);

  // Cache result
  await cache.set(cacheKey, result, {
    ttl: CACHE_TTL.MEDIUM,
    tags: [cacheTags.products(tenantId)],
  });

  logQueryTime("getProducts (query)", performance.now() - start);
  return result;
}

// Get single product with caching
export async function getOptimizedProduct(id: string, tenantId: string) {
  const start = performance.now();

  const cacheKey = cacheKeys.product(id);
  const cached = await cache.get(cacheKey);

  if (cached) {
    logQueryTime("getProduct (cached)", performance.now() - start);
    return cached;
  }

  const product = await db.product.findFirst({
    where: { id, tenantId, published: true },
    select: OPTIMIZED_SELECTS.productDetail,
  });

  if (product) {
    await cache.set(cacheKey, product, {
      ttl: CACHE_TTL.LONG,
      tags: [cacheTags.products(tenantId)],
    });
  }

  logQueryTime("getProduct (query)", performance.now() - start);
  return product;
}

// Get featured products with caching
export async function getFeaturedProducts(tenantId: string, limit: number = 8) {
  const start = performance.now();

  const cacheKey = cacheKeys.featuredProducts(tenantId);
  const cached = await cache.get(cacheKey);

  if (cached) {
    logQueryTime("getFeaturedProducts (cached)", performance.now() - start);
    return cached;
  }

  const products = await db.product.findMany({
    where: {
      tenantId,
      published: true,
      featured: true,
      stock: { gt: 0 },
    },
    select: OPTIMIZED_SELECTS.productList,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  await cache.set(cacheKey, products, {
    ttl: CACHE_TTL.MEDIUM,
    tags: [cacheTags.products(tenantId)],
  });

  logQueryTime("getFeaturedProducts (query)", performance.now() - start);
  return products;
}

// Get categories with tree structure
export async function getOptimizedCategories(tenantId: string) {
  const start = performance.now();

  const cacheKey = cacheKeys.categoryTree(tenantId);
  const cached = await cache.get(cacheKey);

  if (cached) {
    logQueryTime("getCategories (cached)", performance.now() - start);
    return cached;
  }

  const categories = await db.category.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      parentId: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Build tree structure
  const categoryMap = new Map(categories.map((c) => [c.id, { ...c, children: [] as typeof categories }]));
  const tree: typeof categories = [];

  for (const category of categoryMap.values()) {
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        (parent as { children: typeof categories }).children.push(category);
      }
    } else {
      tree.push(category);
    }
  }

  await cache.set(cacheKey, tree, {
    ttl: CACHE_TTL.HOUR,
    tags: [cacheTags.categories(tenantId)],
  });

  logQueryTime("getCategories (query)", performance.now() - start);
  return tree;
}

// Get dashboard stats with caching
export async function getDashboardStats(tenantId: string) {
  const start = performance.now();

  const cacheKey = cacheKeys.dashboardStats(tenantId);
  const cached = await cache.get(cacheKey);

  if (cached) {
    logQueryTime("getDashboardStats (cached)", performance.now() - start);
    return cached;
  }

  // Run all queries in parallel
  const [
    productCount,
    orderCount,
    customerCount,
    recentOrders,
    revenue,
  ] = await Promise.all([
    db.product.count({ where: { tenantId, published: true } }),
    db.order.count({ where: { tenantId } }),
    db.user.count({ where: { tenantId, role: "CUSTOMER" } }),
    db.order.findMany({
      where: { tenantId },
      select: OPTIMIZED_SELECTS.orderList,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.order.aggregate({
      where: { tenantId, status: "DELIVERED" },
      _sum: { total: true },
    }),
  ]);

  const stats = {
    productCount,
    orderCount,
    customerCount,
    recentOrders,
    totalRevenue: revenue._sum.total || 0,
  };

  await cache.set(cacheKey, stats, {
    ttl: CACHE_TTL.MEDIUM,
    tags: [cacheTags.orders(tenantId), cacheTags.products(tenantId)],
  });

  logQueryTime("getDashboardStats (query)", performance.now() - start);
  return stats;
}

// Search products with optimization
export async function searchProducts(
  tenantId: string,
  query: string,
  limit: number = 20
) {
  const start = performance.now();

  if (!query.trim()) return [];

  const cacheKey = cacheKeys.searchResults(tenantId, query.toLowerCase());
  const cached = await cache.get(cacheKey);

  if (cached) {
    logQueryTime("searchProducts (cached)", performance.now() - start);
    return cached;
  }

  const products = await db.product.findMany({
    where: {
      tenantId,
      published: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { tags: { has: query.toLowerCase() } },
      ],
    },
    select: OPTIMIZED_SELECTS.productList,
    orderBy: [
      // Prioritize name matches
      { name: "asc" },
    ],
    take: limit,
  });

  await cache.set(cacheKey, products, {
    ttl: CACHE_TTL.SHORT,
    tags: [cacheTags.products(tenantId)],
  });

  logQueryTime("searchProducts (query)", performance.now() - start);
  return products;
}

// Get related products
export async function getRelatedProducts(
  productId: string,
  tenantId: string,
  limit: number = 4
) {
  const start = performance.now();

  // Get current product's category
  const product = await db.product.findFirst({
    where: { id: productId, tenantId },
    select: { categoryId: true, tags: true },
  });

  if (!product) return [];

  // Find products in same category or with matching tags
  const related = await db.product.findMany({
    where: {
      tenantId,
      published: true,
      id: { not: productId },
      OR: [
        { categoryId: product.categoryId },
        { tags: { hasSome: product.tags } },
      ],
    },
    select: OPTIMIZED_SELECTS.productList,
    take: limit,
  });

  logQueryTime("getRelatedProducts (query)", performance.now() - start);
  return related;
}
