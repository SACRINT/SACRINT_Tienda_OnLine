// Refund Request Component
// Submit return/refund request for orders

'use client'
import Image from 'next/image'

import { useState } from 'react'
import { Package, Upload, X, Send, AlertCircle } from 'lucide-react'

export interface RefundRequestProps {
  order: {
    id: string
    orderNumber: string
    items: Array<{
      id: string
      productName: string
      productImage?: string
      quantity: number
      price: number
    }>
  }
  onSubmit?: (data: RefundRequestData) => Promise<void>
  onCancel?: () => void
  isModal?: boolean
}

export interface RefundRequestData {
  orderId: string
  itemIds: string[]
  reason: string
  description: string
  images?: string[]
}

const REFUND_REASONS = [
  'Defective or damaged product',
  'Wrong item received',
  'Item not as described',
  'Changed my mind',
  'Found better price elsewhere',
  'Quality not as expected',
  'Other',
]

export function RefundRequest({
  order,
  onSubmit,
  onCancel,
  isModal = false,
}: RefundRequestProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [errors, setErrors] = useState<{
    items?: string
    reason?: string
    description?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (selectedItems.length === 0) {
      newErrors.items = 'Please select at least one item to return'
    }

    if (!reason) {
      newErrors.reason = 'Please select a reason for return'
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide a detailed description'
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    } else if (description.trim().length > 500) {
      newErrors.description = 'Description must not exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit?.({
        orderId: order.id,
        itemIds: selectedItems,
        reason,
        description: description.trim(),
        images,
      })

      // Reset form on success
      setSelectedItems([])
      setReason('')
      setDescription('')
      setImages([])
      setErrors({})
    } catch (error) {
      console.error('Failed to submit refund request:', error)
      setErrors({
        description: 'Failed to submit request. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
    if (errors.items) {
      setErrors({ ...errors, items: undefined })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // In production, upload to cloud storage
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Info */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Return Request for Order:</p>
        <p className="font-mono text-lg font-semibold text-gray-900">
          #{order.orderNumber}
        </p>
      </div>

      {/* Select Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Select Items to Return *
        </label>
        <div className="mt-2 space-y-2">
          {order.items.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-4 rounded-lg border ${
                selectedItems.includes(item.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              } p-4 transition-colors`}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => handleItemToggle(item.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {item.productImage ? (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            </label>
          ))}
        </div>
        {errors.items && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.items}</span>
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <label
          htmlFor="return-reason"
          className="block text-sm font-medium text-gray-700"
        >
          Reason for Return *
        </label>
        <select
          id="return-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            if (errors.reason) {
              setErrors({ ...errors, reason: undefined })
            }
          }}
          className={`mt-1 w-full rounded-lg border ${
            errors.reason ? 'border-red-300' : 'border-gray-300'
          } bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">Select a reason</option>
          {REFUND_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {errors.reason && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.reason}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="return-description"
          className="block text-sm font-medium text-gray-700"
        >
          Detailed Description *
        </label>
        <textarea
          id="return-description"
          rows={6}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (errors.description) {
              setErrors({ ...errors, description: undefined })
            }
          }}
          className={`mt-1 w-full rounded-lg border ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          } bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Please provide details about the issue or reason for return..."
          maxLength={500}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.description ? (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.description}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">
              {description.length}/500 characters
            </span>
          )}
        </div>
      </div>

      {/* Upload Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Photos (Optional)
        </label>
        <p className="mt-1 text-sm text-gray-600">
          Add photos to help us understand the issue better
        </p>

        <div className="mt-2">
          <label
            htmlFor="image-upload"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Images</span>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4">
            {images.map((img, index) => (
              <div key={index} className="relative">
                <Image
                  src={img}
                  alt={`Upload ${index + 1}`}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return Policy Notice */}
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-sm font-medium text-yellow-900">
          Return Policy Reminder
        </p>
        <ul className="mt-2 space-y-1 text-sm text-yellow-800">
          <li>• Returns must be requested within 30 days of delivery</li>
          <li>• Items must be unused and in original packaging</li>
          <li>• Refunds will be processed within 5-7 business days</li>
          <li>• Original shipping costs are non-refundable</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
        </button>
      </div>
    </form>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Request Return/Refund
            </h3>
            <button
              onClick={onCancel}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">{FormContent}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-xl font-semibold text-gray-900">
        Request Return/Refund
      </h3>
      {FormContent}
    </div>
  )
}
