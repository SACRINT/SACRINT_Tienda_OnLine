// Wishlist Item Component
// Display wishlist product with actions (add to cart, remove)

"use client";
import Image from "next/image";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Star, Tag, AlertCircle } from "lucide-react";

export interface WishlistItemProps {
  item: {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage?: string;
    price: number;
    salePrice?: number;
    inStock: boolean;
    rating?: number;
    reviewCount?: number;
    addedAt: string;
  };
  onAddToCart?: (itemId: string) => Promise<void>;
  onRemove?: (itemId: string) => Promise<void>;
}

export function WishlistItem({
  item,
  onAddToCart,
  onRemove,
}: WishlistItemProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const displayPrice = item.salePrice || item.price;
  const hasDiscount = item.salePrice && item.salePrice < item.price;
  const discountPercent = hasDiscount
    ? Math.round(((item.price - item.salePrice!) / item.price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!item.inStock) return;

    setIsAddingToCart(true);
    try {
      await onAddToCart?.(item.id);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove?.(item.id);
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      setIsRemoving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`group relative rounded-lg border ${
        isRemoving ? "opacity-50" : "opacity-100"
      } border-gray-200 bg-white p-4 transition-all hover:shadow-md ${
        !item.inStock ? "bg-gray-50" : ""
      }`}
    >
      {/* Remove Button */}
      <button
        onClick={handleRemove}
        disabled={isRemoving}
        className="absolute right-2 top-2 z-10 rounded-lg bg-white p-2 text-gray-400 opacity-0 shadow-md transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
        aria-label="Remove from wishlist"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="flex gap-4">
        {/* Product Image */}
        <Link
          href={`/shop/products/${item.productSlug}`}
          className="flex-shrink-0"
        >
          {item.productImage ? (
            <Image
              src={item.productImage}
              alt={item.productName}
              className="h-24 w-24 rounded-lg object-cover transition-transform hover:scale-105 sm:h-32 sm:w-32"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-200 sm:h-32 sm:w-32">
              <Tag className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <Link
              href={`/shop/products/${item.productSlug}`}
              className="text-base font-semibold text-gray-900 hover:text-blue-600 sm:text-lg"
            >
              {item.productName}
            </Link>

            {/* Rating */}
            {item.rating && item.rating > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(item.rating!)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {item.reviewCount !== undefined && (
                  <span className="text-xs text-gray-600">
                    ({item.reviewCount})
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            {!item.inStock && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Out of Stock</span>
              </div>
            )}

            {/* Added Date */}
            <p className="mt-2 text-xs text-gray-500">
              Added {formatDate(item.addedAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={!item.inStock || isAddingToCart}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                item.inStock
                  ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>
                {isAddingToCart
                  ? "Adding..."
                  : item.inStock
                    ? "Add to Cart"
                    : "Out of Stock"}
              </span>
            </button>

            <Link
              href={`/shop/products/${item.productSlug}`}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
