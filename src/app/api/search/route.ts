/**
 * Advanced Search API
 * GET - Search products with advanced filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, trackSearch } from '@/lib/search/search-service'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().optional(),
  tenantId: z.string().cuid(),
  categoryId: z.string().cuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'rating']).optional(),
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(100).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const params = {
      q: searchParams.get('q') || undefined,
      tenantId: searchParams.get('tenantId')!,
      categoryId: searchParams.get('categoryId') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      minRating: searchParams.get('minRating') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    }

    const data = searchSchema.parse(params)

    const result = await searchProducts({
      query: data.q,
      tenantId: data.tenantId,
      categoryId: data.categoryId,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      minRating: data.minRating,
      inStock: data.inStock,
      sortBy: data.sortBy,
      page: data.page,
      limit: data.limit,
    })

    // Track search for analytics
    if (data.q) {
      await trackSearch(data.q, data.tenantId, result.total)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 })
    }
    console.error('[Search API] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
