"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

const RatingStars = React.forwardRef<HTMLDivElement, RatingStarsProps>(
  ({
    rating,
    maxRating = 5,
    size = "md",
    showValue = false,
    interactive = false,
    onRatingChange,
    className
  }, ref) => {
    const [hoverRating, setHoverRating] = React.useState<number | null>(null)

    const displayRating = hoverRating !== null ? hoverRating : rating

    return (
      <div ref={ref} className={cn("flex items-center gap-1", className)}>
        <div className="flex items-center">
          {Array.from({ length: maxRating }).map((_, index) => {
            const starValue = index + 1
            const isFilled = starValue <= displayRating
            const isHalf = !isFilled && starValue - 0.5 <= displayRating

            return (
              <button
                key={index}
                type="button"
                disabled={!interactive}
                className={cn(
                  "relative transition-colors",
                  interactive && "cursor-pointer hover:scale-110",
                  !interactive && "cursor-default"
                )}
                onMouseEnter={() => interactive && setHoverRating(starValue)}
                onMouseLeave={() => interactive && setHoverRating(null)}
                onClick={() => interactive && onRatingChange?.(starValue)}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    isFilled
                      ? "fill-accent text-accent"
                      : isHalf
                        ? "fill-accent/50 text-accent"
                        : "fill-muted text-muted-foreground"
                  )}
                />
              </button>
            )
          })}
        </div>
        {showValue && (
          <span className="ml-1 text-sm text-muted-foreground">
            ({rating.toFixed(1)})
          </span>
        )}
      </div>
    )
  }
)
RatingStars.displayName = "RatingStars"

export { RatingStars }
