// Product Reviews API
// GET /api/products/[id]/reviews - Get reviews for a product
// POST /api/products/[id]/reviews - Create a review for a product

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getProductById } from '@/lib/db/products'
import {
  getProductReviews,
  createReview,
  hasUserReviewedProduct,
} from '@/lib/db/reviews'
import { ReviewFilterSchema } from '@/lib/security/schemas/review-schemas'
import { z } from 'zod'

/**
 * GET /api/products/[id]/reviews
 * Returns reviews for a product with pagination
 * No authentication required - public endpoint
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 10, max 100)
 * - minRating: number 1-5 (optional filter)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const productId = params.id

    // For public access, we need to get tenant from product first
    // Get a minimal product query to extract tenantId
    const productBasic = await getProductById(session?.user?.tenantId || '', productId).catch(() => null)

    if (!productBasic) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const tenantId = productBasic.tenantId

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url)

    const filters = {
      productId,
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      minRating: searchParams.get('minRating'),
    }

    const validation = ReviewFilterSchema.safeParse(filters)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { page, limit, minRating } = validation.data

    // Get reviews with pagination
    const result = await getProductReviews(tenantId, productId, page, limit)

    // Filter by minRating if provided (client-side for simplicity)
    let filteredReviews = result.reviews
    if (minRating !== undefined) {
      filteredReviews = result.reviews.filter(
        (review: any) => review.rating >= minRating
      )
    }

    return NextResponse.json({
      productId,
      reviews: filteredReviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        user: {
          id: review.user.id,
          name: review.user.name,
          image: review.user.image,
        },
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      pagination: {
        ...result.pagination,
        total: minRating !== undefined ? filteredReviews.length : result.pagination.total,
      },
    })
  } catch (error) {
    console.error('[REVIEWS] GET error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products/[id]/reviews
 * Creates a new review for a product
 * Requires authentication
 *
 * Body:
 * - rating: number 1-5
 * - title: string (3-100 chars)
 * - comment: string (10-500 chars)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in to create a review' },
        { status: 401 }
      )
    }

    const { tenantId } = session.user
    const productId = params.id

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Validate product exists and belongs to tenant
    const product = await getProductById(tenantId, productId)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to your tenant' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await req.json()

    // Create schema for request body (without productId since it comes from URL)
    const CreateReviewBodySchema = z.object({
      rating: z.coerce
        .number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5'),
      title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must not exceed 100 characters')
        .trim(),
      comment: z
        .string()
        .min(10, 'Comment must be at least 10 characters')
        .max(500, 'Comment must not exceed 500 characters')
        .trim(),
    })

    const validation = CreateReviewBodySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { rating, title, comment } = validation.data

    // Check if user has already reviewed this product
    const hasReviewed = await hasUserReviewedProduct(tenantId, productId, session.user.id)

    if (hasReviewed) {
      return NextResponse.json(
        {
          error: 'Conflict - You have already reviewed this product',
          message: 'Each user can only review a product once. Use PATCH to update your existing review.',
        },
        { status: 409 }
      )
    }

    // Create the review
    const review = await createReview(tenantId, {
      productId,
      userId: session.user.id,
      rating,
      title,
      comment,
    })

    console.log(
      `[REVIEWS] Created review ${review.id} for product ${productId} by user ${session.user.id}`
    )

    return NextResponse.json(
      {
        message: 'Review created successfully',
        review: {
          id: review.id,
          productId,
          rating: review.rating,
          title: review.title,
          content: review.content,
          status: review.status,
          user: {
            id: review.user.id,
            name: review.user.name,
            image: review.user.image,
          },
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REVIEWS] POST error:', error)

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('already reviewed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
