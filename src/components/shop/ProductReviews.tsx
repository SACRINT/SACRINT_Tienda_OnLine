// Product Reviews Component
// Displays product reviews with ratings, pagination, and sorting

"use client";
import Image from "next/image";

import { useState } from "react";
import { Star, ThumbsUp, VerifiedIcon, ChevronDown } from "lucide-react";

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  rating: number;
  title: string;
  content: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  helpfulCount: number;
  isHelpful?: boolean;
}

export interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { stars: number; count: number; percentage: number }[];
  onLoadMore?: () => void;
  onMarkHelpful?: (reviewId: string) => void;
  hasMore?: boolean;
  className?: string;
}

export function ProductReviews({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
  onLoadMore,
  onMarkHelpful,
  hasMore = false,
  className = "",
}: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState<"recent" | "helpful" | "rating">(
    "recent",
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "helpful") {
      return b.helpfulCount - a.helpfulCount;
    } else if (sortBy === "rating") {
      return b.rating - a.rating;
    }
    return 0;
  });

  return (
    <div className={`w-full ${className}`}>
      {/* Rating Summary */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-xl font-bold text-gray-900">
          Customer Reviews
        </h3>

        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12">
          {/* Average Rating */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="text-5xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Based on {totalReviews}{" "}
              {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {ratingDistribution.map((dist) => (
              <div key={dist.stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-gray-700">
                    {dist.stars}
                  </span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-sm text-gray-600">
                  {dist.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">
          All Reviews ({totalReviews})
        </h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-gray-200 bg-white p-6"
          >
            {/* Review Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* User Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                  {review.userImage ? (
                    <Image
                      src={review.userImage}
                      alt={review.userName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    review.userName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {review.userName}
                    </span>
                    {review.isVerifiedPurchase && (
                      <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <VerifiedIcon className="h-3 w-3" />
                        Verified Purchase
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Content */}
            <div className="mb-4">
              <h5 className="mb-2 font-semibold text-gray-900">
                {review.title}
              </h5>
              <p className="text-gray-700 leading-relaxed">{review.content}</p>
            </div>

            {/* Review Actions */}
            <div className="flex items-center gap-4 border-t border-gray-200 pt-4">
              <button
                onClick={() => onMarkHelpful?.(review.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  review.isHelpful
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Helpful</span>
                {review.helpfulCount > 0 && (
                  <span className="text-xs">({review.helpfulCount})</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span>Load More Reviews</span>
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* No Reviews State */}
      {reviews.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <Star className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No reviews yet
          </h3>
          <p className="mt-2 text-gray-600">
            Be the first to review this product!
          </p>
        </div>
      )}
    </div>
  );
}
