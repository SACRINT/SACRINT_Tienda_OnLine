// Shipping Method Component
// Select shipping speed and cost

'use client'

import { Check, Truck, Clock, Zap } from 'lucide-react'

export interface ShippingOption {
  id: string
  name: string
  description: string
  price: number
  estimatedDays: string
  icon: 'truck' | 'clock' | 'zap'
}

export interface ShippingMethodProps {
  options: ShippingOption[]
  selectedMethodId?: string
  onMethodSelect: (method: ShippingOption) => void
}

const ICON_MAP = {
  truck: Truck,
  clock: Clock,
  zap: Zap,
}

export function ShippingMethod({
  options,
  selectedMethodId,
  onMethodSelect,
}: ShippingMethodProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Choose Shipping Method
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Select how fast you&apos;d like to receive your order
        </p>
      </div>

      {/* Shipping Options */}
      <div className="space-y-4">
        {options.map((option) => {
          const Icon = ICON_MAP[option.icon]
          const isSelected = selectedMethodId === option.id
          const isFree = option.price === 0

          return (
            <button
              key={option.id}
              onClick={() => onMethodSelect(option)}
              className={`relative w-full rounded-lg border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute right-4 top-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {option.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {option.description}
                      </p>
                      <p className="mt-2 text-sm font-medium text-gray-900">
                        Estimated delivery: {option.estimatedDays}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex-shrink-0 text-right">
                  {isFree ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      FREE
                    </span>
                  ) : (
                    <p className="text-lg font-bold text-gray-900">
                      ${option.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900">
              Shipping Information
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>• Free shipping on orders over $50</li>
              <li>• Delivery times are estimates and may vary</li>
              <li>• Track your order with the tracking number provided</li>
              <li>• P.O. Boxes accepted for standard shipping only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Default shipping options (can be customized per order)
export const DEFAULT_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Regular delivery at the best value',
    price: 5.99,
    estimatedDays: '5-7 business days',
    icon: 'truck',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Faster delivery for when you need it sooner',
    price: 12.99,
    estimatedDays: '2-3 business days',
    icon: 'clock',
  },
  {
    id: 'overnight',
    name: 'Overnight Shipping',
    description: 'Next business day delivery',
    price: 24.99,
    estimatedDays: '1 business day',
    icon: 'zap',
  },
  {
    id: 'free',
    name: 'Free Standard Shipping',
    description: 'For orders over $50',
    price: 0,
    estimatedDays: '5-7 business days',
    icon: 'truck',
  },
]
