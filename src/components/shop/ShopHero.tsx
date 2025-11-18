// Shop Hero Component
// Hero section for shop homepage with CTA and background

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ShoppingBag, Sparkles } from "lucide-react";

interface ShopHeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  showSearch?: boolean;
}

export function ShopHero({
  title = "Discover Amazing Products",
  subtitle = "Shop the latest trends and find exactly what you need",
  ctaText = "Shop Now",
  ctaLink = "/shop",
  backgroundImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
  showSearch = true,
}: ShopHeroProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span>New arrivals weekly</span>
          </div>

          {/* Title */}
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-lg text-gray-200 sm:text-xl">
            {subtitle}
          </p>

          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="mt-8 w-full max-w-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full rounded-lg border-0 bg-white py-4 pl-12 pr-4 text-gray-900 shadow-lg ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span>Search</span>
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>
          )}

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>{ctaText}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/shop/categories"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span>Browse Categories</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-12">
            <div className="text-center lg:text-left">
              <div className="text-3xl font-bold text-white sm:text-4xl">
                10K+
              </div>
              <div className="mt-1 text-sm text-gray-300">Products</div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-3xl font-bold text-white sm:text-4xl">
                50K+
              </div>
              <div className="mt-1 text-sm text-gray-300">Happy Customers</div>
            </div>
            <div className="col-span-2 text-center sm:col-span-1 lg:text-left">
              <div className="text-3xl font-bold text-white sm:text-4xl">
                4.9/5
              </div>
              <div className="mt-1 text-sm text-gray-300">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
