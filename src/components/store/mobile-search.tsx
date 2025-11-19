// Mobile Search Component
// Full-screen mobile search overlay

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, ArrowLeft, Clock, TrendingUp } from "lucide-react";

export interface MobileSearchProps {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  recentSearches?: string[];
  trendingSearches?: string[];
  onClearRecent?: () => void;
  placeholder?: string;
  className?: string;
}

export function MobileSearch({
  open,
  onClose,
  value,
  onChange,
  onSearch,
  recentSearches = [],
  trendingSearches = [],
  onClearRecent,
  placeholder = "Search products...",
  className,
}: MobileSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      onClose();
    }
  };

  const handleQuickSearch = (query: string) => {
    onChange(query);
    onSearch(query);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background z-50 lg:hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-muted rounded-md"
          aria-label="Close search"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 pl-10 pr-10 rounded-full border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Recent searches */}
        {recentSearches.length > 0 && !value && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Recent Searches</h3>
              {onClearRecent && (
                <button
                  onClick={onClearRecent}
                  className="text-sm text-muted-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-1">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-md text-left"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending searches */}
        {trendingSearches.length > 0 && !value && (
          <div>
            <h3 className="text-sm font-medium mb-3">Trending</h3>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSearch(search)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80"
                >
                  <TrendingUp className="h-3 w-3" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when searching */}
        {value && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3" />
            <p>Press enter to search</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileSearch;
