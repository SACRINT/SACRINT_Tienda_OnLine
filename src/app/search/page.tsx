"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { List, Grid2X2 } from "lucide-react";
import { ProductCard } from "@/app/components/shop/ProductCard";
import { Filters } from "@/app/components/shop/Filters";
import { SortDropdown } from "@/app/components/shop/SortDropdown";
import { Pagination } from "@/app/components/shop/Pagination";
import { ProductGridSkeleton } from "@/app/components/shop/ProductGridSkeleton";
import { FilterSkeleton } from "@/app/components/shop/FilterSkeleton";
import { Button } from "@/components/ui/button";

const dummyProducts = [
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
      id: "2",
      name: "Teclado Mecánico RGB",
      price: 80,
      image: "https://picsum.photos/400/300?random=2",
      rating: 4.8,
      reviewCount: 45,
      isNew: false,
      isSale: false,
      stock: 0,
      slug: "teclado-mecanico-rgb",
    },
];

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const sortOption = searchParams.get("sort") || "relevance";

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching products based on search query
    setTimeout(() => {
      const filtered = dummyProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts(filtered);
      setIsLoading(false);
    }, 1000);
  }, [searchQuery]);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortOption === "price-asc") return a.price - b.price;
    if (sortOption === "price-desc") return b.price - a.price;
    if (sortOption === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0; // relevance
  });


  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Resultados para &quot;{searchQuery}&quot;</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {isLoading ? <FilterSkeleton /> : <Filters />}

        {/* Contenido Principal de Productos */}
        <div className="lg:col-span-3">
          {/* Top Bar: Resultados, Ordenamiento, Vista */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              Mostrando {sortedProducts.length} resultados
            </p>

            <div className="flex items-center space-x-4">
              <SortDropdown />

              {/* Botón de Vista */}
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md ${
                    viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                >
                  <Grid2X2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md ${
                    viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <ProductGridSkeleton />
          ) : error ? (
            <div className="text-center py-16 text-red-500">
              <p>{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">Reintentar</Button>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
                <p>No se encontraron productos para &quot;{searchQuery}&quot;.</p>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination
              totalItems={sortedProducts.length}
              itemsPerPage={9} // Assuming 9 items per page for a 3-col grid
              currentPage={parseInt(searchParams.get("page") || "1")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}