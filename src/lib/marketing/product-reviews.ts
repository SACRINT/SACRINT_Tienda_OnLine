/**
 * Product Reviews & Ratings
 * Semana 37, Tarea 37.9: Product Reviews & Ratings
 */

import { logger } from '@/lib/monitoring'

export interface ProductReview {
  id: string
  productId: string
  customerId: string
  rating: number // 1-5
  title: string
  content: string
  images?: string[]
  verified: boolean
  helpfulCount: number
  unhelpfulCount: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  approvedAt?: Date
}

export interface ProductRating {
  productId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number> // rating -> count
  recommendationRate: number
}

export class ProductReviewManager {
  private reviews: Map<string, ProductReview> = new Map()
  private productRatings: Map<string, ProductRating> = new Map()
  private customerReviews: Map<string, Set<string>> = new Map() // customerId -> Set<reviewId>

  constructor() {
    logger.debug({ type: 'product_reviews_init' }, 'Product Review Manager inicializado')
  }

  /**
   * Crear reseña
   */
  createReview(
    productId: string,
    customerId: string,
    rating: number,
    title: string,
    content: string,
    verified: boolean = false,
  ): ProductReview {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    const review: ProductReview = {
      id: `review_${Date.now()}_${Math.random()}`,
      productId,
      customerId,
      rating,
      title,
      content,
      verified,
      helpfulCount: 0,
      unhelpfulCount: 0,
      status: 'pending',
      createdAt: new Date(),
    }

    this.reviews.set(review.id, review)

    // Registrar que el cliente escribió esta reseña
    let customerRevs = this.customerReviews.get(customerId)
    if (!customerRevs) {
      customerRevs = new Set()
      this.customerReviews.set(customerId, customerRevs)
    }
    customerRevs.add(review.id)

    logger.debug(
      { type: 'review_created', reviewId: review.id, productId, rating },
      `Reseña creada: ${title}`,
    )

    return review
  }

  /**
   * Aprobar reseña
   */
  approveReview(reviewId: string): ProductReview | null {
    const review = this.reviews.get(reviewId)
    if (!review) return null

    review.status = 'approved'
    review.approvedAt = new Date()

    // Actualizar rating del producto
    this.updateProductRating(review.productId)

    logger.info({ type: 'review_approved', reviewId }, 'Reseña aprobada')

    return review
  }

  /**
   * Rechazar reseña
   */
  rejectReview(reviewId: string): ProductReview | null {
    const review = this.reviews.get(reviewId)
    if (!review) return null

    review.status = 'rejected'

    logger.info({ type: 'review_rejected', reviewId }, 'Reseña rechazada')

    return review
  }

  /**
   * Registrar voto de útil
   */
  markAsHelpful(reviewId: string): boolean {
    const review = this.reviews.get(reviewId)
    if (!review) return false

    review.helpfulCount++
    return true
  }

  /**
   * Registrar voto de no útil
   */
  markAsUnhelpful(reviewId: string): boolean {
    const review = this.reviews.get(reviewId)
    if (!review) return false

    review.unhelpfulCount++
    return true
  }

  /**
   * Obtener reseñas de producto
   */
  getProductReviews(productId: string, approvedOnly: boolean = true): ProductReview[] {
    return Array.from(this.reviews.values()).filter(
      (r) => r.productId === productId && (!approvedOnly || r.status === 'approved'),
    )
  }

  /**
   * Obtener rating de producto
   */
  getProductRating(productId: string): ProductRating | null {
    return this.productRatings.get(productId) || null
  }

  /**
   * Actualizar rating del producto
   */
  private updateProductRating(productId: string): void {
    const reviews = this.getProductReviews(productId, true)

    if (reviews.length === 0) {
      const rating: ProductRating = {
        productId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recommendationRate: 0,
      }
      this.productRatings.set(productId, rating)
      return
    }

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let sumRatings = 0

    for (const review of reviews) {
      sumRatings += review.rating
      ratingDistribution[review.rating]++
    }

    const averageRating = Math.round((sumRatings / reviews.length) * 10) / 10
    const recommendationRate = reviews.length > 0 ? (ratingDistribution[4] + ratingDistribution[5]) / reviews.length * 100 : 0

    const rating: ProductRating = {
      productId,
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
      recommendationRate: Math.round(recommendationRate),
    }

    this.productRatings.set(productId, rating)

    logger.debug(
      { type: 'product_rating_updated', productId, averageRating, totalReviews: reviews.length },
      'Rating del producto actualizado',
    )
  }

  /**
   * Obtener reseñas de cliente
   */
  getCustomerReviews(customerId: string): ProductReview[] {
    const reviewIds = this.customerReviews.get(customerId) || new Set()
    return Array.from(reviewIds)
      .map((id) => this.reviews.get(id))
      .filter((r) => r !== undefined) as ProductReview[]
  }

  /**
   * Estadísticas de reseñas
   */
  getReviewStats(productId: string): {
    averageRating: number
    totalReviews: number
    distribution: Record<number, number>
    helpfulnessRatio: number
  } | null {
    const rating = this.getProductRating(productId)
    if (!rating) return null

    const reviews = this.getProductReviews(productId, true)
    const totalHelpful = reviews.reduce((sum, r) => sum + r.helpfulCount, 0)
    const totalResponses = reviews.reduce((sum, r) => sum + (r.helpfulCount + r.unhelpfulCount), 0)
    const helpfulnessRatio = totalResponses > 0 ? (totalHelpful / totalResponses) * 100 : 0

    return {
      averageRating: rating.averageRating,
      totalReviews: rating.totalReviews,
      distribution: rating.ratingDistribution,
      helpfulnessRatio: Math.round(helpfulnessRatio),
    }
  }
}

let globalReviewManager: ProductReviewManager | null = null

export function initializeProductReviews(): ProductReviewManager {
  if (!globalReviewManager) {
    globalReviewManager = new ProductReviewManager()
  }
  return globalReviewManager
}

export function getProductReviews(): ProductReviewManager {
  if (!globalReviewManager) {
    return initializeProductReviews()
  }
  return globalReviewManager
}
