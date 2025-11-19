"use client"

import * as React from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getWishlistCount } from "@/lib/wishlist"

interface WishlistIndicatorProps {
  className?: string
}

export function WishlistIndicator({ className }: WishlistIndicatorProps) {
  const [count, setCount] = React.useState(0)

  // Load initial count
  React.useEffect(() => {
    setCount(getWishlistCount())
  }, [])

  // Listen for wishlist updates
  React.useEffect(() => {
    const handleUpdate = () => {
      setCount(getWishlistCount())
    }

    window.addEventListener("wishlist-updated", handleUpdate)
    return () => window.removeEventListener("wishlist-updated", handleUpdate)
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      asChild
    >
      <Link href="/account/wishlist" className="relative">
        <Heart className="h-5 w-5" />
        {count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
        <span className="sr-only">
          Favoritos ({count} {count === 1 ? "producto" : "productos"})
        </span>
      </Link>
    </Button>
  )
}
