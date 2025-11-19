"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "@/lib/wishlist"

interface WishlistButtonProps {
  productId: string
  productName: string
  productImage?: string
  price: number
  compareAtPrice?: number
  inStock?: boolean
  variant?: "icon" | "button" | "text"
  size?: "sm" | "md" | "lg"
  className?: string
  onAdd?: () => void
  onRemove?: () => void
}

export function WishlistButton({
  productId,
  productName,
  productImage,
  price,
  compareAtPrice,
  inStock = true,
  variant = "icon",
  size = "md",
  className,
  onAdd,
  onRemove,
}: WishlistButtonProps) {
  const [isInList, setIsInList] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  // Check initial state
  React.useEffect(() => {
    setIsInList(isInWishlist(productId))
  }, [productId])

  const handleToggle = () => {
    setIsAnimating(true)

    if (isInList) {
      removeFromWishlist(productId)
      setIsInList(false)
      onRemove?.()
    } else {
      addToWishlist({
        productId,
        productName,
        productImage,
        price,
        compareAtPrice,
        inStock,
      })
      setIsInList(true)
      onAdd?.()
    }

    // Dispatch custom event for header to update count
    window.dispatchEvent(new CustomEvent("wishlist-updated"))

    setTimeout(() => setIsAnimating(false), 300)
  }

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          "flex items-center justify-center rounded-full transition-all",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20",
          sizeClasses[size],
          className
        )}
        aria-label={isInList ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          className={cn(
            iconSizes[size],
            "transition-all",
            isInList
              ? "fill-error text-error"
              : "text-muted-foreground hover:text-error",
            isAnimating && "scale-125"
          )}
        />
      </button>
    )
  }

  if (variant === "button") {
    return (
      <Button
        variant={isInList ? "default" : "outline"}
        size={size === "sm" ? "sm" : "default"}
        onClick={handleToggle}
        className={cn(
          isInList && "bg-error hover:bg-error/90",
          className
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 mr-2",
            isInList && "fill-current",
            isAnimating && "scale-125"
          )}
        />
        {isInList ? "En Favoritos" : "Agregar a Favoritos"}
      </Button>
    )
  }

  // Text variant
  return (
    <button
      onClick={handleToggle}
      className={cn(
        "inline-flex items-center gap-1 text-sm transition-colors",
        isInList
          ? "text-error"
          : "text-muted-foreground hover:text-error",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isInList && "fill-current",
          isAnimating && "scale-125"
        )}
      />
      <span>{isInList ? "En Favoritos" : "Agregar"}</span>
    </button>
  )
}
