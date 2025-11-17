'use client'

// Checkout Page - Flujo de checkout con wizard de 3 pasos
// Paso 1: Dirección de envío, Paso 2: Método de pago, Paso 3: Revisión

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/store/useCart'

type CheckoutStep = 1 | 2 | 3

interface ShippingAddress {
  fullName: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = useCart((state) => state.items)
  const subtotal = useCart((state) => state.subtotal)
  const tax = useCart((state) => state.tax)
  const shipping = useCart((state) => state.shipping)
  const total = useCart((state) => state.total)
  const clear = useCart((state) => state.clear)

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'MX',
    phone: '',
  })

  // Hidratar store
  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true)
  }, [])

  // Redirigir si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/shop/checkout')
    }
  }, [status, router])

  // Redirigir si carrito vacío
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push('/shop/cart')
    }
  }, [mounted, items, router])

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validar campos
    if (
      !shippingAddress.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.phone
    ) {
      setError('Por favor completa todos los campos requeridos')
      return
    }
    setError(null)
    setCurrentStep(2)
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCurrentStep(3)
  }

  const handleConfirmOrder = async () => {
    setProcessing(true)
    setError(null)

    try {
      // TODO: Aquí iría la integración completa con Stripe
      // Por ahora simulamos el proceso

      // Simular llamada a API de checkout
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Limpiar carrito
      clear()

      // Redirigir a página de confirmación
      alert('¡Orden creada exitosamente! (Demo)')
      router.push('/shop')
    } catch (err) {
      console.error('Error en checkout:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
      setProcessing(false)
    }
  }

  if (status === 'loading' || !mounted) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // El redirect se hace en useEffect
  }

  if (items.length === 0) {
    return null // El redirect se hace en useEffect
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === currentStep
                  ? 'bg-primary text-white'
                  : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Titles */}
      <div className="flex justify-center gap-8 mb-8">
        <span
          className={`text-sm ${currentStep === 1 ? 'font-bold text-primary' : 'text-gray-500'}`}
        >
          1. Dirección
        </span>
        <span
          className={`text-sm ${currentStep === 2 ? 'font-bold text-primary' : 'text-gray-500'}`}
        >
          2. Pago
        </span>
        <span
          className={`text-sm ${currentStep === 3 ? 'font-bold text-primary' : 'text-gray-500'}`}
        >
          3. Revisión
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Dirección de Envío */}
      {currentStep === 1 && (
        <form onSubmit={handleShippingSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Dirección de Envío</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={shippingAddress.fullName}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                value={shippingAddress.address}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, address: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Código Postal *
                </label>
                <input
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">País *</label>
                <select
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, country: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="MX">México</option>
                  <option value="US">Estados Unidos</option>
                  <option value="CA">Canadá</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-primary text-white py-3 px-6 rounded-md font-bold hover:bg-primary-dark transition-colors"
          >
            Siguiente →
          </button>
        </form>
      )}

      {/* Step 2: Método de Pago */}
      {currentStep === 2 && (
        <form onSubmit={handlePaymentSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Método de Pago</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-6 mb-6">
            <p className="text-gray-700 mb-4">
              💳 Integración de Stripe estará disponible próximamente.
            </p>
            <p className="text-sm text-gray-600">
              Por ahora, continúa al siguiente paso para completar tu orden.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-md font-bold hover:bg-gray-300 transition-colors"
            >
              ← Atrás
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-3 px-6 rounded-md font-bold hover:bg-primary-dark transition-colors"
            >
              Revisar Orden →
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Revisión */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Resumen de items */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Resumen de Orden</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex justify-between items-center text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-gray-600">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold text-primary mb-2">Dirección de Envío</h3>
            <p className="text-sm text-gray-700">
              {shippingAddress.fullName}
              <br />
              {shippingAddress.address}
              <br />
              {shippingAddress.city}, {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
              <br />
              Tel: {shippingAddress.phone}
            </p>
          </div>

          {/* Totales */}
          <div className="bg-neutral-light border border-gray-200 rounded-lg p-6">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Impuesto (16%):</span>
                <span>${tax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Envío:</span>
                <span>
                  {shipping() === 0 ? (
                    <span className="text-green-600">Gratis</span>
                  ) : (
                    `$${shipping().toFixed(2)}`
                  )}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between text-xl font-bold text-primary">
                <span>Total:</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={processing}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-md font-bold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Atrás
            </button>
            <button
              onClick={handleConfirmOrder}
              disabled={processing}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : `Confirmar Pago $${total().toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
