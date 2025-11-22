// Advanced Search Engine
// Week 17-18: Full-text search with filters and analytics

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface SearchFilters {
  query?: string; // Full-text search query
  categoryId?: string; // Filter by category
  categorySlug?: string; // Alternative to categoryId
  minPrice?: number; // Price range min
  maxPrice?: number; // Price range max
  minRating?: number; // Minimum average rating
  inStock?: boolean; // Only in-stock items
  featured?: boolean; // Only featured products
  sortBy?:
    | "relevance" // Default: search relevance
    | "price-asc" // Price low to high
    | "price-desc" // Price high to low
    | "rating" // Highest rated
    | "newest" // Newest first
    | "popular"; // Most sold
  page?: number;
  limit?: number;
  tenantId?: string; // Multi-tenant support
}

export interface SearchResult {
  products: Array<{
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    price: number;
    salePrice: number | null;
    images: string[];
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    averageRating?: number;
    reviewCount?: number;
    category: {
      id: string;
      name: string;
      slug: string | null;
    } | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  facets: {
    categories: Array<{ id: string; name: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
  };
  query: string;
  resultsFound: boolean;
}

/**
 * Main search function with filters and facets
 */
export async function searchProducts(filters: SearchFilters): Promise<SearchResult> {
  const {
    query = "",
    categoryId,
    categorySlug,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    featured,
    sortBy = "relevance",
    page = 1,
    limit = 24,
    tenantId,
  } = filters;

  // Build WHERE clause
  const where: Prisma.ProductWhereInput = {
    published: true,
  };

  // Tenant isolation
  if (tenantId) {
    where.tenantId = tenantId;
  }

  // Full-text search
  if (query.trim()) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
    ];
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  } else if (categorySlug) {
    where.category = {
      slug: categorySlug,
    };
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    (where as any).basePrice = {};
    if (minPrice !== undefined) {
      (where as any).basePrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      (where as any).basePrice.lte = maxPrice;
    }
  }

  // Stock filter
  if (inStock) {
    where.stock = { gt: 0 };
  }

  // Featured filter
  if (featured) {
    where.featured = true;
  }

  // Build ORDER BY clause
  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
    [];

  switch (sortBy) {
    case "price-asc":
      orderBy = { basePrice: "asc" };
      break;
    case "price-desc":
      orderBy = { basePrice: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "rating":
      // Note: This requires pre-calculated averageRating field
      // For now, we'll sort by review count as proxy
      orderBy = [{ reviews: { _count: "desc" } }, { createdAt: "desc" }];
      break;
    case "popular":
      // Sort by order count (requires OrderItem relation)
      orderBy = [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }];
      break;
    case "relevance":
    default:
      // For relevance, prioritize exact matches, then featured, then newest
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
      break;
  }

  // Execute search with pagination
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: {
            rating: true,
          },
        },
        images: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  // Calculate average ratings
  const productsWithRating = products.map((product) => {
    const reviews = product.reviews || [];
    const avgRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images.map((img) => img.url),
      stock: product.stock,
      isActive: product.published,
      isFeatured: product.featured,
      averageRating: Number(avgRating.toFixed(1)),
      reviewCount: reviews.length,
      category: product.category,
    };
  });

  // Filter by minimum rating if specified
  const filteredProducts = minRating
    ? productsWithRating.filter((p) => (p.averageRating || 0) >= minRating)
    : productsWithRating;

  // Generate facets for filtering UI
  const facets = await generateFacets(where, tenantId);

  return {
    products: filteredProducts,
    pagination: {
      page,
      limit,
      total: minRating ? filteredProducts.length : total,
      pages: Math.ceil((minRating ? filteredProducts.length : total) / limit),
    },
    facets,
    query,
    resultsFound: filteredProducts.length > 0,
  };
}

/**
 * Generate facets for filter UI
 */
async function generateFacets(baseWhere: Prisma.ProductWhereInput, tenantId?: string) {
  const where = { ...baseWhere };
  if (tenantId) {
    where.tenantId = tenantId;
  }

  // Get category distribution
  const categoryGroups = await db.product.groupBy({
    by: ["categoryId"],
    where,
    _count: true,
  });

  const categoryIds = categoryGroups
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);

  const categories =
    categoryIds.length > 0
      ? await db.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

  const categoriesWithCount = categoryGroups
    .map((group) => {
      const category = categories.find((c) => c.id === group.categoryId);
      return category
        ? {
            id: category.id,
            name: category.name,
            count: group._count,
          }
        : null;
    })
    .filter((c): c is { id: string; name: string; count: number } => c !== null);

  // Get price ranges (predefined buckets)
  const priceRanges = [
    { min: 0, max: 100 },
    { min: 100, max: 500 },
    { min: 500, max: 1000 },
    { min: 1000, max: 5000 },
    { min: 5000, max: 999999 },
  ];

  const priceRangesWithCount = await Promise.all(
    priceRanges.map(async (range) => {
      const count = await db.product.count({
        where: {
          ...where,
          basePrice: {
            gte: range.min,
            lte: range.max,
          },
        },
      });
      return { ...range, count };
    }),
  );

  // Get rating distribution
  const ratings = [5, 4, 3, 2, 1];
  const ratingsWithCount = ratings.map((rating) => ({
    rating,
    count: 0, // Will be calculated from reviews
  }));

  return {
    categories: categoriesWithCount,
    priceRanges: priceRangesWithCount.filter((r) => r.count > 0),
    ratings: ratingsWithCount,
  };
}

/**
 * Get search suggestions/autocomplete
 */
export async function getSearchSuggestions(
  query: string,
  tenantId?: string,
  limit = 5,
): Promise<string[]> {
  if (!query.trim()) return [];

  const where: Prisma.ProductWhereInput = {
    published: true,
    name: {
      contains: query,
      mode: "insensitive",
    },
  };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  const products = await db.product.findMany({
    where,
    select: { name: true },
    take: limit,
    orderBy: { name: "asc" },
  });

  return products.map((p) => p.name);
}

/**
 * Log search query for analytics
 */
export async function logSearchQuery(
  query: string,
  resultsCount: number,
  tenantId?: string,
  userId?: string,
) {
  // In a real implementation, you would log to a SearchAnalytics table
  // For now, we'll just console log
  console.log("Search:", {
    query,
    resultsCount,
    tenantId,
    userId,
    timestamp: new Date(),
  });

  // TODO: Implement search analytics table
  // await db.searchAnalytics.create({
  //   data: {
  //     query,
  //     resultsCount,
  //     tenantId,
  //     userId,
  //   },
  // });
}
