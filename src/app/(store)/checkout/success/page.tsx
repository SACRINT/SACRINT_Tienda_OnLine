"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Package,
  Truck,
  Mail,
  Download,
  Share2,
  ArrowRight,
  MapPin,
  CreditCard,
  Clock,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// Mock order data
const orderData = {
  orderId: "ORD-2024-7K3M9P",
  date: new Date(),
  status: "confirmed",
  email: "cliente@email.com",
  items: [
    { name: "Auriculares Bluetooth Pro Max", quantity: 1, price: 2999 },
    { name: "Camiseta Premium Algodón", quantity: 2, price: 1198 },
    { name: "Zapatillas Running Ultra", quantity: 1, price: 2499 },
  ],
  subtotal: 6696,
  shipping: 0,
  tax: 1071.36,
  total: 7767.36,
  shippingAddress: {
    name: "Juan Pérez",
    street: "Av. Reforma 123",
    neighborhood: "Juárez",
    city: "Ciudad de México",
    state: "Ciudad de México",
    postalCode: "06600",
    phone: "55 1234 5678",
  },
  shippingMethod: {
    name: "Envío Estándar",
    carrier: "Estafeta",
    estimatedDelivery: "22-25 Nov 2024",
  },
  paymentMethod: {
    type: "card",
    last4: "4242",
    brand: "Visa",
  },
}

export default function CheckoutSuccessPage() {
  const [copied, setCopied] = React.useState(false)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)

  const copyOrderId = async () => {
    await navigator.clipboard.writeText(orderData.orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-muted-foreground">
            Gracias por tu compra. Te enviamos un correo de confirmación.
          </p>
        </div>

        {/* Order ID */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Número de Pedido</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-bold font-mono text-primary">
                    {orderData.orderId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyOrderId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {copied && (
                    <span className="text-xs text-success">¡Copiado!</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(orderData.date)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Estado del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {["Confirmado", "Procesando", "Enviado", "Entregado"].map(
                (step, index) => (
                  <div key={step} className="flex flex-col items-center relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index === 0 ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 ${
                        index === 0 ? "font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                )
              )}
            </div>
            <div className="mt-4 relative h-1 bg-muted rounded-full">
              <div className="absolute h-full w-1/4 bg-success rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                Dirección de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{orderData.shippingAddress.name}</p>
              <p className="text-muted-foreground">
                {orderData.shippingAddress.street}
              </p>
              <p className="text-muted-foreground">
                {orderData.shippingAddress.neighborhood}
              </p>
              <p className="text-muted-foreground">
                {orderData.shippingAddress.city}, {orderData.shippingAddress.state}{" "}
                {orderData.shippingAddress.postalCode}
              </p>
              <p className="text-muted-foreground mt-2">
                Tel: {orderData.shippingAddress.phone}
              </p>
            </CardContent>
          </Card>

          {/* Shipping Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4" />
                Método de Envío
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{orderData.shippingMethod.name}</p>
              <p className="text-muted-foreground">
                {orderData.shippingMethod.carrier}
              </p>
              <p className="text-success mt-2">
                Entrega estimada: {orderData.shippingMethod.estimatedDelivery}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4" />
              Método de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{orderData.paymentMethod.brand}</p>
                <p className="text-sm text-muted-foreground">
                  •••• •••• •••• {orderData.paymentMethod.last4}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Productos ({orderData.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(orderData.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-success">Gratis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span>{formatPrice(orderData.tax)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(orderData.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification */}
        <Card className="mb-6 bg-accent/5 border-accent/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">
                  Confirmación enviada a {orderData.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Te notificaremos cuando tu pedido sea enviado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/account/orders">
              Ver Mis Pedidos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/shop">Continuar Comprando</Link>
          </Button>
        </div>

        {/* Help */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          ¿Tienes preguntas?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contáctanos
          </Link>
        </p>
      </div>
    </div>
  )
}
