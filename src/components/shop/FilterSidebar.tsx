// Filter Sidebar Component
// Advanced filtering for products (price, category, rating, availability)

'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, DollarSign, Star, Package } from 'lucide-react'

export interface FilterOptions {
  categories?: { id: string; name: string; count: number }[]
  priceRange?: { min: number; max: number }
  ratings?: number[]
}

export interface ActiveFilters {
  categories: string[]
  priceMin?: number
  priceMax?: number
  minRating?: number
  inStock?: boolean
  onSale?: boolean
}

export interface FilterSidebarProps {
  options: FilterOptions
  activeFilters: ActiveFilters
  onFilterChange: (filters: ActiveFilters) => void
  onClearAll?: () => void
  className?: string
}

export function FilterSidebar({
  options,
  activeFilters,
  onFilterChange,
  onClearAll,
  className = '',
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    availability: true,
  })

  const [localPriceMin, setLocalPriceMin] = useState(
    activeFilters.priceMin?.toString() || ''
  )
  const [localPriceMax, setLocalPriceMax] = useState(
    activeFilters.priceMax?.toString() || ''
  )

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = activeFilters.categories.includes(categoryId)
      ? activeFilters.categories.filter((id) => id !== categoryId)
      : [...activeFilters.categories, categoryId]

    onFilterChange({
      ...activeFilters,
      categories: newCategories,
    })
  }

  const handlePriceChange = () => {
    const min = localPriceMin ? parseFloat(localPriceMin) : undefined
    const max = localPriceMax ? parseFloat(localPriceMax) : undefined

    onFilterChange({
      ...activeFilters,
      priceMin: min,
      priceMax: max,
    })
  }

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...activeFilters,
      minRating: activeFilters.minRating === rating ? undefined : rating,
    })
  }

  const handleAvailabilityToggle = (type: 'inStock' | 'onSale') => {
    onFilterChange({
      ...activeFilters,
      [type]: !activeFilters[type],
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (activeFilters.categories.length > 0) count += activeFilters.categories.length
    if (activeFilters.priceMin || activeFilters.priceMax) count += 1
    if (activeFilters.minRating) count += 1
    if (activeFilters.inStock) count += 1
    if (activeFilters.onSale) count += 1
    return count
  }

  const activeCount = getActiveFilterCount()

  return (
    <aside className={`w-full ${className}`}>
      <div className="rounded-lg border border-gray-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            {activeCount > 0 && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Categories */}
        {options.categories && options.categories.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('categories')}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className="font-semibold text-gray-900">Categories</span>
              {expandedSections.categories ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSections.categories && (
              <div className="px-4 pb-4 space-y-2">
                {options.categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={activeFilters.categories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({category.count})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Range */}
        {options.priceRange && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('price')}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <span className="font-semibold text-gray-900">Price Range</span>
              </div>
              {expandedSections.price ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            {expandedSections.price && (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={localPriceMin}
                    onChange={(e) => setLocalPriceMin(e.target.value)}
                    onBlur={handlePriceChange}
                    placeholder={`Min ($${options.priceRange.min})`}
                    min={options.priceRange.min}
                    max={options.priceRange.max}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={localPriceMax}
                    onChange={(e) => setLocalPriceMax(e.target.value)}
                    onBlur={handlePriceChange}
                    placeholder={`Max ($${options.priceRange.max})`}
                    min={options.priceRange.min}
                    max={options.priceRange.max}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Range: ${options.priceRange.min} - ${options.priceRange.max}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleSection('rating')}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-gray-500" />
              <span className="font-semibold text-gray-900">Rating</span>
            </div>
            {expandedSections.rating ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedSections.rating && (
            <div className="px-4 pb-4 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                    activeFilters.minRating === rating
                      ? 'bg-blue-50 text-blue-900'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm">& up</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Availability */}
        <div>
          <button
            onClick={() => toggleSection('availability')}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              <span className="font-semibold text-gray-900">Availability</span>
            </div>
            {expandedSections.availability ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          {expandedSections.availability && (
            <div className="px-4 pb-4 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={activeFilters.inStock || false}
                  onChange={() => handleAvailabilityToggle('inStock')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  In Stock Only
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={activeFilters.onSale || false}
                  onChange={() => handleAvailabilityToggle('onSale')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  On Sale
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
