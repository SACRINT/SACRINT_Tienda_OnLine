"use client"

import * as React from "react"
import Link from "next/link"
import { Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

// Mock cart data
const initialCartItems = [
  {
    id: "1",
    productId: "prod-1",
    name: "Auriculares Bluetooth Pro Max",
    price: 2999,
    quantity: 1,
    color: "Negro",
    size: null,
    image: null,
    stock: 15,
  },
  {
    id: "2",
    productId: "prod-2",
    name: "Camiseta Premium Algodón",
    price: 599,
    quantity: 2,
    color: "Blanco",
    size: "M",
    image: null,
    stock: 20,
  },
  {
    id: "3",
    productId: "prod-3",
    name: "Zapatillas Running Ultra",
    price: 2499,
    quantity: 1,
    color: "Azul",
    size: "28",
    image: null,
    stock: 8,
  },
]

export default function CartPage() {
  const [cartItems, setCartItems] = React.useState(initialCartItems)
  const [couponCode, setCouponCode] = React.useState("")
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = React.useState(0)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeItem = (itemId: string) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId))
  }

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "DESCUENTO10") {
      setAppliedCoupon(couponCode.toUpperCase())
      setCouponDiscount(10)
      setCouponCode("")
    } else {
      alert("Cupón inválido")
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponDiscount(0)
  }

  // Calculations
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )
  const discount = subtotal * (couponDiscount / 100)
  const shipping = subtotal >= 999 ? 0 : 99
  const tax = (subtotal - discount) * 0.16
  const total = subtotal - discount + shipping + tax

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-3xl mx-auto px-4">
          <EmptyState
            variant="cart"
            title="Tu carrito está vacío"
            description="Parece que aún no has agregado productos a tu carrito. Explora nuestro catálogo para encontrar lo que buscas."
            action={{
              label: "Explorar Productos",
              onClick: () => (window.location.href = "/shop"),
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Tu Carrito</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white rounded-lg shadow-soft"
              >
                {/* Product Image */}
                <div className="shrink-0 w-24 h-24 bg-neutral-100 rounded-md flex items-center justify-center text-3xl">
                  📦
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-primary truncate">
                        {item.name}
                      </h3>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.color && <span>Color: {item.color}</span>}
                        {item.size && <span className="ml-4">Talla: {item.size}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-error transition-colors"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <QuantitySelector
                      value={item.quantity}
                      min={1}
                      max={item.stock}
                      onChange={(value) => updateQuantity(item.id, value)}
                      size="sm"
                    />
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price)} c/u
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <div className="pt-4">
              <Link
                href="/shop"
                className="inline-flex items-center text-primary hover:text-accent font-medium transition-colors"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Continuar Comprando
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Resumen del Pedido</h2>

              {/* Coupon */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">{appliedCoupon}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-sm text-error hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código de cupón"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={applyCoupon}
                      disabled={!couponCode}
                    >
                      Aplicar
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Descuento ({couponDiscount}%)</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-success">Gratis</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                size="lg"
                className="w-full mt-6"
                asChild
              >
                <Link href="/checkout">
                  Proceder al Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {/* Trust Badges */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Pago seguro con encriptación SSL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
