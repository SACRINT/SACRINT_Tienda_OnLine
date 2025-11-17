// Address Selector Component
// Select existing address or add new one for checkout

'use client'

import { useState } from 'react'
import { MapPin, Plus, Check, Edit2, X } from 'lucide-react'
import type { Address } from '@/components/account'

export interface AddressSelectorProps {
  addresses: Address[]
  selectedAddressId?: string
  onAddressSelect: (address: Address) => void
  onAddNewAddress?: (address: Omit<Address, 'id'>) => Promise<void>
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onAddressSelect,
  onAddNewAddress,
}: AddressSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    type: 'shipping',
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    isDefault: false,
  })

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onAddNewAddress?.(newAddress as Omit<Address, 'id'>)
      setIsAddingNew(false)
      // Reset form
      setNewAddress({
        type: 'shipping',
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        phone: '',
        isDefault: false,
      })
    } catch (error) {
      console.error('Failed to save address:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Select Shipping Address
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Choose where you'd like your order delivered
        </p>
      </div>

      {/* Existing Addresses */}
      {addresses.length > 0 && !isAddingNew && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <button
              key={address.id}
              onClick={() => onAddressSelect(address)}
              className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                selectedAddressId === address.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Selected Checkmark */}
              {selectedAddressId === address.id && (
                <div className="absolute right-3 top-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {/* Default Badge */}
              {address.isDefault && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                    <Check className="h-3 w-3" />
                    Default
                  </span>
                </div>
              )}

              {/* Address Content */}
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-gray-400" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{address.fullName}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                    <p className="mt-2 font-medium">{address.phone}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add New Address Button */}
      {!isAddingNew && (
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-4 text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add New Address</span>
        </button>
      )}

      {/* New Address Form */}
      {isAddingNew && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Address
            </h3>
            <button
              onClick={() => setIsAddingNew(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSaveNewAddress} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newAddress.fullName}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, fullName: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={newAddress.addressLine1}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, addressLine1: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Line 2
              </label>
              <input
                type="text"
                value={newAddress.addressLine2}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, addressLine2: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apt, suite, etc. (optional)"
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, city: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, state: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress.postalCode}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, postalCode: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <select
                  required
                  value={newAddress.country}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, country: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                  <option>United Kingdom</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={newAddress.phone}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, phone: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Save as Default */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="setDefault"
                checked={newAddress.isDefault}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, isDefault: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="setDefault" className="text-sm text-gray-700">
                Save as default shipping address
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
