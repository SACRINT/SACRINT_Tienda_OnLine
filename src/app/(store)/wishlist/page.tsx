"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/store/useWishlist";
import { useCart } from "@/lib/store/useCart";

export default function WishlistPage() {
  const { items, removeItem, clear } = useWishlist();
  const { addItem: addToCart } = useCart();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    useWishlist.persist.rehydrate();
    useCart.persist.rehydrate();
    setMounted(true);
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      productId: item.productId,
      variantId: null,
      quantity: 1,
      price: item.price,
      name: item.name,
      image: item.image,
      sku: item.slug,
    });
    removeItem(item.productId);
  };

  const handleAddAllToCart = () => {
    items.forEach((item) => {
      addToCart({
        productId: item.productId,
        variantId: null,
        quantity: 1,
        price: item.price,
        name: item.name,
        image: item.image,
        sku: item.slug,
      });
    });
    clear();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Tu lista de deseos está vacía</h1>
          <p className="text-muted-foreground mb-8">
            Guarda tus productos favoritos para comprarlos más tarde
          </p>
          <Button asChild>
            <Link href="/shop">
              Explorar Productos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Lista de Deseos</h1>
            <p className="text-muted-foreground mt-1">
              {items.length} {items.length === 1 ? "producto" : "productos"} guardados
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline" onClick={clear}>
              Limpiar Lista
            </Button>
            <Button onClick={handleAddAllToCart}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar Todo al Carrito
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-lg shadow-soft overflow-hidden group"
            >
              <div className="relative aspect-square bg-neutral-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    📦
                  </div>
                )}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  aria-label="Eliminar de lista de deseos"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>

              <div className="p-4">
                <Link href={`/shop/products/${item.slug}`}>
                  <h3 className="font-semibold text-primary hover:text-accent transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                </Link>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(item.price)}
                  </span>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Agregar al Carrito
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
