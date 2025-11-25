// Product Reviews Component
// Customer reviews with ratings and filters

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Star, ThumbsUp, Flag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { ProgressCustom } from "@/components/ui/progress-custom";
import Image from "next/image";

export interface Review {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  verified: boolean;
  images?: string[];
}

export interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  onWriteReview?: () => void;
  onHelpful?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}

export function ProductReviews({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
  onWriteReview,
  onHelpful,
  onReport,
  onLoadMore,
  hasMore,
  loading,
  className,
}: ProductReviewsProps) {
  const [sortBy, setSortBy] = React.useState<"recent" | "helpful" | "rating">(
    "recent",
  );

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        {onWriteReview && (
          <Button onClick={onWriteReview}>Write a Review</Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Average rating */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center gap-4 md:justify-start">
            <span className="text-5xl font-bold">
              {averageRating.toFixed(1)}
            </span>
            <div>
              <StarRating rating={Math.round(averageRating)} size="lg" />
              <p className="mt-1 text-sm text-muted-foreground">
                Based on {totalReviews} reviews
              </p>
            </div>
          </div>
        </div>

        {/* Rating distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="w-12 text-sm">{rating} star</span>
                <ProgressCustom
                  value={percentage}
                  className="flex-1"
                  size="sm"
                />
                <span className="w-12 text-sm text-muted-foreground text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm border rounded-md px-2 py-1"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews yet</p>
            {onWriteReview && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={onWriteReview}
              >
                Be the first to write a review
              </Button>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <AvatarCustom
                  src={review.author.avatar}
                  name={review.author.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.author.name}</span>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {review.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium">{review.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {review.content}
                </p>
              </div>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {review.images.map((image, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 rounded-md overflow-hidden"
                    >
                      <Image
                      src={image}
                      alt={`Review image ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHelpful?.(review.id)}
                  className="text-muted-foreground"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Helpful ({review.helpful})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReport?.(review.id)}
                  className="text-muted-foreground"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More Reviews"}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProductReviews;
