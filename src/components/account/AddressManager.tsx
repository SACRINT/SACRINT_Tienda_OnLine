// Address Manager Component
// CRUD operations for shipping/billing addresses

'use client'

import { useState } from 'react'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Home,
  Building2,
  X,
} from 'lucide-react'

export interface Address {
  id: string
  type: 'shipping' | 'billing'
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

export interface AddressManagerProps {
  addresses: Address[]
  onAdd?: (address: Omit<Address, 'id'>) => Promise<void>
  onUpdate?: (id: string, address: Partial<Address>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onSetDefault?: (id: string) => Promise<void>
}

export function AddressManager({
  addresses,
  onAdd,
  onUpdate,
  onDelete,
  onSetDefault,
}: AddressManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Shipping Addresses
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your saved addresses for faster checkout
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add Address</span>
        </button>
      </div>

      {/* Address Grid */}
      {addresses.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No addresses saved
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Add your first shipping address to get started
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Plus className="h-5 w-5" />
            <span>Add Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => setEditingId(address.id)}
              onDelete={() => setDeletingId(address.id)}
              onSetDefault={() => onSetDefault?.(address.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingId) && (
        <AddressFormModal
          address={
            editingId
              ? addresses.find((a) => a.id === editingId)
              : undefined
          }
          onSave={async (data) => {
            if (editingId) {
              await onUpdate?.(editingId, data)
              setEditingId(null)
            } else {
              await onAdd?.(data as Omit<Address, 'id'>)
              setIsAddModalOpen(false)
            }
          }}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingId(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <DeleteConfirmModal
          onConfirm={async () => {
            await onDelete?.(deletingId)
            setDeletingId(null)
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}

// Address Card Component
function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  const Icon = address.type === 'billing' ? Building2 : Home

  return (
    <div
      className={`relative rounded-lg border ${
        address.isDefault
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white'
      } p-4`}
    >
      {/* Default Badge */}
      {address.isDefault && (
        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Check className="h-3 w-3" />
            Default
          </span>
        </div>
      )}

      {/* Address Icon & Type */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
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

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-4">
        {!address.isDefault && (
          <button
            onClick={onSetDefault}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={onEdit}
          className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-50"
          aria-label="Edit address"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50"
          aria-label="Delete address"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Address Form Modal Component
function AddressFormModal({
  address,
  onSave,
  onClose,
}: {
  address?: Address
  onSave: (data: Partial<Address>) => Promise<void>
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<Address>>(
    address || {
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
    }
  )

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Failed to save address:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {address ? 'Edit Address' : 'Add New Address'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 p-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
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
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
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
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
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
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
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
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
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
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
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
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
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
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Set as Default */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isDefault"
                className="text-sm font-medium text-gray-700"
              >
                Set as default shipping address
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-4 border-t border-gray-200 p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
    </div>
  )
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Delete Address?</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete this address? This action cannot be
          undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
