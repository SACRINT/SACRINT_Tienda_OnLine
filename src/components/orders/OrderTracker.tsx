/**
 * Order Tracking Component
 * Semana 35, Tarea 35.6: Order Tracking Component
 */

'use client'

import React, { useEffect, useState } from 'react'

interface OrderEvent {
  timestamp: Date
  status: string
  message: string
}

interface OrderTrackerProps {
  orderId: string
}

const statusSteps = [
  { status: 'pending', label: 'Pending', description: 'Order received' },
  { status: 'confirmed', label: 'Confirmed', description: 'Payment confirmed' },
  { status: 'processing', label: 'Processing', description: 'Order being prepared' },
  { status: 'packed', label: 'Packed', description: 'Ready to ship' },
  { status: 'shipped', label: 'Shipped', description: 'On the way' },
  { status: 'delivered', label: 'Delivered', description: 'Delivered' },
]

export function OrderTracker({ orderId }: OrderTrackerProps) {
  const [order, setOrder] = useState<any>(null)
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Fetch order details
        const response = await fetch(`/api/orders/${orderId}`)
        const data = await response.json()

        if (!response.ok) {
          setError('Order not found')
          return
        }

        setOrder(data.order)

        // Fetch timeline
        const timelineResponse = await fetch(`/api/orders/${orderId}/timeline`)
        const timelineData = await timelineResponse.json()

        if (timelineResponse.ok) {
          setEvents(timelineData.events || [])
        }
      } catch (err) {
        setError('Failed to load order information')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return <div className="text-center py-8">Loading order information...</div>
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === order?.status)

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-gray-900">Order {order?.orderId}</h2>
        <p className="mt-2 text-gray-600">Created on {new Date(order?.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Status Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>

        <div className="mt-8 space-y-4">
          {statusSteps.map((step, index) => (
            <div key={step.status} className="flex items-start">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full border-2 flex items-center justify-center font-semibold ${
                    index <= currentStatusIndex
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {index <= currentStatusIndex ? '✓' : index + 1}
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`h-12 w-0.5 ${index < currentStatusIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                )}
              </div>

              {/* Status Info */}
              <div className="ml-4 pb-8">
                <p className="font-semibold text-gray-900">{step.label}</p>
                <p className="text-sm text-gray-600">{step.description}</p>

                {/* Event details if available */}
                {events.some((e) => e.status === step.status) && (
                  <p className="mt-1 text-xs text-blue-600">
                    {events.find((e) => e.status === step.status)?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Events */}
      {events.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>

          <div className="mt-4 space-y-4">
            {events
              .slice()
              .reverse()
              .map((event, index) => (
                <div key={index} className="border-l-2 border-blue-600 pl-4 py-2">
                  <p className="text-sm font-medium text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-semibold text-gray-900">{order?.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">
              {order?.total} {order?.currency}
            </span>
          </div>
          {order?.shippingInfo && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Carrier:</span>
                <span className="font-semibold text-gray-900">{order.shippingInfo.carrier}</span>
              </div>
              {order.shippingInfo.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tracking:</span>
                  <span className="font-semibold text-gray-900">{order.shippingInfo.trackingNumber}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
