// Rating Breakdown Component
// Shows distribution of ratings with visual bars

"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingBreakdownProps {
  averageRating: number;
  totalReviews: number;
  breakdown: Array<{
    rating: number;
    count: number;
  }>;
  onFilterByRating?: (rating: number | null) => void;
  selectedRating?: number | null;
  className?: string;
}

export function RatingBreakdown({
  averageRating,
  totalReviews,
  breakdown,
  onFilterByRating,
  selectedRating,
  className,
}: RatingBreakdownProps) {
  // Sort breakdown from 5 stars to 1 star
  const sortedBreakdown = [...breakdown].sort((a, b) => b.rating - a.rating);

  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  const handleRatingClick = (rating: number) => {
    if (onFilterByRating) {
      // Toggle: if already selected, clear filter
      if (selectedRating === rating) {
        onFilterByRating(null);
      } else {
        onFilterByRating(rating);
      }
    }
  };

  return (
    <div className={cn("space-y-6 rounded-lg border border-gray-200 bg-white p-6", className)}>
      {/* Overall rating */}
      <div className="flex items-center gap-6 border-b border-gray-100 pb-6">
        <div className="text-center">
          <div className="mb-2 text-5xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center">
            {Array.from({ length: 5 }, (_, index) => {
              const starValue = index + 1;
              const isFilled = starValue <= Math.floor(averageRating);
              const isHalfFilled =
                starValue === Math.ceil(averageRating) &&
                averageRating % 1 !== 0;

              return (
                <Star
                  key={index}
                  className={cn(
                    "h-5 w-5",
                    isFilled || isHalfFilled ? "text-yellow-400" : "text-gray-300",
                  )}
                  fill={isFilled || isHalfFilled ? "currentColor" : "none"}
                />
              );
            })}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {totalReviews.toLocaleString()}{" "}
            {totalReviews === 1 ? "reseña" : "reseñas"}
          </p>
        </div>

        <div className="flex-1">
          <div className="space-y-2">
            {sortedBreakdown.map(({ rating, count }) => {
              const percentage = getPercentage(count);
              const isSelected = selectedRating === rating;

              return (
                <button
                  key={rating}
                  onClick={() => handleRatingClick(rating)}
                  disabled={!onFilterByRating}
                  className={cn(
                    "flex w-full items-center gap-2 text-sm transition-colors",
                    onFilterByRating && "cursor-pointer hover:text-blue-600",
                    !onFilterByRating && "cursor-default",
                    isSelected && "text-blue-600",
                  )}
                >
                  {/* Star label */}
                  <span className="flex items-center gap-1 font-medium w-12">
                    {rating}
                    <Star className="h-3 w-3 fill-current text-yellow-400" />
                  </span>

                  {/* Progress bar */}
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all rounded-full",
                        isSelected ? "bg-blue-600" : "bg-yellow-400",
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Count */}
                  <span className="w-12 text-right text-gray-600">
                    {count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter indicator */}
      {selectedRating && onFilterByRating && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-900">
            Mostrando reseñas con{" "}
            <span className="font-semibold">{selectedRating} estrellas</span>
          </p>
          <button
            onClick={() => onFilterByRating(null)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* Helpful tip */}
      <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
        {onFilterByRating ? (
          <p>Haz clic en una calificación para filtrar las reseñas</p>
        ) : (
          <p>
            Las reseñas verificadas provienen de clientes que compraron el
            producto
          </p>
        )}
      </div>
    </div>
  );
}

// Compact version for product cards
export function RatingBreakdownCompact({
  averageRating,
  totalReviews,
  className,
}: {
  averageRating: number;
  totalReviews: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.floor(averageRating);

          return (
            <Star
              key={index}
              className={cn(
                "h-4 w-4",
                isFilled ? "text-yellow-400" : "text-gray-300",
              )}
              fill={isFilled ? "currentColor" : "none"}
            />
          );
        })}
      </div>
      <span className="text-sm font-medium text-gray-900">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-sm text-gray-500">
        ({totalReviews.toLocaleString()})
      </span>
    </div>
  );
}
