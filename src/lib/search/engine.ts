// @ts-nocheck
// Search Engine
// Core search functionality with provider abstraction

import { db } from "@/lib/db";
import {
  SearchQuery,
  SearchResult,
  SearchResultProduct,
  SearchFacets,
  SearchableProduct,
} from "./types";
import {
  SEARCH_WEIGHTS,
  DEFAULT_RESULTS_PER_PAGE,
  MAX_RESULTS_PER_PAGE,
  FACET_CONFIG,
} from "./config";

// Normalize text for search
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokenize text into words
function tokenize(text: string): string[] {
  return normalizeText(text).split(" ").filter(Boolean);
}

// Calculate relevance score
function calculateScore(
  product: SearchableProduct,
  queryTokens: string[],
): number {
  let score = 0;

  const nameTokens = tokenize(product.name);
  const descTokens = tokenize(product.description);
  const tagTokens = product.tags.map((t) => normalizeText(t));
  const categoryTokens = tokenize(product.categoryName);

  for (const queryToken of queryTokens) {
    // Exact name match
    if (nameTokens.includes(queryToken)) {
      score += SEARCH_WEIGHTS.name;
    } else if (nameTokens.some((t) => t.includes(queryToken))) {
      score += SEARCH_WEIGHTS.name * 0.5;
    }

    // Description match
    if (descTokens.includes(queryToken)) {
      score += SEARCH_WEIGHTS.description;
    } else if (descTokens.some((t) => t.includes(queryToken))) {
      score += SEARCH_WEIGHTS.description * 0.3;
    }

    // Tag match
    if (tagTokens.includes(queryToken)) {
      score += SEARCH_WEIGHTS.tags;
    } else if (tagTokens.some((t) => t.includes(queryToken))) {
      score += SEARCH_WEIGHTS.tags * 0.5;
    }

    // Category match
    if (categoryTokens.includes(queryToken)) {
      score += SEARCH_WEIGHTS.category;
    }

    // SKU exact match
    if (product.id.toLowerCase().includes(queryToken)) {
      score += SEARCH_WEIGHTS.sku;
    }
  }

  // Boost for exact phrase match in name
  const normalizedQuery = normalizeText(queryTokens.join(" "));
  if (normalizeText(product.name).includes(normalizedQuery)) {
    score *= 1.5;
  }

  // Boost for products on sale
  if (product.salePrice && product.salePrice < product.price) {
    score *= 1.1;
  }

  // Boost for highly rated products
  if (product.rating && product.rating >= 4) {
    score *= 1 + (product.rating - 3) * 0.1;
  }

  return score;
}

// Generate highlights
function generateHighlights(
  text: string,
  queryTokens: string[],
): string | undefined {
  if (!text) return undefined;

  let highlighted = text;
  for (const token of queryTokens) {
    const regex = new RegExp("(" + token + ")", "gi");
    highlighted = highlighted.replace(regex, "<mark>$1</mark>");
  }

  return highlighted !== text ? highlighted : undefined;
}

// Build facets from results
function buildFacets(products: SearchableProduct[]): SearchFacets {
  const categories: Map<string, { label: string; count: number }> = new Map();
  const tags: Map<string, number> = new Map();
  const ratings: Map<number, number> = new Map();

  for (const product of products) {
    // Categories
    const catKey = product.categorySlug;
    const existing = categories.get(catKey);
    if (existing) {
      existing.count++;
    } else {
      categories.set(catKey, { label: product.categoryName, count: 1 });
    }

    // Tags
    for (const tag of product.tags) {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    }

    // Ratings
    if (product.rating) {
      const ratingBucket = Math.floor(product.rating);
      ratings.set(ratingBucket, (ratings.get(ratingBucket) || 0) + 1);
    }
  }

  return {
    categories: Array.from(categories.entries())
      .map(([value, { label, count }]) => ({ value, label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, FACET_CONFIG.maxValues),
    tags: Array.from(tags.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, FACET_CONFIG.maxValues),
    ratings: Array.from(ratings.entries())
      .map(([value, count]) => ({
        value: String(value),
        label: value + "+ estrellas",
        count,
      }))
      .sort((a, b) => Number(b.value) - Number(a.value)),
  };
}

// Main search function
export async function search(searchQuery: SearchQuery): Promise<SearchResult> {
  const startTime = Date.now();
  const {
    query,
    tenantId,
    filters = {},
    facets: requestedFacets,
    sort = { field: "relevance", direction: "desc" },
    page = 1,
    limit = DEFAULT_RESULTS_PER_PAGE,
  } = searchQuery;

  const actualLimit = Math.min(limit, MAX_RESULTS_PER_PAGE);
  const queryTokens = tokenize(query);

  // Build database query
  const where: Record<string, unknown> = {
    tenantId,
    isActive: true,
  };

  // Apply filters
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.inStock) {
    where.stock = { gt: 0 };
  }

  if (filters.onSale) {
    where.salePrice = { not: null };
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.basePrice = {};
    if (filters.priceMin !== undefined) {
      (where.basePrice as Record<string, number>).gte = filters.priceMin;
    }
    if (filters.priceMax !== undefined) {
      (where.basePrice as Record<string, number>).lte = filters.priceMax;
    }
  }

  if (filters.rating) {
    where.avgRating = { gte: filters.rating };
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags };
  }

  // Fetch products from database
  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      tenantId: true,
      name: true,
      slug: true,
      description: true,
      tags: true,
      categoryId: true,
      basePrice: true,
      salePrice: true,
      stock: true,
      avgRating: true,
      reviewCount: true,
      createdAt: true,
      images: {
        select: { url: true },
        take: 1,
      },
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  // Transform to searchable products
  const searchableProducts: SearchableProduct[] = products.map((p) => ({
    id: p.id,
    tenantId: p.tenantId,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    tags: p.tags,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    price: p.basePrice,
    salePrice: p.salePrice || undefined,
    image: p.images[0]?.url,
    stock: p.stock,
    rating: p.avgRating || undefined,
    reviewCount: p.reviewCount,
    createdAt: p.createdAt,
  }));

  // Score and filter products
  let scoredProducts = searchableProducts.map((product) => ({
    product,
    score: calculateScore(product, queryTokens),
  }));

  // Filter out zero-score products if there's a query
  if (queryTokens.length > 0) {
    scoredProducts = scoredProducts.filter((p) => p.score > 0);
  }

  // Sort results
  if (sort.field === "relevance") {
    scoredProducts.sort((a, b) =>
      sort.direction === "desc" ? b.score - a.score : a.score - b.score,
    );
  } else {
    scoredProducts.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case "price":
          comparison =
            (a.product.salePrice || a.product.price) -
            (b.product.salePrice || b.product.price);
          break;
        case "name":
          comparison = a.product.name.localeCompare(b.product.name);
          break;
        case "createdAt":
          comparison =
            a.product.createdAt.getTime() - b.product.createdAt.getTime();
          break;
        case "rating":
          comparison = (a.product.rating || 0) - (b.product.rating || 0);
          break;
        default:
          comparison = b.score - a.score;
      }
      return sort.direction === "desc" ? -comparison : comparison;
    });
  }

  // Build facets before pagination
  const resultFacets = requestedFacets
    ? buildFacets(scoredProducts.map((p) => p.product))
    : undefined;

  // Paginate
  const total = scoredProducts.length;
  const totalPages = Math.ceil(total / actualLimit);
  const start = (page - 1) * actualLimit;
  const paginatedProducts = scoredProducts.slice(start, start + actualLimit);

  // Transform to result format
  const resultProducts: SearchResultProduct[] = paginatedProducts.map(
    ({ product, score }) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      image: product.image,
      categoryName: product.categoryName,
      categorySlug: product.categorySlug,
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.stock > 0,
      score,
      highlights: {
        name: generateHighlights(product.name, queryTokens),
        description: generateHighlights(
          product.description.substring(0, 200),
          queryTokens,
        ),
      },
    }),
  );

  return {
    products: resultProducts,
    total,
    page,
    totalPages,
    facets: resultFacets,
    query,
    took: Date.now() - startTime,
  };
}

// Quick count for a search
export async function searchCount(
  query: string,
  tenantId: string,
): Promise<number> {
  const result = await search({
    query,
    tenantId,
    page: 1,
    limit: 1,
  });
  return result.total;
}
