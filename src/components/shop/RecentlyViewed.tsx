"use client";

import Image from "next/image";
import * as React from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import { useRecentlyViewed } from "@/lib/store/useRecentlyViewed";
import { Button } from "@/components/ui/button";

interface RecentlyViewedProps {
  limit?: number;
  excludeProductId?: string;
}

export function RecentlyViewed({
  limit = 6,
  excludeProductId,
}: RecentlyViewedProps) {
  const { items, clear } = useRecentlyViewed();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    useRecentlyViewed.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Filter out current product and limit
  const filteredItems = items
    .filter((item) => item.productId !== excludeProductId)
    .slice(0, limit);

  if (filteredItems.length === 0) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold text-primary">
            Vistos Recientemente
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredItems.map((item) => (
          <Link
            key={item.productId}
            href={`/shop/products/${item.slug}`}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-soft overflow-hidden hover:shadow-medium transition-shadow">
              <div className="aspect-square bg-neutral-100 overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📦
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-primary truncate group-hover:text-accent transition-colors">
                  {item.name}
                </h3>
                <p className="text-sm font-bold text-primary mt-1">
                  {formatPrice(item.price)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
