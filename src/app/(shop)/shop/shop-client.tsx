"use client";

import { Suspense, useState } from "react";
import {
  ShopHero,
  ProductCard,
  FilterSidebar,
} from "@/components/shop";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  originalPrice: number;
  image: string;
  rating?: number;
  reviewCount: number;
  inStock: boolean;
  category: string;
  categorySlug?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface ShopPageClientProps {
  products: Product[];
  categories: Category[];
}

export function ShopPageClient({ products, categories }: ShopPageClientProps) {
  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesStock = !inStockOnly || product.inStock;
    const matchesSale = !onSaleOnly || (product.salePrice && product.salePrice < product.originalPrice);

    return matchesCategory && matchesPrice && matchesStock && matchesSale;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "newest":
        return 0; // Products already sorted by createdAt desc
      default:
        return 0;
    }
  });

  const filterOptions = {
    categories,
    priceRange: { min: 0, max: 50000 },
    ratings: [5, 4, 3, 2, 1],
  };

  const activeFilters = {
    categories: selectedCategories,
    inStock: inStockOnly,
    onSale: onSaleOnly,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <ShopHero
        title="Descubre Productos Increíbles"
        subtitle="Explora las últimas tendencias y encuentra exactamente lo que necesitas"
        ctaText="Empezar a Comprar"
        ctaLink="#products"
        showSearch={true}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4">
              <FilterSidebar
                options={filterOptions}
                activeFilters={activeFilters}
                onFilterChange={(filters) => {
                  if (filters.categories) {
                    setSelectedCategories(filters.categories);
                  }
                  if (filters.inStock !== undefined) {
                    setInStockOnly(filters.inStock);
                  }
                  if (filters.onSale !== undefined) {
                    setOnSaleOnly(filters.onSale);
                  }
                }}
                onClearAll={() => {
                  setSelectedCategories([]);
                  setInStockOnly(false);
                  setOnSaleOnly(false);
                  setPriceRange([0, 50000]);
                }}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3" id="products">
            {/* Results Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Todos los Productos
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Mostrando {sortedProducts.length} de {products.length} productos
                </p>
              </div>

              {/* Sort Dropdown */}
              <select
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Destacados</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="rating">Mejor Calificación</option>
                <option value="newest">Más Nuevos</option>
              </select>
            </div>

            {/* Products Grid */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No se encontraron productos con los filtros seleccionados.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setInStockOnly(false);
                    setOnSaleOnly(false);
                  }}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-96 animate-pulse rounded-lg bg-gray-200"
                      />
                    ))}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      slug={product.slug}
                      image={product.image}
                      price={product.price}
                      salePrice={product.salePrice}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      inStock={product.inStock}
                      category={product.category}
                      onAddToCart={(productId) => {
                        console.log("Add to cart:", productId);
                        // TODO: Implement cart functionality
                      }}
                      onToggleWishlist={(productId) => {
                        console.log("Toggle wishlist:", productId);
                        // TODO: Implement wishlist functionality
                      }}
                    />
                  ))}
                </div>
              </Suspense>
            )}

            {/* Pagination */}
            {sortedProducts.length > 0 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  disabled
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                  1
                </button>
                <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Siguiente
                </button>
              </div>
            )}

            {/* Newsletter Section */}
            <div className="mt-16 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
              <h2 className="text-2xl font-bold text-white">
                Obtén 10% de Descuento en tu Primera Compra
              </h2>
              <p className="mt-2 text-blue-100">
                Suscríbete a nuestro boletín para ofertas exclusivas y actualizaciones
              </p>
              <form className="mx-auto mt-6 flex max-w-md gap-2">
                <input
                  type="email"
                  placeholder="Ingresa tu email"
                  className="flex-1 rounded-lg border-0 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                >
                  Suscribirse
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
