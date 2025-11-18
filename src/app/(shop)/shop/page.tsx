// Shop Page
// Main shop page with products, filters, and search

import { Suspense } from "react";
import {
  ShopHero,
  ProductCard,
  FilterSidebar,
  SearchAutocomplete,
} from "@/components/shop";
import type { ProductCardProps } from "@/components/shop";

// Mock data - In production, this would come from API/Database
const getMockProducts = (): ProductCardProps[] => {
  return [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      slug: "premium-wireless-headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      price: 299.99,
      salePrice: 249.99,
      rating: 4.5,
      reviewCount: 128,
      inStock: true,
      category: "Electronics",
    },
    {
      id: "2",
      name: "Smart Watch Pro",
      slug: "smart-watch-pro",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      price: 399.99,
      rating: 4.8,
      reviewCount: 256,
      inStock: true,
      category: "Electronics",
    },
    {
      id: "3",
      name: "Designer Sunglasses",
      slug: "designer-sunglasses",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f",
      price: 149.99,
      salePrice: 99.99,
      rating: 4.2,
      reviewCount: 89,
      inStock: true,
      category: "Accessories",
    },
    {
      id: "4",
      name: "Leather Backpack",
      slug: "leather-backpack",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
      price: 129.99,
      rating: 4.6,
      reviewCount: 45,
      inStock: false,
      category: "Bags",
    },
    {
      id: "5",
      name: "Portable Bluetooth Speaker",
      slug: "portable-bluetooth-speaker",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1",
      price: 79.99,
      salePrice: 59.99,
      rating: 4.3,
      reviewCount: 312,
      inStock: true,
      category: "Electronics",
    },
    {
      id: "6",
      name: "Running Shoes",
      slug: "running-shoes",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
      price: 119.99,
      rating: 4.7,
      reviewCount: 523,
      inStock: true,
      category: "Footwear",
    },
  ];
};

const getMockCategories = () => {
  return [
    { id: "1", name: "Electronics", count: 124 },
    { id: "2", name: "Accessories", count: 89 },
    { id: "3", name: "Bags", count: 56 },
    { id: "4", name: "Footwear", count: 203 },
    { id: "5", name: "Clothing", count: 445 },
  ];
};

export default function ShopPage() {
  const products = getMockProducts();
  const categories = getMockCategories();

  const filterOptions = {
    categories,
    priceRange: { min: 0, max: 500 },
    ratings: [5, 4, 3, 2, 1],
  };

  const activeFilters = {
    categories: [],
    inStock: false,
    onSale: false,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <ShopHero
        title="Discover Amazing Products"
        subtitle="Shop the latest trends and find exactly what you need"
        ctaText="Start Shopping"
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
                  console.log("Filters changed:", filters);
                  // In production, this would update URL params and refetch products
                }}
                onClearAll={() => {
                  console.log("Clear all filters");
                  // In production, this would reset all filters
                }}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  All Products
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Showing {products.length} products
                </p>
              </div>

              {/* Sort Dropdown */}
              <select
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="featured"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Products Grid */}
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
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onAddToCart={(productId) => {
                      console.log("Add to cart:", productId);
                      // In production, this would add to cart via API
                    }}
                    onToggleWishlist={(productId) => {
                      console.log("Toggle wishlist:", productId);
                      // In production, this would toggle wishlist via API
                    }}
                  />
                ))}
              </div>
            </Suspense>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                1
              </button>
              <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>

            {/* Newsletter Section */}
            <div className="mt-16 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
              <h2 className="text-2xl font-bold text-white">
                Get 10% Off Your First Order
              </h2>
              <p className="mt-2 text-blue-100">
                Subscribe to our newsletter for exclusive deals and updates
              </p>
              <form className="mx-auto mt-6 flex max-w-md gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border-0 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
