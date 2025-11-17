// Advanced Search API
// GET /api/search - Advanced product search with autocomplete and facets

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { searchProducts, getSearchSuggestions, getSearchFacets } from '@/lib/db/search'
import { z } from 'zod'

// Validation schema for search
const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  tags: z.string().optional(),
  sort: z
    .enum(['relevance', 'newest', 'oldest', 'price-asc', 'price-desc', 'name-asc', 'name-desc'])
    .optional()
    .default('relevance'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  facets: z.coerce.boolean().optional().default(false),
})

/**
 * GET /api/search
 * Advanced product search with:
 * - Full-text search with relevance ranking
 * - Faceted search (aggregations)
 * - Autocomplete suggestions
 * - Multi-field search (name, description, SKU, tags)
 *
 * Query params:
 * - q: search query string
 * - categoryId: filter by category
 * - minPrice/maxPrice: price range
 * - inStock: filter by availability
 * - tags: filter by tags
 * - sort: relevance|newest|oldest|price-asc|price-desc|name-asc|name-desc
 * - page: page number (default 1)
 * - limit: items per page (default 20, max 100)
 * - facets: include facet aggregations (default false)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const queryParams = {
      q: searchParams.get('q'),
      categoryId: searchParams.get('categoryId'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      inStock: searchParams.get('inStock'),
      tags: searchParams.get('tags'),
      sort: searchParams.get('sort') || 'relevance',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      facets: searchParams.get('facets') || 'false',
    }

    const validation = SearchQuerySchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { q, categoryId, minPrice, maxPrice, inStock, tags, sort, page, limit, facets } =
      validation.data

    // Perform search
    const searchResults = await searchProducts(tenantId, {
      query: q,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      tags: tags?.split(',').map(t => t.trim()),
      sort,
      page,
      limit,
    })

    // Get facets if requested
    let searchFacets = null
    if (facets && q) {
      searchFacets = await getSearchFacets(tenantId, {
        query: q,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        tags: tags?.split(',').map(t => t.trim()),
      })
    }

    return NextResponse.json({
      query: q || '',
      results: searchResults.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        published: product.published,
        featured: product.featured,
        tags: product.tags,
        category: product.category,
        images: product.images?.slice(0, 2).map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        })),
        reviewCount: product._count?.reviews || 0,
        averageRating: product.averageRating || 0,
      })),
      pagination: searchResults.pagination,
      facets: searchFacets,
      sort,
    })
  } catch (error) {
    console.error('[SEARCH] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
