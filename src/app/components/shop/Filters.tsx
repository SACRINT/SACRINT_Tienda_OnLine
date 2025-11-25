"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const categories = [
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Accesorios",
];
const ratings = [5, 4, 3];

export function Filters() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setSelectedRating(null);
    setInStockOnly(false);
  };

  const filtersContent = (
    <div className="space-y-6">
      {/* Categorías */}
      <div>
        <h3 className="font-semibold mb-2">Categorías</h3>
        {categories.map((category) => (
          <label key={category} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryChange(category)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span>{category}</span>
          </label>
        ))}
      </div>

      {/* Rango de Precio (Placeholder) */}
      <div>
        <h3 className="font-semibold mb-2">Precio</h3>
        <p className="text-sm text-gray-600">
          ${priceRange[0]} - ${priceRange[1]}
        </p>
        <input
          type="range"
          min="0"
          max="2000"
          value={priceRange[1]}
          onChange={(e) =>
            setPriceRange([0, parseInt(e.target.value)])
          }
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
        />
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-2">Rating</h3>
        {ratings.map((star) => (
          <label key={star} className="flex items-center space-x-2">
            <input
              type="radio"
              name="rating"
              checked={selectedRating === star}
              onChange={() => setSelectedRating(star)}
              className="rounded-full border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span>{star} Estrellas y más</span>
          </label>
        ))}
        {selectedRating !== null && (
          <button
            onClick={() => setSelectedRating(null)}
            className="text-blue-600 text-sm mt-1"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Disponibilidad */}
      <div>
        <h3 className="font-semibold mb-2">Disponibilidad</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => setInStockOnly(!inStockOnly)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span>Solo en Stock</span>
        </label>
      </div>
      <Button onClick={clearFilters} variant="outline" className="w-full">
        Limpiar Filtros
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <aside className="hidden lg:block lg:col-span-1">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros</h2>
        {filtersContent}
      </aside>

      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-xs">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {filtersContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
