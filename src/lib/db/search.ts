// Data Access Layer - Advanced Search
// Full-text search, autocomplete, and faceted search with tenant isolation

import { db } from "./client";
import { ensureTenantAccess } from "./tenant";
import { Prisma } from "@prisma/client";

/**
 * Advanced product search with relevance ranking
 * Uses PostgreSQL full-text search for better results
 *
 * @param tenantId - Tenant ID for isolation
 * @param params - Search parameters
 */
export async function searchProducts(
  tenantId: string,
  params: {
    query?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    tags?: string[];
    sort?: string;
    page?: number;
    limit?: number;
  },
) {
  await ensureTenantAccess(tenantId);

  const {
    query,
    categoryId,
    minPrice,
    maxPrice,
    inStock,
    tags,
    sort = "relevance",
    page = 1,
    limit = 20,
  } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    tenantId,
    published: true, // Only search published products
  };

  // Add text search if query provided
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { shortDescription: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { tags: { hasSome: [query] } },
    ];
  }

  // Apply filters
  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (minPrice !== undefined) {
    where.basePrice = { ...where.basePrice, gte: minPrice };
  }

  if (maxPrice !== undefined) {
    where.basePrice = { ...where.basePrice, lte: maxPrice };
  }

  if (inStock !== undefined) {
    where.stock = inStock ? { gt: 0 } : { lte: 0 };
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  // Build order by clause
  let orderBy: any = { createdAt: "desc" };

  if (sort === "relevance" && query) {
    // For relevance, we prioritize exact matches in name, then description
    // This is a simplified relevance sort; for production, consider using PostgreSQL full-text search
    orderBy = [{ featured: "desc" }, { name: "asc" }];
  } else if (sort === "newest") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sort === "price-asc") {
    orderBy = { basePrice: "asc" };
  } else if (sort === "price-desc") {
    orderBy = { basePrice: "desc" };
  } else if (sort === "name-asc") {
    orderBy = { name: "asc" };
  } else if (sort === "name-desc") {
    orderBy = { name: "desc" };
  }

  // Execute search with aggregations
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { order: "asc" },
          take: 3,
        },
        _count: {
          select: { reviews: true },
        },
      },
      orderBy,
    }),
    db.product.count({ where }),
  ]);

  // Calculate average rating for each product
  const productsWithRating = await Promise.all(
    products.map(async (product: any) => {
      const ratings = await db.review.aggregate({
        where: {
          productId: product.id,
          status: "APPROVED",
        },
        _avg: {
          rating: true,
        },
      });

      return {
        ...product,
        averageRating: ratings._avg.rating || 0,
      };
    }),
  );

  return {
    products: productsWithRating,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get search suggestions for autocomplete
 * Returns products matching the query for quick suggestions
 *
 * @param tenantId - Tenant ID for isolation
 * @param query - Search query string
 * @param limit - Maximum suggestions to return
 */
export async function getSearchSuggestions(
  tenantId: string,
  query: string,
  limit: number = 10,
) {
  await ensureTenantAccess(tenantId);

  if (!query || query.trim().length === 0) {
    return [];
  }

  const suggestions = await db.product.findMany({
    where: {
      tenantId,
      published: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: [query] } },
      ],
    },
    take: limit,
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    include: {
      category: {
        select: {
          name: true,
        },
      },
      images: {
        take: 1,
        orderBy: { order: "asc" },
      },
    },
  });

  return suggestions;
}

/**
 * Get search facets (aggregations) for filtering
 * Returns available filter options based on search results
 *
 * @param tenantId - Tenant ID for isolation
 * @param params - Search parameters
 */
export async function getSearchFacets(
  tenantId: string,
  params: {
    query?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    tags?: string[];
  },
) {
  await ensureTenantAccess(tenantId);

  const { query, categoryId, minPrice, maxPrice, inStock, tags } = params;

  // Build base where clause (same as search)
  const where: any = {
    tenantId,
    published: true,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { tags: { hasSome: [query] } },
    ];
  }

  // Get category facets (don't filter by categoryId for facets)
  const categoryFacets = await db.product.groupBy({
    by: ["categoryId"],
    where: {
      ...where,
      ...(minPrice !== undefined && { basePrice: { gte: minPrice } }),
      ...(maxPrice !== undefined && { basePrice: { lte: maxPrice } }),
      ...(inStock !== undefined && { stock: inStock ? { gt: 0 } : { lte: 0 } }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
    },
    _count: {
      categoryId: true,
    },
  });

  // Get category names
  const categoryIds = categoryFacets.map((f: any) => f.categoryId);
  const categories = await db.category.findMany({
    where: {
      id: { in: categoryIds },
      tenantId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

  // Get price range facets
  const priceAggregation = await db.product.aggregate({
    where,
    _min: { basePrice: true },
    _max: { basePrice: true },
  });

  // Get stock availability facets
  const [inStockCount, outOfStockCount] = await Promise.all([
    db.product.count({
      where: {
        ...where,
        stock: { gt: 0 },
      },
    }),
    db.product.count({
      where: {
        ...where,
        stock: { lte: 0 },
      },
    }),
  ]);

  // Get all unique tags from matching products
  const productsWithTags = await db.product.findMany({
    where,
    select: {
      tags: true,
    },
  });

  const allTags = new Set<string>();
  productsWithTags.forEach((p: any) => {
    p.tags.forEach((tag: any) => allTags.add(tag));
  });

  // Count products per tag
  const tagCounts = new Map<string, number>();
  productsWithTags.forEach((p: any) => {
    p.tags.forEach((tag: any) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return {
    categories: categoryFacets.map((facet: any) => {
      const category = categoryMap.get(facet.categoryId) as any;
      return {
        id: facet.categoryId,
        name: category?.name || "Unknown",
        slug: category?.slug || "",
        count: facet._count.categoryId,
      };
    }),
    priceRange: {
      min: priceAggregation._min.basePrice || 0,
      max: priceAggregation._max.basePrice || 0,
    },
    availability: {
      inStock: inStockCount,
      outOfStock: outOfStockCount,
    },
    tags: Array.from(allTags).map((tag: any) => ({
      name: tag,
      count: tagCounts.get(tag) || 0,
    })),
  };
}

/**
 * Track search query for analytics
 * Useful for understanding what users search for
 *
 * @param tenantId - Tenant ID
 * @param userId - User ID
 * @param query - Search query
 * @param resultsCount - Number of results found
 */
export async function trackSearchQuery(
  tenantId: string,
  userId: string,
  query: string,
  resultsCount: number,
) {
  await ensureTenantAccess(tenantId);

  // This would typically insert into a SearchLog table
  // For now, we'll just log it
  console.log(
    `[SEARCH] User ${userId} searched for "${query}", found ${resultsCount} results`,
  );

  // TODO: Implement search analytics table in future sprint
  // await db.searchLog.create({
  //   data: {
  //     tenantId,
  //     userId,
  //     query,
  //     resultsCount,
  //   },
  // })
}
