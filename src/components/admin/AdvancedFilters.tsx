'use client'

import { useState } from 'react'
import { Filter, X, Search } from 'lucide-react'

export interface FilterOption {
  id: string
  label: string
  type: 'select' | 'range' | 'search' | 'date'
  options?: { value: string; label: string }[]
  min?: number
  max?: number
}

export interface FilterValues {
  [key: string]: any
}

interface AdvancedFiltersProps {
  filters: FilterOption[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  onClear: () => void
}

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onClear,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (filterId: string, value: any) => {
    onChange({
      ...values,
      [filterId]: value,
    })
  }

  const handleClearFilter = (filterId: string) => {
    const newValues = { ...values }
    delete newValues[filterId]
    onChange(newValues)
  }

  const activeFiltersCount = Object.keys(values).length

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            isOpen
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={onClear}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {isOpen && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {filter.label}
                  </label>
                  {values[filter.id] !== undefined && (
                    <button
                      onClick={() => handleClearFilter(filter.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {filter.type === 'select' && (
                  <select
                    value={values[filter.id] || ''}
                    onChange={(e) =>
                      handleFilterChange(filter.id, e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'search' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={values[filter.id] || ''}
                      onChange={(e) =>
                        handleFilterChange(filter.id, e.target.value)
                      }
                      placeholder={`Search ${filter.label.toLowerCase()}...`}
                      className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}

                {filter.type === 'range' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={values[filter.id]?.min || ''}
                        onChange={(e) =>
                          handleFilterChange(filter.id, {
                            ...values[filter.id],
                            min: e.target.value,
                          })
                        }
                        placeholder="Min"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        value={values[filter.id]?.max || ''}
                        onChange={(e) =>
                          handleFilterChange(filter.id, {
                            ...values[filter.id],
                            max: e.target.value,
                          })
                        }
                        placeholder="Max"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={values[filter.id] || ''}
                    onChange={(e) =>
                      handleFilterChange(filter.id, e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(values).map(([key, value]) => {
            const filter = filters.find((f) => f.id === key)
            if (!filter) return null

            let displayValue = value
            if (filter.type === 'range' && value) {
              displayValue = `${value.min || '0'} - ${value.max || '∞'}`
            } else if (filter.type === 'select' && value) {
              const option = filter.options?.find((o) => o.value === value)
              displayValue = option?.label || value
            }

            return (
              <div
                key={key}
                className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
              >
                <span>
                  {filter.label}: {displayValue}
                </span>
                <button
                  onClick={() => handleClearFilter(key)}
                  className="hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Predefined filters for products
export const PRODUCT_FILTERS: FilterOption[] = [
  {
    id: 'search',
    label: 'Search',
    type: 'search',
  },
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'books', label: 'Books' },
      // Add more categories dynamically
    ],
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'DRAFT', label: 'Draft' },
      { value: 'ARCHIVED', label: 'Archived' },
    ],
  },
  {
    id: 'price',
    label: 'Price',
    type: 'range',
  },
  {
    id: 'stock',
    label: 'Stock',
    type: 'range',
  },
]

// Predefined filters for orders
export const ORDER_FILTERS: FilterOption[] = [
  {
    id: 'search',
    label: 'Order ID / Customer',
    type: 'search',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'PROCESSING', label: 'Processing' },
      { value: 'SHIPPED', label: 'Shipped' },
      { value: 'DELIVERED', label: 'Delivered' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ],
  },
  {
    id: 'paymentMethod',
    label: 'Payment Method',
    type: 'select',
    options: [
      { value: 'CARD', label: 'Card' },
      { value: 'PAYPAL', label: 'PayPal' },
    ],
  },
  {
    id: 'total',
    label: 'Total',
    type: 'range',
  },
  {
    id: 'date',
    label: 'Date',
    type: 'date',
  },
]

// Predefined filters for customers
export const CUSTOMER_FILTERS: FilterOption[] = [
  {
    id: 'search',
    label: 'Name / Email',
    type: 'search',
  },
  {
    id: 'totalSpent',
    label: 'Total Spent',
    type: 'range',
  },
  {
    id: 'orders',
    label: 'Order Count',
    type: 'range',
  },
  {
    id: 'registeredDate',
    label: 'Registered Date',
    type: 'date',
  },
]
