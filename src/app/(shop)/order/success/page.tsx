// Order Success Page
// Confirmation page after successful order placement

import Link from 'next/link'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const orderId = searchParams.orderId || 'ORD-2024-0001'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Order Placed Successfully!
          </h1>
          <p className="mt-2 text-gray-600">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {/* Order Details */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Details
            </h2>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number</span>
              <span className="font-mono font-semibold text-gray-900">
                #{orderId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">$269.99</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">What&apos;s Next?</h3>
          <ul className="mt-4 space-y-3 text-sm text-blue-800">
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>
                A confirmation email has been sent to your email address with your
                order details
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Package className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>
                Your order will be processed within 1-2 business days
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>
                You&apos;ll receive a tracking number once your order ships
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href={`/account/orders/${orderId}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <span>View Order</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/shop"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <Link href="/support" className="font-medium text-blue-600 hover:text-blue-700">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
