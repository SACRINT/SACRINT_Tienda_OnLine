// Search Bar Component with Autocomplete
// Week 17-18: Advanced search UI

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  tenantId?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  defaultValue = "",
  placeholder = "Buscar productos...",
  showSuggestions = true,
  tenantId,
  className,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce query for autocomplete
  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!showSuggestions || !debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }

    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, showSuggestions, tenantId]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    setIsLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "5",
      });

      if (tenantId) {
        params.append("tenantId", tenantId);
      }

      const response = await fetch(`/api/search/suggestions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestionsList(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    setShowSuggestionsList(false);

    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Navigate to search results page
      const params = new URLSearchParams({ q: searchQuery });
      if (tenantId) params.append("tenantId", tenantId);
      router.push(`/search?${params}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestionsList || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSearch(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestionsList(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestionsList(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestionsList(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Loading indicator */}
        {isLoadingSuggestions && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}

        {/* Search button */}
        <Button
          onClick={() => handleSearch()}
          className="absolute right-1 top-1/2 h-8 -translate-y-1/2"
          size="sm"
        >
          Buscar
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100",
                    selectedIndex === index && "bg-gray-100",
                  )}
                >
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Compact version for header/navbar
export function SearchBarCompact({
  tenantId,
  className,
}: {
  tenantId?: string;
  className?: string;
}) {
  return (
    <SearchBar
      placeholder="Buscar..."
      showSuggestions
      tenantId={tenantId}
      className={cn("max-w-md", className)}
    />
  );
}
