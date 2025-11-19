// Product Info Component
// Product details with pricing, variants, and actions

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Heart, Share2, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeCustom } from "@/components/ui/badge-custom";
import { NumberInput } from "@/components/ui/number-input";

export interface ProductVariant {
  id: string;
  name: string;
  type: "color" | "size" | "other";
  value: string;
  available: boolean;
  price?: number;
}

export interface ProductInfoProps {
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  currency?: string;
  sku?: string;
  stock: number;
  variants?: ProductVariant[];
  selectedVariants?: Record<string, string>;
  onVariantChange?: (type: string, value: string) => void;
  onQuantityChange?: (quantity: number) => void;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  onWishlist?: () => void;
  onShare?: () => void;
  isWishlisted?: boolean;
  loading?: boolean;
  className?: string;
}

export function ProductInfo({
  name,
  description,
  price,
  salePrice,
  currency = "USD",
  sku,
  stock,
  variants = [],
  selectedVariants = {},
  onVariantChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onWishlist,
  onShare,
  isWishlisted,
  loading,
  className,
}: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const discount = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const handleQuantityChange = (value: number) => {
    setQuantity(value);
    onQuantityChange?.(value);
  };

  // Group variants by type
  const variantsByType = variants.reduce(
    (acc, variant) => {
      if (!acc[variant.type]) acc[variant.type] = [];
      acc[variant.type].push(variant);
      return acc;
    },
    {} as Record<string, ProductVariant[]>,
  );

  const isOutOfStock = stock === 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Title and badges */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {name}
          </h1>
          <div className="flex items-center gap-2">
            {onWishlist && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onWishlist}
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isWishlisted && "fill-red-500 text-red-500",
                  )}
                />
              </Button>
            )}
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onShare}
                aria-label="Share product"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        {sku && <p className="text-sm text-muted-foreground">SKU: {sku}</p>}
      </div>

      {/* Price */}
      <div className="flex items-center gap-3">
        {salePrice ? (
          <>
            <span className="text-3xl font-bold">{formatPrice(salePrice)}</span>
            <span className="text-xl text-muted-foreground line-through">
              {formatPrice(price)}
            </span>
            <BadgeCustom variant="error" size="sm">
              -{discount}%
            </BadgeCustom>
          </>
        ) : (
          <span className="text-3xl font-bold">{formatPrice(price)}</span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      )}

      {/* Variants */}
      {Object.entries(variantsByType).map(([type, typeVariants]) => (
        <div key={type} className="space-y-3">
          <label className="text-sm font-medium capitalize">
            {type}: {selectedVariants[type] || "Select"}
          </label>
          <div className="flex flex-wrap gap-2">
            {typeVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onVariantChange?.(type, variant.value)}
                disabled={!variant.available}
                className={cn(
                  "px-4 py-2 rounded-md border text-sm transition-colors",
                  type === "color" && "w-8 h-8 p-0 rounded-full",
                  selectedVariants[type] === variant.value
                    ? "border-primary bg-primary/10"
                    : "border-input hover:border-muted-foreground",
                  !variant.available &&
                    "opacity-50 cursor-not-allowed line-through",
                )}
                style={
                  type === "color"
                    ? { backgroundColor: variant.value }
                    : undefined
                }
                aria-label={`Select ${variant.name}`}
              >
                {type !== "color" && variant.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity and Stock */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Quantity</label>
          {stock > 0 && stock <= 10 && (
            <span className="text-sm text-warning">Only {stock} left</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <NumberInput
            value={quantity}
            onChange={handleQuantityChange}
            min={1}
            max={stock}
            disabled={isOutOfStock}
          />
          {isOutOfStock && (
            <BadgeCustom variant="error">Out of Stock</BadgeCustom>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          onClick={onAddToCart}
          disabled={isOutOfStock || loading}
        >
          {loading ? "Adding..." : "Add to Cart"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="flex-1"
          onClick={onBuyNow}
          disabled={isOutOfStock || loading}
        >
          Buy Now
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-4 pt-4 border-t sm:grid-cols-3">
        <div className="flex items-center gap-3 text-sm">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Free Shipping</p>
            <p className="text-muted-foreground">On orders over $50</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Secure Payment</p>
            <p className="text-muted-foreground">100% protected</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <RotateCcw className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Easy Returns</p>
            <p className="text-muted-foreground">30 day returns</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductInfo;
