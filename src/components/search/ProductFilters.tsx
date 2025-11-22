// Product Filters Component
// Week 17-18: Advanced filtering sidebar

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Check, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FilterFacets {
  categories: Array<{ id: string; name: string; count: number }>;
  priceRanges: Array<{ min: number; max: number; count: number }>;
  ratings: Array<{ rating: number; count: number }>;
}

interface ProductFiltersProps {
  facets?: FilterFacets;
  onFilterChange?: (filters: Record<string, any>) => void;
  className?: string;
}

export function ProductFilters({
  facets,
  onFilterChange,
  className,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category")?.split(",").filter(Boolean) || [],
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseFloat(searchParams.get("minPrice") || "0"),
    parseFloat(searchParams.get("maxPrice") || "10000"),
  ]);
  const [selectedRating, setSelectedRating] = useState<number | null>(
    searchParams.get("minRating")
      ? parseInt(searchParams.get("minRating")!)
      : null,
  );
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStock") === "true",
  );
  const [featuredOnly, setFeaturedOnly] = useState(
    searchParams.get("featured") === "true",
  );

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Category filter
    if (selectedCategories.length > 0) {
      params.set("category", selectedCategories.join(","));
    } else {
      params.delete("category");
    }

    // Price range
    if (priceRange[0] > 0) {
      params.set("minPrice", priceRange[0].toString());
    } else {
      params.delete("minPrice");
    }

    if (priceRange[1] < 10000) {
      params.set("maxPrice", priceRange[1].toString());
    } else {
      params.delete("maxPrice");
    }

    // Rating filter
    if (selectedRating) {
      params.set("minRating", selectedRating.toString());
    } else {
      params.delete("minRating");
    }

    // Stock filter
    if (inStockOnly) {
      params.set("inStock", "true");
    } else {
      params.delete("inStock");
    }

    // Featured filter
    if (featuredOnly) {
      params.set("featured", "true");
    } else {
      params.delete("featured");
    }

    // Reset to page 1
    params.set("page", "1");

    // Update URL
    router.push(`/search?${params.toString()}`);

    // Call callback if provided
    if (onFilterChange) {
      onFilterChange({
        categories: selectedCategories,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        minRating: selectedRating,
        inStock: inStockOnly,
        featured: featuredOnly,
      });
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setSelectedRating(null);
    setInStockOnly(false);
    setFeaturedOnly(false);

    const params = new URLSearchParams();
    const query = searchParams.get("q");
    if (query) params.set("q", query);

    router.push(`/search?${params.toString()}`);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    selectedRating !== null ||
    inStockOnly ||
    featuredOnly;

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      {facets?.categories && facets.categories.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">Categorías</h3>
          <div className="space-y-2">
            {facets.categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <Label
                  htmlFor={`cat-${category.id}`}
                  className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                >
                  <span>{category.name}</span>
                  <span className="text-gray-500">({category.count})</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-900">Precio</h3>
        <div className="space-y-3">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={10000}
            step={100}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}</span>
          </div>

          {/* Price range presets */}
          {facets?.priceRanges && facets.priceRanges.length > 0 && (
            <div className="space-y-1">
              {facets.priceRanges.map((range) => (
                <button
                  key={`${range.min}-${range.max}`}
                  onClick={() => setPriceRange([range.min, range.max])}
                  className="flex w-full items-center justify-between rounded px-2 py-1 text-sm hover:bg-gray-100"
                >
                  <span>
                    ${range.min.toLocaleString()} - $
                    {range.max >= 999999 ? "+" : range.max.toLocaleString()}
                  </span>
                  <span className="text-gray-500">({range.count})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-900">Calificación</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() =>
                setSelectedRating(selectedRating === rating ? null : rating)
              }
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-100",
                selectedRating === rating && "bg-blue-50 text-blue-700",
              )}
            >
              {selectedRating === rating && <Check className="h-4 w-4" />}
              <div className="flex items-center gap-1">
                {Array.from({ length: rating }, (_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
                {Array.from({ length: 5 - rating }, (_, i) => (
                  <Star key={i} className="h-4 w-4 text-gray-300" />
                ))}
              </div>
              <span className="text-gray-600">y más</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stock & Featured */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
          />
          <Label htmlFor="inStock" className="cursor-pointer text-sm">
            Solo en stock
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={featuredOnly}
            onCheckedChange={(checked) => setFeaturedOnly(checked as boolean)}
          />
          <Label htmlFor="featured" className="cursor-pointer text-sm">
            Productos destacados
          </Label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 border-t border-gray-200 pt-4">
        <Button onClick={applyFilters} className="w-full">
          Aplicar filtros
        </Button>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="outline"
            className="w-full gap-1"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className={cn("hidden lg:block", className)}>
        <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            {hasActiveFilters && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                Activos
              </span>
            )}
          </div>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <FiltersContent />
          </ScrollArea>
        </div>
      </div>

      {/* Mobile sheet */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {[
                  selectedCategories.length > 0,
                  priceRange[0] > 0 || priceRange[1] < 10000,
                  selectedRating !== null,
                  inStockOnly,
                  featuredOnly,
                ].filter(Boolean).length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filtros de búsqueda</SheetTitle>
            <SheetDescription>
              Refina tus resultados con los filtros disponibles
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
            <div className="mt-6">
              <FiltersContent />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
