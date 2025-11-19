// Search Results Component
// Search results page layout

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid, Product } from "./product-grid";
import { FilterSidebar, FilterGroup, FilterValues, ActiveFilters } from "./filter-sidebar";
import { ProductToolbar } from "./sort-dropdown";

export interface SearchResultsProps {
  query: string;
  products: Product[];
  totalResults: number;
  filters: FilterGroup[];
  filterValues: FilterValues;
  onFilterChange: (values: FilterValues) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onProductClick?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  loading?: boolean;
  className?: string;
}

export function SearchResults({
  query,
  products,
  totalResults,
  filters,
  filterValues,
  onFilterChange,
  sortValue,
  onSortChange,
  page,
  totalPages,
  onPageChange,
  onProductClick,
  onAddToCart,
  loading,
  className,
}: SearchResultsProps) {
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const handleRemoveFilter = (groupId: string, value: string) => {
    const currentValues = (filterValues[groupId] as string[]) || [];
    onFilterChange({
      ...filterValues,
      [groupId]: currentValues.filter((v) => v !== value),
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">
          {query ? (
            <>
              Search results for "{query}"
            </>
          ) : (
            "All Products"
          )}
        </h1>

        {/* Active filters */}
        <ActiveFilters
          filters={filters}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="lg:hidden"
          onClick={() => setShowMobileFilters(true)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>

        <ProductToolbar
          totalResults={totalResults}
          sortValue={sortValue}
          onSortChange={onSortChange}
          className="flex-1 lg:flex hidden"
        />
      </div>

      {/* Main content */}
      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterSidebar
            filters={filters}
            values={filterValues}
            onChange={onFilterChange}
            onClear={handleClearFilters}
          />
        </aside>

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
              {Object.keys(filterValues).length > 0 && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <ProductGrid
                products={products}
                columns={3}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute top-0 left-0 h-full w-80 max-w-full bg-background shadow-lg overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-background">
              <h2 className="font-semibold">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar
                filters={filters}
                values={filterValues}
                onChange={(values) => {
                  onFilterChange(values);
                  setShowMobileFilters(false);
                }}
                onClear={() => {
                  handleClearFilters();
                  setShowMobileFilters(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
