"use client"

import * as React from "react"
import { Truck, Package, Zap, Clock, MapPin, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ShippingOption {
  id: string
  carrier: string
  service: string
  price: number
  estimatedDays: string
  icon: "standard" | "express" | "same-day"
}

interface ShippingCalculatorProps {
  subtotal: number
  onSelect?: (option: ShippingOption) => void
  selectedId?: string
  postalCode?: string
}

// Mock shipping options
const getShippingOptions = (postalCode: string): ShippingOption[] => [
  {
    id: "standard",
    carrier: "Estafeta",
    service: "Envío Estándar",
    price: postalCode.startsWith("0") ? 79 : 99,
    estimatedDays: "3-5 días hábiles",
    icon: "standard",
  },
  {
    id: "express",
    carrier: "FedEx",
    service: "Envío Express",
    price: postalCode.startsWith("0") ? 149 : 199,
    estimatedDays: "1-2 días hábiles",
    icon: "express",
  },
  {
    id: "same-day",
    carrier: "99 Minutos",
    service: "Mismo Día",
    price: 299,
    estimatedDays: "Hoy antes de 6pm",
    icon: "same-day",
  },
]

export function ShippingCalculator({
  subtotal,
  onSelect,
  selectedId,
  postalCode: initialPostalCode = "",
}: ShippingCalculatorProps) {
  const [postalCode, setPostalCode] = React.useState(initialPostalCode)
  const [loading, setLoading] = React.useState(false)
  const [options, setOptions] = React.useState<ShippingOption[]>([])
  const [selected, setSelected] = React.useState<string>(selectedId || "")

  const freeShippingThreshold = 999
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const calculateShipping = async () => {
    if (postalCode.length !== 5) return

    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const shippingOptions = getShippingOptions(postalCode)
    setOptions(shippingOptions)
    setLoading(false)
  }

  const handleSelect = (optionId: string) => {
    setSelected(optionId)
    const option = options.find((o) => o.id === optionId)
    if (option && onSelect) {
      onSelect(option)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "express":
        return <Truck className="h-5 w-5" />
      case "same-day":
        return <Zap className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Opciones de Envío
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Free Shipping Banner */}
        {qualifiesForFreeShipping ? (
          <div className="p-3 bg-success/10 rounded-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">
              ¡Envío gratis en tu compra!
            </span>
          </div>
        ) : (
          <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Agrega {formatPrice(freeShippingThreshold - subtotal)} más para envío gratis
            </span>
          </div>
        )}

        {/* Postal Code Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="postalCode" className="sr-only">
              Código Postal
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="postalCode"
                placeholder="Código Postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className="pl-10"
                maxLength={5}
              />
            </div>
          </div>
          <Button
            onClick={calculateShipping}
            disabled={postalCode.length !== 5 || loading}
          >
            {loading ? "Calculando..." : "Calcular"}
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* Shipping Options */}
        {!loading && options.length > 0 && (
          <RadioGroup value={selected} onValueChange={handleSelect}>
            <div className="space-y-3">
              {options.map((option) => {
                const isFree = qualifiesForFreeShipping && option.id === "standard"
                const finalPrice = isFree ? 0 : option.price

                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                      selected === option.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={option.id} />
                      <div
                        className={cn(
                          "p-2 rounded-full",
                          selected === option.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {getIcon(option.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{option.service}</p>
                          {isFree && (
                            <Badge variant="default" className="bg-success">
                              Gratis
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.carrier}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {isFree ? (
                          <>
                            <span className="line-through text-muted-foreground mr-2">
                              {formatPrice(option.price)}
                            </span>
                            <span className="text-success">Gratis</span>
                          </>
                        ) : (
                          formatPrice(finalPrice)
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {option.estimatedDays}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </RadioGroup>
        )}

        {/* No Options Message */}
        {!loading && options.length === 0 && postalCode.length === 5 && (
          <div className="text-center py-4">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Ingresa tu código postal para ver opciones de envío
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
