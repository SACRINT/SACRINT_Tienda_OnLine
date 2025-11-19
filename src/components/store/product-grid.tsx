// Product Grid Component
// Grid/List view for product listings

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Grid, List, Star, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeCustom } from "@/components/ui/badge-custom";

export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  category?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  stock: number;
  href: string;
}

export interface ProductGridProps {
  products: Product[];
  view?: "grid" | "list";
  columns?: 2 | 3 | 4;
  currency?: string;
  onViewChange?: (view: "grid" | "list") => void;
  onProductClick?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  onWishlist?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  wishlistedIds?: Set<string>;
  className?: string;
}

export function ProductGrid({
  products,
  view = "grid",
  columns = 4,
  currency = "USD",
  onViewChange,
  onProductClick,
  onQuickView,
  onWishlist,
  onAddToCart,
  wishlistedIds = new Set(),
  className,
}: ProductGridProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* View toggle */}
      {onViewChange && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={view === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => onViewChange("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Products */}
      {view === "grid" ? (
        <div className={cn("grid gap-6", gridCols[columns])}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              onProductClick={onProductClick}
              onQuickView={onQuickView}
              onWishlist={onWishlist}
              onAddToCart={onAddToCart}
              isWishlisted={wishlistedIds.has(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              currency={currency}
              onProductClick={onProductClick}
              onWishlist={onWishlist}
              onAddToCart={onAddToCart}
              isWishlisted={wishlistedIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Grid card item
interface ProductCardProps {
  product: Product;
  currency: string;
  onProductClick?: (id: string) => void;
  onQuickView?: (id: string) => void;
  onWishlist?: (id: string) => void;
  onAddToCart?: (id: string) => void;
  isWishlisted?: boolean;
}

function ProductCard({
  product,
  currency,
  onProductClick,
  onQuickView,
  onWishlist,
  onAddToCart,
  isWishlisted,
}: ProductCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="group relative">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <a
          href={product.href}
          onClick={(e) => {
            if (onProductClick) {
              e.preventDefault();
              onProductClick(product.id);
            }
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </a>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <BadgeCustom variant="info" size="sm">New</BadgeCustom>
          )}
          {product.isBestseller && (
            <BadgeCustom variant="success" size="sm">Bestseller</BadgeCustom>
          )}
          {discount > 0 && (
            <BadgeCustom variant="error" size="sm">-{discount}%</BadgeCustom>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onWishlist && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => onWishlist(product.id)}
              aria-label="Add to wishlist"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isWishlisted && "fill-red-500 text-red-500"
                )}
              />
            </Button>
          )}
          {onQuickView && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuickView(product.id)}
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Add to cart */}
        {onAddToCart && product.stock > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              className="w-full"
              onClick={() => onAddToCart(product.id)}
            >
              Add to Cart
            </Button>
          </div>
        )}

        {/* Out of stock */}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        {product.category && (
          <p className="text-xs text-muted-foreground">{product.category}</p>
        )}
        <h3 className="text-sm font-medium line-clamp-2">
          <a
            href={product.href}
            className="hover:text-primary transition-colors"
            onClick={(e) => {
              if (onProductClick) {
                e.preventDefault();
                onProductClick(product.id);
              }
            }}
          >
            {product.name}
          </a>
        </h3>
        <div className="flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="font-medium">{formatPrice(product.salePrice)}</span>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="font-medium">{formatPrice(product.price)}</span>
          )}
        </div>
        {product.rating && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="text-muted-foreground">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// List view item
function ProductListItem({
  product,
  currency,
  onProductClick,
  onWishlist,
  onAddToCart,
  isWishlisted,
}: Omit<ProductCardProps, "onQuickView">) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className="flex gap-4 p-4 border rounded-lg">
      {/* Image */}
      <div className="flex-shrink-0 w-32 h-32 overflow-hidden rounded-md bg-muted">
        <a
          href={product.href}
          onClick={(e) => {
            if (onProductClick) {
              e.preventDefault();
              onProductClick(product.id);
            }
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </a>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            {product.category && (
              <p className="text-xs text-muted-foreground">{product.category}</p>
            )}
            <h3 className="font-medium">
              <a
                href={product.href}
                className="hover:text-primary transition-colors"
                onClick={(e) => {
                  if (onProductClick) {
                    e.preventDefault();
                    onProductClick(product.id);
                  }
                }}
              >
                {product.name}
              </a>
            </h3>
            {product.rating && (
              <div className="flex items-center gap-1 mt-1 text-sm">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{product.rating.toFixed(1)}</span>
                {product.reviewCount && (
                  <span className="text-muted-foreground">
                    ({product.reviewCount} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-right">
            {product.salePrice ? (
              <>
                <p className="font-bold">{formatPrice(product.salePrice)}</p>
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </p>
              </>
            ) : (
              <p className="font-bold">{formatPrice(product.price)}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {onAddToCart && product.stock > 0 && (
            <Button size="sm" onClick={() => onAddToCart(product.id)}>
              Add to Cart
            </Button>
          )}
          {onWishlist && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onWishlist(product.id)}
            >
              <Heart
                className={cn(
                  "h-4 w-4 mr-2",
                  isWishlisted && "fill-red-500 text-red-500"
                )}
              />
              Wishlist
            </Button>
          )}
          {product.stock === 0 && (
            <span className="text-sm text-muted-foreground">Out of Stock</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductGrid;
