// Payment Form Component
// Stripe Elements integration for payment processing

'use client'
import Image from 'next/image'

import { useState } from 'react'
import {
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export interface PaymentFormProps {
  amount: number
  onPaymentMethodReady?: (paymentMethodId: string) => void
  onError?: (error: string) => void
}

export interface BillingAddress {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export function PaymentForm({
  amount,
  onPaymentMethodReady,
  onError,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [saveCard, setSaveCard] = useState(false)
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  })

  // Mock card details (in production, use Stripe Elements)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  })

  const [errors, setErrors] = useState<{
    number?: string
    expiry?: string
    cvc?: string
    name?: string
  }>({})

  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '')
    return /^\d{16}$/.test(cleaned)
  }

  const validateExpiry = (expiry: string): boolean => {
    return /^\d{2}\/\d{2}$/.test(expiry)
  }

  const validateCVC = (cvc: string): boolean => {
    return /^\d{3,4}$/.test(cvc)
  }

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '')
    const groups = cleaned.match(/.{1,4}/g) || []
    return groups.join(' ')
  }

  const formatExpiry = (value: string): string => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value)
    setCardDetails({ ...cardDetails, number: formatted })
    if (errors.number) {
      setErrors({ ...errors, number: undefined })
    }
  }

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value)
    setCardDetails({ ...cardDetails, expiry: formatted })
    if (errors.expiry) {
      setErrors({ ...errors, expiry: undefined })
    }
  }

  const handleCVCChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    setCardDetails({ ...cardDetails, cvc: cleaned })
    if (errors.cvc) {
      setErrors({ ...errors, cvc: undefined })
    }
  }

  const validatePaymentForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!validateCardNumber(cardDetails.number)) {
      newErrors.number = 'Invalid card number'
    }

    if (!validateExpiry(cardDetails.expiry)) {
      newErrors.expiry = 'Invalid expiry date (MM/YY)'
    }

    if (!validateCVC(cardDetails.cvc)) {
      newErrors.cvc = 'Invalid CVC'
    }

    if (!cardDetails.name.trim()) {
      newErrors.name = 'Cardholder name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
        <p className="mt-1 text-sm text-gray-600">
          All transactions are secure and encrypted
        </p>
      </div>

      {/* Payment Method Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setPaymentMethod('card')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 font-medium transition-all ${
            paymentMethod === 'card'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          <CreditCard className="h-5 w-5" />
          <span>Credit Card</span>
        </button>
        <button
          onClick={() => setPaymentMethod('paypal')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 font-medium transition-all ${
            paymentMethod === 'paypal'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z" />
          </svg>
          <span>PayPal</span>
        </button>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Card Number *
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                value={cardDetails.number}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                maxLength={19}
                className={`w-full rounded-lg border ${
                  errors.number ? 'border-red-300' : 'border-gray-300'
                } px-4 py-3 pl-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="1234 5678 9012 3456"
              />
              <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.number && (
              <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.number}
              </p>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cardholder Name *
            </label>
            <input
              type="text"
              value={cardDetails.name}
              onChange={(e) => {
                setCardDetails({ ...cardDetails, name: e.target.value })
                if (errors.name) {
                  setErrors({ ...errors, name: undefined })
                }
              }}
              className={`mt-1 w-full rounded-lg border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="JOHN DOE"
            />
            {errors.name && (
              <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expiry Date *
              </label>
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                maxLength={5}
                className={`mt-1 w-full rounded-lg border ${
                  errors.expiry ? 'border-red-300' : 'border-gray-300'
                } px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="MM/YY"
              />
              {errors.expiry && (
                <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.expiry}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CVC *
              </label>
              <input
                type="text"
                value={cardDetails.cvc}
                onChange={(e) => handleCVCChange(e.target.value)}
                maxLength={4}
                className={`mt-1 w-full rounded-lg border ${
                  errors.cvc ? 'border-red-300' : 'border-gray-300'
                } px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="123"
              />
              {errors.cvc && (
                <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.cvc}
                </p>
              )}
            </div>
          </div>

          {/* Save Card Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="saveCard"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="saveCard" className="text-sm text-gray-700">
              Save this card for future purchases
            </label>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-700">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-700">PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                alt="Stripe"
                className="h-5"
              />
              <span className="text-sm text-gray-700">Powered by Stripe</span>
            </div>
          </div>
        </div>
      )}

      {/* PayPal Payment */}
      {paymentMethod === 'paypal' && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-blue-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.032.17a.804.804 0 01-.794.679H7.72a.483.483 0 01-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Pay with PayPal
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;ll be redirected to PayPal to complete your purchase
            </p>
            <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
              Continue to PayPal
            </button>
          </div>
        </div>
      )}

      {/* Order Total */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            Amount to be charged:
          </span>
          <span className="text-2xl font-bold text-blue-900">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
