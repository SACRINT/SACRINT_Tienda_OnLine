"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CreditCard, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CheckoutProgress, type CheckoutStep } from "@/components/ui/checkout-progress"
import { cn } from "@/lib/utils"

const checkoutSteps: CheckoutStep[] = [
  { id: "shipping", label: "Envío" },
  { id: "payment", label: "Pago" },
  { id: "review", label: "Revisar" },
  { id: "confirm", label: "Confirmar" },
]

// Mock cart summary
const cartSummary = {
  items: [
    { name: "Auriculares Bluetooth Pro Max", quantity: 1, price: 2999 },
    { name: "Camiseta Premium Algodón", quantity: 2, price: 1198 },
    { name: "Zapatillas Running Ultra", quantity: 1, price: 2499 },
  ],
  subtotal: 6696,
  shipping: 0,
  tax: 1071.36,
  total: 7767.36,
}

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima",
  "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca",
  "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa",
  "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
]

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [formData, setFormData] = React.useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    sameAsBilling: true,
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate and proceed to next step
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Cart */}
        <Link
          href="/cart"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al carrito
        </Link>

        {/* Progress */}
        <div className="mb-8">
          <CheckoutProgress steps={checkoutSteps} currentStep={currentStep} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-soft p-6">
              {currentStep === 1 && (
                <form onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-6">
                    Información de Contacto y Envío
                  </h2>

                  {/* Contact Info */}
                  <div className="space-y-4 mb-8">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      INFORMACIÓN DE CONTACTO
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Correo Electrónico *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="tu@email.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="55 1234 5678"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4 mb-8">
                    <h3 className="font-medium text-sm text-muted-foreground">
                      DIRECCIÓN DE ENVÍO
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Nombre *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Apellido *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Dirección *</Label>
                      <Input
                        id="address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Calle y número"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="addressLine2">
                        Departamento, suite, etc. (opcional)
                      </Label>
                      <Input
                        id="addressLine2"
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">Ciudad *</Label>
                        <Input
                          id="city"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">Estado *</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, state: value }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {mexicanStates.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Código Postal *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          required
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          maxLength={5}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Same as Billing */}
                  <div className="flex items-center space-x-2 mb-6">
                    <Checkbox
                      id="sameAsBilling"
                      checked={formData.sameAsBilling}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          sameAsBilling: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="sameAsBilling" className="text-sm cursor-pointer">
                      Usar la misma dirección para facturación
                    </Label>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Continuar al Pago
                  </Button>
                </form>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Método de Pago</h2>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-medium">Tarjeta de Crédito/Débito</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      La integración de pago se completará en Sprint 9
                    </p>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      className="flex-1"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Revisar Pedido</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-medium mb-2">Dirección de Envío</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.firstName} {formData.lastName}<br />
                        {formData.address}<br />
                        {formData.city}, {formData.state} {formData.postalCode}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-medium mb-2">Productos</h3>
                      {cartSummary.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm py-1">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{formatPrice(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(4)}
                      className="flex-1"
                    >
                      Confirmar Pedido
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    ¡Pedido Confirmado!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Tu número de pedido es: <span className="font-mono font-bold">#ORD-2024-001</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-8">
                    Te enviamos un correo de confirmación a {formData.email}
                  </p>
                  <Button asChild>
                    <Link href="/">Volver al Inicio</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Resumen del Pedido</h2>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {cartSummary.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} <span className="text-xs">x{item.quantity}</span>
                    </span>
                    <span>{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cartSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="text-success">Gratis</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA</span>
                  <span>{formatPrice(cartSummary.tax)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(cartSummary.total)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Pago seguro encriptado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
