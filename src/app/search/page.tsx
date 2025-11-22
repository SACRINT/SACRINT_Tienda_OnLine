// Search Results Page
// Week 17-18: Main search interface

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { ProductFilters } from "@/components/search/ProductFilters";
import { Loader2, PackageX } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import Image from "next/image";
import { RatingDisplay } from "@/components/reviews/RatingStars";

interface SearchResult {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  category: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
}

interface SearchResponse {
  products: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  facets: {
    categories: Array<{ id: string; name: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
  };
  query: string;
  resultsFound: boolean;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      const response = await fetch(`/api/search?${params}`);

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", sortBy);
    params.set("page", "1");
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-6">
          <SearchBar defaultValue={searchParams.get("q") || ""} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filters sidebar */}
          <ProductFilters facets={results?.facets} className="lg:col-span-1" />

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results header */}
            {results && (
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {results.query
                      ? `Resultados para \"${results.query}\"`
                      : "Todos los productos"}
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {results.pagination.total.toLocaleString()} productos encontrados
                  </p>
                </div>

                <Select
                  value={searchParams.get("sortBy") || "relevance"}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">M\u00e1s relevantes</SelectItem>
                    <SelectItem value="price-asc">Precio: Menor a mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: Mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor calificados</SelectItem>
                    <SelectItem value="newest">M\u00e1s nuevos</SelectItem>
                    <SelectItem value="popular">M\u00e1s populares</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}

            {/* No results */}
            {!isLoading && results && !results.resultsFound && (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white">
                <PackageX className="mb-3 h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">
                  No se encontraron productos
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Intenta con otros t\u00e9rminos de b\u00fasqueda o filtros
                </p>
              </div>
            )}

            {/* Product grid */}
            {!isLoading && results && results.resultsFound && (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop/${product.slug || product.id}`}
                      className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <PackageX className="h-12 w-12" />
                          </div>
                        )}

                        {product.stock === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white">
                              Agotado
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        {product.category && (
                          <p className="text-xs text-gray-500">
                            {product.category.name}
                          </p>
                        )}
                        <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2">
                          {product.name}
                        </h3>

                        {product.averageRating && product.reviewCount ? (
                          <div className="mt-2">
                            <RatingDisplay
                              rating={product.averageRating}
                              count={product.reviewCount}
                              size="sm"
                            />
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            ${product.price.toLocaleString()}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.compareAtPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {results.pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {Array.from({ length: results.pagination.pages }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === results.pagination.page;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            const params = new URLSearchParams(
                              searchParams.toString(),
                            );
                            params.set("page", pageNum.toString());
                            window.location.href = `/search?${params.toString()}`;
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          } border border-gray-200`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
