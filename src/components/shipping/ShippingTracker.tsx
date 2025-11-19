"use client"

import * as React from "react"
import {
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  ExternalLink,
  Copy,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TrackingEvent {
  id: string
  status: string
  location: string
  timestamp: Date
  description: string
}

interface ShippingTrackerProps {
  trackingNumber: string
  carrier: string
  estimatedDelivery?: string
  currentStatus: "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered"
  events?: TrackingEvent[]
}

const statusConfig = {
  pending: {
    label: "Pendiente de Recolección",
    icon: Clock,
    color: "text-warning bg-warning/10",
    step: 0,
  },
  picked_up: {
    label: "Recolectado",
    icon: Package,
    color: "text-accent bg-accent/10",
    step: 1,
  },
  in_transit: {
    label: "En Tránsito",
    icon: Truck,
    color: "text-primary bg-primary/10",
    step: 2,
  },
  out_for_delivery: {
    label: "En Camino a Entrega",
    icon: MapPin,
    color: "text-accent bg-accent/10",
    step: 3,
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle2,
    color: "text-success bg-success/10",
    step: 4,
  },
}

const steps = [
  { key: "pending", label: "Pendiente" },
  { key: "picked_up", label: "Recolectado" },
  { key: "in_transit", label: "En Tránsito" },
  { key: "out_for_delivery", label: "En Camino" },
  { key: "delivered", label: "Entregado" },
]

// Mock tracking events
const getMockEvents = (status: string): TrackingEvent[] => {
  const events: TrackingEvent[] = [
    {
      id: "1",
      status: "Orden recibida",
      location: "Centro de Distribución CDMX",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      description: "La orden ha sido procesada y está lista para envío",
    },
    {
      id: "2",
      status: "Recolectado por paquetería",
      location: "Centro de Distribución CDMX",
      timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
      description: "El paquete ha sido recolectado por el transportista",
    },
  ]

  if (status === "in_transit" || status === "out_for_delivery" || status === "delivered") {
    events.push({
      id: "3",
      status: "En tránsito",
      location: "Hub Querétaro",
      timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      description: "El paquete está en camino a la ciudad de destino",
    })
  }

  if (status === "out_for_delivery" || status === "delivered") {
    events.push({
      id: "4",
      status: "En camino a entrega",
      location: "Centro de Distribución Local",
      timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
      description: "El paquete está en la última milla de entrega",
    })
  }

  if (status === "delivered") {
    events.push({
      id: "5",
      status: "Entregado",
      location: "Dirección del cliente",
      timestamp: new Date(),
      description: "El paquete ha sido entregado exitosamente",
    })
  }

  return events.reverse()
}

export function ShippingTracker({
  trackingNumber,
  carrier,
  estimatedDelivery,
  currentStatus,
  events: propEvents,
}: ShippingTrackerProps) {
  const [copied, setCopied] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)

  const config = statusConfig[currentStatus]
  const StatusIcon = config.icon
  const currentStep = config.step
  const events = propEvents || getMockEvents(currentStatus)

  const copyTrackingNumber = async () => {
    await navigator.clipboard.writeText(trackingNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const refreshTracking = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setRefreshing(false)
  }

  const getCarrierTrackingUrl = (carrier: string, tracking: string) => {
    const urls: Record<string, string> = {
      Estafeta: `https://www.estafeta.com/herramientas/rastreo?wayBill=${tracking}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${tracking}`,
      "99 Minutos": `https://99minutos.com/tracking/${tracking}`,
      DHL: `https://www.dhl.com/mx-es/home/tracking.html?tracking-id=${tracking}`,
    }
    return urls[carrier] || "#"
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Rastreo de Envío
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshTracking}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tracking Number & Carrier */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Número de Guía</p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-medium">{trackingNumber}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyTrackingNumber}
              >
                <Copy className="h-3 w-3" />
              </Button>
              {copied && (
                <span className="text-xs text-success">¡Copiado!</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paquetería</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">{carrier}</span>
              <a
                href={getCarrierTrackingUrl(carrier, trackingNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          {estimatedDelivery && (
            <div>
              <p className="text-sm text-muted-foreground">Entrega Estimada</p>
              <span className="font-medium">{estimatedDelivery}</span>
            </div>
          )}
        </div>

        {/* Current Status Badge */}
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", config.color)}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStep
              const isCurrent = index === currentStep

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center relative z-10"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      isCompleted
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground",
                      isCurrent && "ring-2 ring-success ring-offset-2"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 text-center",
                      isCompleted
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-0">
            <div
              className="h-full bg-success transition-all duration-500"
              style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Timeline Events */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">Historial de Movimientos</h4>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      index === 0 ? "bg-success" : "bg-muted-foreground/30"
                    )}
                  />
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-full bg-muted-foreground/20 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{event.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
