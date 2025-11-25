"use client";

import Link from "next/link";
import { ProductCard } from "@/app/components/shop/ProductCard";
import { HeartCrack } from "lucide-react";

// Dummy Wishlist Products
const dummyWishlistProducts = [
  {
    id: "1",
    name: "Laptop Gamer X1",
    price: 1200,
    originalPrice: 1500,
    image: "https://picsum.photos/400/300?random=1",
    rating: 4.5,
    reviewCount: 120,
    isNew: true,
    isSale: true,
    stock: 5,
    slug: "laptop-gamer-x1",
  },
  {
    id: "3",
    name: "Mouse Inalámbrico Ergonómico",
    price: 35,
    image: "https://picsum.photos/400/300?random=3",
    rating: 4.2,
    reviewCount: 80,
    isNew: false,
    isSale: true,
    stock: 20,
    slug: "mouse-inalambrico-ergonomico",
  },
  {
    id: "5",
    name: "Auriculares Gaming Pro",
    price: 95,
    image: "https://picsum.photos/400/300?random=5",
    rating: 4.6,
    reviewCount: 90,
    isNew: false,
    isSale: true,
    stock: 15,
    slug: "auriculares-gaming-pro",
  },
];

export default function WishlistPage() {
  const wishlistProducts = dummyWishlistProducts; // In a real app, fetch from user's wishlist

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Mi Lista de Deseos
      </h1>

      {wishlistProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <HeartCrack className="h-24 w-24 mb-6" />
          <p className="text-xl font-medium mb-4">
            Tu lista de deseos está vacía.
          </p>
          <p className="text-center mb-8">
            ¡Explora nuestros productos y añade tus favoritos para no perderlos de vista!
          </p>
          <Link
            href="/shop"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Seguir Comprando
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {wishlistProducts.length > 0 && (
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-block rounded-lg border border-blue-600 px-8 py-3 text-sm font-medium text-blue-600 shadow hover:bg-blue-50"
          >
            Seguir Comprando
          </Link>
        </div>
      )}
    </div>
  );
}