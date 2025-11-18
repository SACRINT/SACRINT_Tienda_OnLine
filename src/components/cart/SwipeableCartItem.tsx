'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Trash2, Plus, Minus } from 'lucide-react'

export interface CartItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  stock: number
  variant?: string
}

interface SwipeableCartItemProps {
  item: CartItem
  onQuantityChange: (itemId: string, newQuantity: number) => void
  onRemove: (itemId: string) => void
}

export function SwipeableCartItem({
  item,
  onQuantityChange,
  onRemove,
}: SwipeableCartItemProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)

  const MAX_SWIPE = 80 // Maximum swipe distance to reveal delete button

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return

    currentX.current = e.touches[0].clientX
    const diff = startX.current - currentX.current

    // Only allow left swipe
    if (diff > 0 && diff <= MAX_SWIPE) {
      setTranslateX(-diff)
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)

    // If swiped more than half, snap to MAX_SWIPE, otherwise snap back
    if (Math.abs(translateX) > MAX_SWIPE / 2) {
      setTranslateX(-MAX_SWIPE)
    } else {
      setTranslateX(0)
    }
  }

  const handleDelete = () => {
    // Animate out before deleting
    setTranslateX(-400)
    setTimeout(() => {
      onRemove(item.id)
    }, 300)
  }

  const incrementQuantity = () => {
    if (item.quantity < item.stock) {
      onQuantityChange(item.id, item.quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1)
    }
  }

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Delete Button (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
        <button
          onClick={handleDelete}
          className="flex flex-col items-center gap-1 text-white p-2 touch-manipulation"
          aria-label="Delete item"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {/* Cart Item */}
      <div
        ref={itemRef}
        className="relative bg-white transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex gap-3 p-3 md:p-4">
          {/* Product Image */}
          <div className="relative h-20 w-20 md:h-24 md:w-24 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80px, 96px"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <h3 className="text-sm md:text-base font-medium text-gray-900 line-clamp-2">
                {item.name}
              </h3>
              {item.variant && (
                <p className="mt-1 text-xs text-gray-500">{item.variant}</p>
              )}
              <p className="mt-1 text-sm md:text-base font-semibold text-gray-900">
                ${item.price.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={decrementQuantity}
                  disabled={item.quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="min-w-[2rem] text-center text-sm md:text-base font-medium text-gray-900">
                  {item.quantity}
                </span>

                <button
                  onClick={incrementQuantity}
                  disabled={item.quantity >= item.stock}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Delete Button (desktop) */}
              <button
                onClick={handleDelete}
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stock Warning */}
        {item.quantity >= item.stock && (
          <div className="px-3 md:px-4 pb-2">
            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Maximum stock reached ({item.stock} available)
            </p>
          </div>
        )}

        {/* Low Stock Warning */}
        {item.stock <= 5 && item.stock > 0 && (
          <div className="px-3 md:px-4 pb-2">
            <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Only {item.stock} left in stock
            </p>
          </div>
        )}
      </div>

      {/* Swipe Hint (show on first render, hide after first swipe) */}
      {translateX === 0 && (
        <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="flex items-center gap-1 text-gray-400 text-xs animate-pulse">
            <span>Swipe left</span>
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
