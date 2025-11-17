// Search Autocomplete Component
// Real-time search with autocomplete suggestions

'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export interface SearchSuggestion {
  id: string
  name: string
  slug: string
  price: number
  image?: string
  category?: string
}

export interface SearchAutocompleteProps {
  onSearch?: (query: string) => void
  onSuggestionsFetch?: (query: string) => Promise<SearchSuggestion[]>
  recentSearches?: string[]
  trendingSearches?: string[]
  placeholder?: string
  className?: string
}

export function SearchAutocomplete({
  onSearch,
  onSuggestionsFetch,
  recentSearches = [],
  trendingSearches = [],
  placeholder = 'Search products...',
  className = '',
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        if (onSuggestionsFetch) {
          const results = await onSuggestionsFetch(query)
          setSuggestions(results)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, onSuggestionsFetch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query)
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const suggestion = suggestions[selectedIndex]
      window.location.href = `/shop/products/${suggestion.slug}`
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0 || trendingSearches.length > 0)

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-sm text-gray-500">
              Searching...
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <Link
                  key={suggestion.id}
                  href={`/shop/products/${suggestion.slug}`}
                  className={`flex items-center gap-4 border-b border-gray-100 p-4 transition-colors last:border-0 ${
                    index === selectedIndex
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {suggestion.image && (
                    <img
                      src={suggestion.image}
                      alt={suggestion.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {suggestion.name}
                    </p>
                    {suggestion.category && (
                      <p className="text-sm text-gray-500">
                        {suggestion.category}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${suggestion.price.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              No products found for &quot;{query}&quot;
            </div>
          )}

          {/* Recent Searches */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="border-b border-gray-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="h-4 w-4" />
                <span>Recent Searches</span>
              </div>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search)
                      onSearch?.(search)
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {query.length < 2 && trendingSearches.length > 0 && (
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <TrendingUp className="h-4 w-4" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.slice(0, 6).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search)
                      onSearch?.(search)
                    }}
                    className="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
