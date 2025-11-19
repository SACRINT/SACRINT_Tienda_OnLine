// Search Bar Component
// Search input with autocomplete suggestions

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, Clock, TrendingUp } from "lucide-react";

export interface SearchSuggestion {
  id: string;
  text: string;
  type: "product" | "category" | "recent" | "trending";
  image?: string;
  price?: number;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  trendingSearches?: string[];
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  onClearRecent?: () => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  onSuggestionClick,
  onClearRecent,
  placeholder = "Search products...",
  loading,
  className,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionClick?.(suggestion);
    setIsFocused(false);
  };

  const showDropdown =
    isFocused &&
    (suggestions.length > 0 ||
      recentSearches.length > 0 ||
      trendingSearches.length > 0 ||
      loading);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className={cn(
              "w-full h-10 pl-10 pr-10 rounded-full border bg-background text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "placeholder:text-muted-foreground",
            )}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <>
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-md text-left"
                    >
                      {suggestion.image ? (
                        <img
                          src={suggestion.image}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{suggestion.text}</p>
                        {suggestion.type === "category" && (
                          <p className="text-xs text-muted-foreground">
                            Category
                          </p>
                        )}
                      </div>
                      {suggestion.price && (
                        <span className="text-sm font-medium">
                          ${suggestion.price}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Recent searches */}
              {recentSearches.length > 0 && !value && (
                <div className="border-t p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Recent Searches
                    </span>
                    {onClearRecent && (
                      <button
                        onClick={onClearRecent}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onChange(search);
                        onSearch(search);
                        setIsFocused(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md text-left"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending searches */}
              {trendingSearches.length > 0 && !value && (
                <div className="border-t p-2">
                  <div className="px-2 py-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Trending
                    </span>
                  </div>
                  {trendingSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onChange(search);
                        onSearch(search);
                        setIsFocused(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md text-left"
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{search}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
