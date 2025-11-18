/**
 * Advanced Search Service
 * Week 17-18: Advanced Search & Filters Implementation
 *
 * Features:
 * - Full-text search with PostgreSQL
 * - Advanced filters (price, category, rating, availability)
 * - Sorting options
 * - Pagination
 * - Search suggestions/autocomplete
 * - Search analytics
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface SearchOptions {
  query?: string
  tenantId: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating'
  page?: number
  limit?: number
}

export interface SearchResult {
  products: any[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
  filters: {
    categories: { id: string; name: string; count: number }[]
    priceRanges: { min: number; max: number; count: number }[]
    avgPrice: number
    maxPrice: number
    minPrice: number
  }
}

/**
 * Advanced product search
 */
export async function searchProducts(options: SearchOptions): Promise<SearchResult> {
  const {
    query,
    tenantId,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    sortBy = 'relevance',
    page = 1,
    limit = 20,
  } = options

  // Build where clause
  const where: any = {
    tenantId,
    status: 'PUBLISHED',
    deletedAt: null,
  }

  // Full-text search
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { sku: { contains: query, mode: 'insensitive' } },
    ]
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) where.price.gte = minPrice
    if (maxPrice !== undefined) where.price.lte = maxPrice
  }

  // Stock filter
  if (inStock) {
    where.stock = { gt: 0 }
  }

  // Rating filter (calculated from reviews)
  // Note: This would require a computed field or separate query

  // Build orderBy clause
  const orderBy = getOrderByClause(sortBy)

  // Execute search with pagination
  const skip = (page - 1) * limit

  const [products, total, categories, stats] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { take: 1, orderBy: { order: 'asc' } },
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
    // Get category aggregations
    db.product.groupBy({
      by: ['categoryId'],
      where: { ...where, categoryId: { not: null } },
      _count: true,
    }),
    // Get price statistics
    db.product.aggregate({
      where,
      _avg: { price: true },
      _max: { price: true },
      _min: { price: true },
    }),
  ])

  // Get category names
  const categoryIds = categories.map((c: any) => c.categoryId).filter(Boolean) as string[]
  const categoryDetails = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })

  const categoryMap = new Map(categoryDetails.map((c: any) => [c.id, c.name]))

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
    filters: {
      categories: categories.map((c: any) => ({
        id: c.categoryId!,
        name: categoryMap.get(c.categoryId!) || 'Unknown',
        count: c._count,
      })),
      priceRanges: generatePriceRanges(stats._min.price || 0, stats._max.price || 0),
      avgPrice: stats._avg.price || 0,
      maxPrice: stats._max.price || 0,
      minPrice: stats._min.price || 0,
    },
  }
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(query: string, tenantId: string, limit = 5) {
  const products = await db.product.findMany({
    where: {
      tenantId,
      status: 'PUBLISHED',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: {
        take: 1,
        orderBy: { order: 'asc' },
        select: { url: true },
      },
    },
    take: limit,
  })

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    image: p.images[0]?.url,
  }))
}

/**
 * Track search query for analytics
 */
export async function trackSearch(query: string, tenantId: string, resultsCount: number) {
  // TODO: Implement search analytics
  // Could be stored in a SearchAnalytics table for tracking popular searches
  console.log(`[Search Analytics] Query: "${query}", Results: ${resultsCount}, Tenant: ${tenantId}`)
}

/**
 * Get popular search terms
 */
export async function getPopularSearches(tenantId: string, limit = 10) {
  // TODO: Implement based on search analytics
  // For now, return empty array
  return []
}

// Helper functions

function getOrderByClause(sortBy: string): any {
  switch (sortBy) {
    case 'price_asc':
      return { price: 'asc' }
    case 'price_desc':
      return { price: 'desc' }
    case 'newest':
      return { createdAt: 'desc' }
    case 'rating':
      // This would require a computed field
      return { createdAt: 'desc' }
    case 'relevance':
    default:
      return { name: 'asc' }
  }
}

function generatePriceRanges(min: number, max: number) {
  if (max === 0) return []

  const ranges = []
  const step = Math.ceil((max - min) / 5) // 5 price ranges

  for (let i = 0; i < 5; i++) {
    const rangeMin = min + step * i
    const rangeMax = i === 4 ? max : min + step * (i + 1)

    ranges.push({
      min: rangeMin,
      max: rangeMax,
      count: 0, // Would need separate query to count
    })
  }

  return ranges
}
