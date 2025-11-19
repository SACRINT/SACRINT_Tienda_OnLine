// Reviews Data Access Layer
// CRUD and validation functions for product reviews

import { db } from "./client";
import { ensureTenantAccess } from "./tenant";

/**
 * Creates a new review for a product with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param data - Review data (productId, userId, rating, title, comment)
 * @returns Created review with user info
 */
export async function createReview(
  tenantId: string,
  data: {
    productId: string;
    userId: string;
    rating: number;
    title: string;
    comment: string;
  },
) {
  await ensureTenantAccess(tenantId);

  // Verify product belongs to tenant
  const product = await db.product.findFirst({
    where: {
      id: data.productId,
      tenantId,
    },
  });

  if (!product) {
    throw new Error("Product not found or does not belong to tenant");
  }

  // Validate rating is between 1-5
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Check if user has already reviewed this product
  const existingReview = await db.review.findUnique({
    where: {
      productId_userId: {
        productId: data.productId,
        userId: data.userId,
      },
    },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this product");
  }

  // Create review
  const review = await db.review.create({
    data: {
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      content: data.comment, // Schema uses 'content' field
      status: "APPROVED", // Auto-approve for now
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
  });

  return review;
}

/**
 * Gets reviews for a product with pagination and tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID
 * @param page - Page number (default 1)
 * @param limit - Results per page (default 10)
 * @returns Reviews array with pagination metadata
 */
export async function getProductReviews(
  tenantId: string,
  productId: string,
  page: number = 1,
  limit: number = 10,
) {
  await ensureTenantAccess(tenantId);

  // Verify product belongs to tenant
  const product = await db.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
  });

  if (!product) {
    throw new Error("Product not found or does not belong to tenant");
  }

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: {
        productId,
        status: "APPROVED", // Only show approved reviews
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
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    db.review.count({
      where: {
        productId,
        status: "APPROVED",
      },
    }),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets review statistics for a product with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID
 * @returns Average rating, total reviews, and rating distribution
 */
export async function getReviewStats(tenantId: string, productId: string) {
  await ensureTenantAccess(tenantId);

  // Verify product belongs to tenant
  const product = await db.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
  });

  if (!product) {
    throw new Error("Product not found or does not belong to tenant");
  }

  // Get all approved reviews for this product
  const reviews = await db.review.findMany({
    where: {
      productId,
      status: "APPROVED",
    },
    select: {
      rating: true,
    },
  });

  const totalReviews = reviews.length;

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
    };
  }

  // Calculate average
  const sum = reviews.reduce((acc: any, review: any) => acc + review.rating, 0);
  const averageRating = sum / totalReviews;

  // Calculate distribution
  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((review: any) => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  return {
    averageRating: Number(averageRating.toFixed(2)),
    totalReviews,
    ratingDistribution,
  };
}

/**
 * Gets a single review by ID with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param reviewId - Review ID
 * @returns Review with user info or null
 */
export async function getReviewById(tenantId: string, reviewId: string) {
  await ensureTenantAccess(tenantId);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      product: {
        select: {
          tenantId: true,
        },
      },
    },
  });

  if (!review) {
    return null;
  }

  // Verify review's product belongs to tenant
  if (review.product.tenantId !== tenantId) {
    throw new Error("Review does not belong to tenant");
  }

  return review;
}

/**
 * Updates a review with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param reviewId - Review ID
 * @param userId - User ID (must be author)
 * @param data - Fields to update
 * @returns Updated review
 */
export async function updateReview(
  tenantId: string,
  reviewId: string,
  userId: string,
  data: {
    rating?: number;
    title?: string;
    comment?: string;
  },
) {
  await ensureTenantAccess(tenantId);

  // Get existing review with product
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      product: {
        select: {
          tenantId: true,
        },
      },
    },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  // Verify review's product belongs to tenant
  if (review.product.tenantId !== tenantId) {
    throw new Error("Review does not belong to tenant");
  }

  // Verify user is the author
  if (review.userId !== userId) {
    throw new Error("You can only edit your own reviews");
  }

  // Validate rating if provided
  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
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
  });

  return updated;
}

/**
 * Deletes a review with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param reviewId - Review ID
 * @param userId - User ID (must be author)
 */
export async function deleteReview(
  tenantId: string,
  reviewId: string,
  userId: string,
) {
  await ensureTenantAccess(tenantId);

  // Get existing review with product
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      product: {
        select: {
          tenantId: true,
        },
      },
    },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  // Verify review's product belongs to tenant
  if (review.product.tenantId !== tenantId) {
    throw new Error("Review does not belong to tenant");
  }

  // Verify user is the author
  if (review.userId !== userId) {
    throw new Error("You can only delete your own reviews");
  }

  // Delete review
  await db.review.delete({
    where: { id: reviewId },
  });

  return { success: true };
}

/**
 * Checks if a user has already reviewed a product with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID
 * @param userId - User ID
 * @returns Boolean indicating if user has reviewed
 */
export async function hasUserReviewedProduct(
  tenantId: string,
  productId: string,
  userId: string,
): Promise<boolean> {
  await ensureTenantAccess(tenantId);

  // Verify product belongs to tenant
  const product = await db.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
  });

  if (!product) {
    throw new Error("Product not found or does not belong to tenant");
  }

  const review = await db.review.findUnique({
    where: {
      productId_userId: {
        productId,
        userId,
      },
    },
  });

  return review !== null;
}
