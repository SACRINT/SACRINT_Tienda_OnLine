"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isSale?: boolean;
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Auriculares Bluetooth Pro",
    slug: "auriculares-bluetooth-pro",
    price: 1499,
    originalPrice: 1999,
    rating: 4.5,
    reviewCount: 128,
    isSale: true,
  },
  {
    id: "2",
    name: "Camiseta Premium Algodón",
    slug: "camiseta-premium-algodon",
    price: 599,
    rating: 4.8,
    reviewCount: 256,
    isNew: true,
  },
  {
    id: "3",
    name: "Lámpara LED Inteligente",
    slug: "lampara-led-inteligente",
    price: 899,
    originalPrice: 1199,
    rating: 4.2,
    reviewCount: 89,
    isSale: true,
  },
  {
    id: "4",
    name: "Zapatillas Running Ultra",
    slug: "zapatillas-running-ultra",
    price: 2499,
    rating: 4.7,
    reviewCount: 312,
    isNew: true,
  },
];

interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  products?: Product[];
  viewAllHref?: string;
}

export function FeaturedProducts({
  title = "Productos Destacados",
  subtitle = "Los favoritos de nuestros clientes",
  products = defaultProducts,
  viewAllHref = "/shop",
}: FeaturedProductsProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
            >
              <div className="relative aspect-square bg-neutral-100">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    📦
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isNew && (
                    <Badge className="bg-mint text-mint-foreground">
                      Nuevo
                    </Badge>
                  )}
                  {product.isSale && (
                    <Badge className="bg-error text-error-foreground">
                      Oferta
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 bg-white rounded-full shadow-md hover:bg-neutral-100 transition-colors"
                    aria-label="Agregar a favoritos"
                  >
                    <Heart className="h-4 w-4 text-neutral-600" />
                  </button>
                </div>

                {/* Add to Cart */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    className="w-full bg-white text-primary hover:bg-neutral-100"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Agregar al Carrito
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-semibold text-primary hover:text-accent transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>

                {product.rating && (
                  <div className="mt-2 flex items-center gap-2">
                    <RatingStars rating={product.rating} size="sm" />
                    {product.reviewCount && (
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href={viewAllHref}>
            <Button variant="outline" size="lg">
              Ver Todos los Productos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
