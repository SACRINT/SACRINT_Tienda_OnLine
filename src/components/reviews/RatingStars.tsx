// Interactive Star Rating Component
// Supports display-only and interactive modes

"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number; // Current rating (0-5)
  maxRating?: number; // Maximum rating (default: 5)
  size?: "sm" | "md" | "lg"; // Size variant
  interactive?: boolean; // Enable click interaction
  onChange?: (rating: number) => void; // Callback when rating changes
  showCount?: boolean; // Show rating count
  count?: number; // Number of reviews
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showCount = false,
  count,
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  const displayRating = hoverRating ?? rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.floor(displayRating);
          const isHalfFilled =
            starValue === Math.ceil(displayRating) &&
            displayRating % 1 !== 0 &&
            hoverRating === null;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={cn(
                "relative transition-all",
                interactive &&
                  "cursor-pointer hover:scale-110 disabled:cursor-default",
                !interactive && "cursor-default",
              )}
              aria-label={`Rate ${starValue} out of ${maxRating}`}
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-gray-300",
                  interactive && hoverRating !== null && "text-yellow-200",
                )}
              />

              {/* Filled star */}
              {(isFilled || isHalfFilled) && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    "absolute left-0 top-0 text-yellow-400",
                    interactive && hoverRating !== null && "text-yellow-500",
                  )}
                  fill="currentColor"
                  style={
                    isHalfFilled
                      ? {
                          clipPath: `inset(0 ${100 - (displayRating % 1) * 100}% 0 0)`,
                        }
                      : undefined
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Rating text */}
      {!interactive && (
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium text-gray-900">
            {rating.toFixed(1)}
          </span>
          {showCount && count !== undefined && (
            <span className="text-gray-500">({count.toLocaleString()})</span>
          )}
        </div>
      )}

      {/* Interactive feedback */}
      {interactive && hoverRating !== null && (
        <span className="text-sm font-medium text-gray-600">
          {hoverRating} / {maxRating}
        </span>
      )}
    </div>
  );
}

// Simple display-only variant
export function RatingDisplay({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <RatingStars
      rating={rating}
      size={size}
      showCount={!!count}
      count={count}
      className={className}
    />
  );
}

// Interactive picker variant
export function RatingPicker({
  value,
  onChange,
  size = "lg",
  className,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <RatingStars
      rating={value}
      size={size}
      interactive
      onChange={onChange}
      className={className}
    />
  );
}
