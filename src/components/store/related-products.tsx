// Related Products Component
// Display related/similar products

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  href: string;
}

export interface RelatedProductsProps {
  title?: string;
  products: RelatedProduct[];
  currency?: string;
  onProductClick?: (productId: string) => void;
  className?: string;
}

export function RelatedProducts({
  title = "Related Products",
  products,
  currency = "USD",
  onProductClick,
  className,
}: RelatedProductsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  if (products.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
      >
        {products.map((product) => (
          <a
            key={product.id}
            href={product.href}
            onClick={(e) => {
              if (onProductClick) {
                e.preventDefault();
                onProductClick(product.id);
              }
            }}
            className="flex-shrink-0 w-48 group"
          >
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="mt-3 space-y-1">
              <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                {product.salePrice ? (
                  <>
                    <span className="font-medium">
                      {formatPrice(product.salePrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="font-medium">{formatPrice(product.price)}</span>
                )}
              </div>
              {product.rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="text-yellow-500">★</span>
                  <span>{product.rating.toFixed(1)}</span>
                  {product.reviewCount && (
                    <span>({product.reviewCount})</span>
                  )}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default RelatedProducts;
