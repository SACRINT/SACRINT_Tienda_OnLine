// Reviews Data Access Layer
// CRUD and validation functions for product reviews

import { db } from './client'

/**
 * Creates a new review for a product
 * @param data - Review data (productId, userId, rating, title, comment)
 * @returns Created review with user info
 */
export async function createReview(data: {
  productId: string
  userId: string
  rating: number
  title: string
  comment: string
}) {
  // Validate rating is between 1-5
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Check if user has already reviewed this product
  const existingReview = await db.review.findUnique({
    where: {
      productId_userId: {
        productId: data.productId,
        userId: data.userId,
      },
    },
  })

  if (existingReview) {
    throw new Error('You have already reviewed this product')
  }

  // Create review
  const review = await db.review.create({
    data: {
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      content: data.comment, // Schema uses 'content' field
      status: 'APPROVED', // Auto-approve for now
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  return review
}

/**
 * Gets reviews for a product with pagination
 * @param productId - Product ID
 * @param page - Page number (default 1)
 * @param limit - Results per page (default 10)
 * @returns Reviews array with pagination metadata
 */
export async function getProductReviews(
  productId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: {
        productId,
        status: 'APPROVED', // Only show approved reviews
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    db.review.count({
      where: {
        productId,
        status: 'APPROVED',
      },
    }),
  ])

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Gets review statistics for a product
 * @param productId - Product ID
 * @returns Average rating, total reviews, and rating distribution
 */
export async function getReviewStats(productId: string) {
  // Get all approved reviews for this product
  const reviews = await db.review.findMany({
    where: {
      productId,
      status: 'APPROVED',
    },
    select: {
      rating: true,
    },
  })

  const totalReviews = reviews.length

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    }
  }

  // Calculate average
  const sum = reviews.reduce((acc: any, review: any) => acc + review.rating, 0)
  const averageRating = sum / totalReviews

  // Calculate distribution
  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  reviews.forEach((review: any) => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++
  })

  return {
    averageRating: Number(averageRating.toFixed(2)),
    totalReviews,
    ratingDistribution,
  }
}

/**
 * Gets a single review by ID
 * @param reviewId - Review ID
 * @returns Review with user info or null
 */
export async function getReviewById(reviewId: string) {
  return await db.review.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Updates a review
 * @param reviewId - Review ID
 * @param userId - User ID (must be author)
 * @param data - Fields to update
 * @returns Updated review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  data: {
    rating?: number
    title?: string
    comment?: string
  }
) {
  // Get existing review
  const review = await db.review.findUnique({
    where: { id: reviewId },
  })

  if (!review) {
    throw new Error('Review not found')
  }

  // Verify user is the author
  if (review.userId !== userId) {
    throw new Error('You can only edit your own reviews')
  }

  // Validate rating if provided
  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Update review
  const updated = await db.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.title && { title: data.title }),
      ...(data.comment && { content: data.comment }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  return updated
}

/**
 * Deletes a review
 * @param reviewId - Review ID
 * @param userId - User ID (must be author)
 */
export async function deleteReview(reviewId: string, userId: string) {
  // Get existing review
  const review = await db.review.findUnique({
    where: { id: reviewId },
  })

  if (!review) {
    throw new Error('Review not found')
  }

  // Verify user is the author
  if (review.userId !== userId) {
    throw new Error('You can only delete your own reviews')
  }

  // Delete review
  await db.review.delete({
    where: { id: reviewId },
  })

  return { success: true }
}

/**
 * Checks if a user has already reviewed a product
 * @param productId - Product ID
 * @param userId - User ID
 * @returns Boolean indicating if user has reviewed
 */
export async function hasUserReviewedProduct(
  productId: string,
  userId: string
): Promise<boolean> {
  const review = await db.review.findUnique({
    where: {
      productId_userId: {
        productId,
        userId,
      },
    },
  })

  return review !== null
}
