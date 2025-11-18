// Product Card Component
// Displays product preview with image, price, rating, and actions

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'

export interface ProductCardProps {
  id: string
  name: string
  slug: string
  image: string
  price: number
  salePrice?: number | null
  rating: number
  reviewCount: number
  inStock: boolean
  category?: string
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
}

export function ProductCard({
  id,
  name,
  slug,
  image,
  price,
  salePrice,
  rating,
  reviewCount,
  inStock,
  category,
  onAddToCart,
  onToggleWishlist,
}: ProductCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [imageError, setImageError] = useState(false)

  const displayPrice = salePrice && salePrice < price ? salePrice : price
  const hasDiscount = salePrice && salePrice < price
  const discountPercent = hasDiscount
    ? Math.round(((price - salePrice) / price) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (inStock && onAddToCart) {
      onAddToCart(id)
    }
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsInWishlist(!isInWishlist)
    if (onToggleWishlist) {
      onToggleWishlist(id)
    }
  }

  return (
    <Link
      href={`/shop/products/${slug}`}
      className="group block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <article className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {!imageError ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {/* Stock Badge */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <span className="rounded-lg bg-white px-4 py-2 font-bold text-gray-900">
                Out of Stock
              </span>
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && inStock && (
            <div className="absolute right-2 top-2 rounded-lg bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-md">
              -{discountPercent}%
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute left-2 top-2 rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Add to wishlist"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isInWishlist
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600'
              }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {category && (
            <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {category}
            </p>
          )}

          {/* Product Name */}
          <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
            {name}
          </h3>

          {/* Rating */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{inStock ? 'Add to Cart' : 'Notify Me'}</span>
          </button>
        </div>
      </article>
    </Link>
  )
}
