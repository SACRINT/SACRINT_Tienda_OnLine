"use client";

import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import analytics from "@/lib/analytics/events";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Dummy data for suggestions
const dummySuggestions = {
  products: [
    { id: "1", name: "Laptop Gamer X1", image: "https://picsum.photos/50/50?random=1", slug: "laptop-gamer-x1" },
    { id: "2", name: "Teclado Mecánico RGB", image: "https://picsum.photos/50/50?random=2", slug: "teclado-mecanico-rgb" },
    { id: "3", name: "Mouse Inalámbrico Ergonómico", image: "https://picsum.photos/50/50?random=3", slug: "mouse-inalambrico-ergonomico" },
  ],
  categories: [
    { id: "cat1", name: "Electrónica", slug: "electronica" },
    { id: "cat2", name: "Accesorios Gaming", slug: "accesorios-gaming" },
  ],
  trending: ["Laptop", "Auriculares", "Smartwatch"],
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof dummySuggestions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      analytics.trackSearch({ query: query.trim() });
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) {
      // Simulate API call for suggestions
      setTimeout(() => {
        setSuggestions(dummySuggestions);
        setIsOpen(true);
      }, 300);
    } else {
      setSuggestions(null);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions(null);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative flex-grow">
          <Input
            type="search"
            placeholder="Buscar productos, categorías..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length > 2 && setIsOpen(true)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <X />
            </button>
          )}
        </div>
        <Button type="submit" className="ml-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Buscar
        </Button>
      </form>

      {isOpen && suggestions && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-md border border-gray-200 bg-white shadow-lg">
          {suggestions.products.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold uppercase text-gray-500">Productos</p>
              <div className="mt-2 space-y-2">
                {suggestions.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/producto/${product.slug}`}
                    className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image src={product.image} alt={product.name} width={40} height={40} className="rounded-sm" />
                    <span className="text-sm text-gray-800">{product.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {suggestions.categories.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-xs font-semibold uppercase text-gray-500">Categorías</p>
              <div className="mt-2 space-y-2">
                {suggestions.categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.slug}`}
                    className="block text-sm text-gray-800 hover:bg-gray-50 p-2 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {suggestions.trending.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">Populares</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.trending.map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
