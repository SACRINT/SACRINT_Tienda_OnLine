"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import analytics from "@/lib/analytics/events";


interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating?: number;
    reviewCount: number;
    isNew?: boolean;
    isSale?: boolean;
    stock: number;
    slug: string;
  };
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const isOutOfStock = product.stock === 0;
  const displayPrice = product.originalPrice ? product.originalPrice : product.price;

  const handleAddToCart = () => {
    analytics.trackAddToCart({ id: product.id, name: product.name, price: product.price }, 1);
    // Here you would also add the product to the cart state
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
        viewMode === "list" ? "flex items-center" : ""
      }`}
    >
      <Link href={`/producto/${product.slug}`} className="block">
        <div
          className={`relative ${
            viewMode === "list" ? "h-32 w-32 flex-shrink-0" : "h-60"
          } overflow-hidden`}
        >
          <Image
            src={product.image}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className={`transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? "grayscale" : ""
            }`}
          />
          {product.isSale && (
            <span className="absolute top-2 left-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
              -{(100 - (product.price / displayPrice) * 100).toFixed(0)}%
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-2 right-2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
              Nuevo
            </span>
          )}
          {isOutOfStock && (
            <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-xl font-bold text-white">
              AGOTADO
            </span>
          )}
        </div>
      </Link>

      <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
        <h3
          className={`font-semibold text-gray-900 ${
            viewMode === "list" ? "text-lg" : "text-md line-clamp-2"
          }`}
        >
          <Link href={`/producto/${product.slug}`} className="hover:text-blue-600">
            {product.name}
          </Link>
        </h3>

        {product.rating && (
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating || 0) ? "fill-current" : ""
                  }`}
                />
              ))}
            </div>
            <span className="ml-1">({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            {product.originalPrice && (
              <p className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </p>
            )}
            <p className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </p>
          </div>

          <button
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            {isOutOfStock ? "Agotado" : "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}
