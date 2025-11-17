// Review Form Component
// Submit product review with rating, title, and comment

'use client'

import { useState } from 'react'
import { Star, X, Send, AlertCircle } from 'lucide-react'

export interface ReviewFormProps {
  productId: string
  productName?: string
  productImage?: string
  onSubmit?: (data: ReviewFormData) => Promise<void>
  onCancel?: () => void
  isModal?: boolean
}

export interface ReviewFormData {
  productId: string
  rating: number
  title: string
  comment: string
}

export function ReviewForm({
  productId,
  productName,
  productImage,
  onSubmit,
  onCancel,
  isModal = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<{
    rating?: string
    title?: string
    comment?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (rating === 0) {
      newErrors.rating = 'Please select a rating'
    }

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must not exceed 100 characters'
    }

    if (!comment.trim()) {
      newErrors.comment = 'Review is required'
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters'
    } else if (comment.trim().length > 500) {
      newErrors.comment = 'Review must not exceed 500 characters'
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
        productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      })

      // Reset form on success
      setRating(0)
      setTitle('')
      setComment('')
      setErrors({})
    } catch (error) {
      console.error('Failed to submit review:', error)
      setErrors({
        comment: 'Failed to submit review. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingClick = (value: number) => {
    setRating(value)
    if (errors.rating) {
      setErrors({ ...errors, rating: undefined })
    }
  }

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Info (if provided) */}
      {(productName || productImage) && (
        <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
          {productImage && (
            <img
              src={productImage}
              alt={productName}
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
          {productName && (
            <div>
              <p className="text-sm text-gray-600">Writing review for:</p>
              <p className="font-semibold text-gray-900">{productName}</p>
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Rating *
        </label>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-sm font-medium text-gray-700">
              {rating} out of 5 stars
            </span>
          )}
        </div>
        {errors.rating && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.rating}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-gray-700"
        >
          Review Title *
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (errors.title) {
              setErrors({ ...errors, title: undefined })
            }
          }}
          className={`mt-1 w-full rounded-lg border ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          } bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Summarize your experience"
          maxLength={100}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.title ? (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.title}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">
              {title.length}/100 characters
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-gray-700"
        >
          Your Review *
        </label>
        <textarea
          id="review-comment"
          rows={6}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value)
            if (errors.comment) {
              setErrors({ ...errors, comment: undefined })
            }
          }}
          className={`mt-1 w-full rounded-lg border ${
            errors.comment ? 'border-red-300' : 'border-gray-300'
          } bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Share your thoughts about this product..."
          maxLength={500}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.comment ? (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.comment}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">
              {comment.length}/500 characters
            </span>
          )}
        </div>
      </div>

      {/* Guidelines */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">Review Guidelines</p>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>• Be honest and objective about your experience</li>
          <li>• Focus on product quality, features, and value</li>
          <li>• Avoid offensive language or personal attacks</li>
          <li>• Include helpful details for other shoppers</li>
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
          <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
        </button>
      </div>
    </form>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Write a Review
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
        Write a Review
      </h3>
      {FormContent}
    </div>
  )
}
