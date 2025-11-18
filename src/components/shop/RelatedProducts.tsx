// Related Products Component
// Horizontal carousel of similar/related products

"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, ProductCardProps } from "./ProductCard";

export interface RelatedProductsProps {
  products: ProductCardProps[];
  title?: string;
  subtitle?: string;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  className?: string;
}

export function RelatedProducts({
  products,
  title = "You May Also Like",
  subtitle = "Customers who viewed this item also viewed",
  onAddToCart,
  onToggleWishlist,
  className = "",
}: RelatedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.offsetWidth * 0.8;
    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {products.length > 4 && (
          <>
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-gray-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 text-gray-900" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg transition-all hover:bg-gray-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 text-gray-900" />
            </button>
          </>
        )}

        {/* Products Grid/Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:gap-6"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[280px] flex-shrink-0 sm:w-[320px]"
            >
              <ProductCard
                {...product}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
              />
            </div>
          ))}
        </div>

        {/* Scroll Indicator Dots */}
        {products.length > 4 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({
              length: Math.ceil(products.length / 4),
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const scrollPosition = index * container.offsetWidth;
                    container.scrollTo({
                      left: scrollPosition,
                      behavior: "smooth",
                    });
                  }
                }}
                className="h-2 w-2 rounded-full bg-gray-300 transition-all hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
