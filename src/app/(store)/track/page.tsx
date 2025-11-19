"use client";

import * as React from "react";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

// Demo tracking data
const demoTrackingData: Record<
  string,
  {
    orderNumber: string;
    status: string;
    estimatedDelivery: string;
    carrier: string;
    events: TrackingEvent[];
  }
> = {
  "ORD-2024-001": {
    orderNumber: "ORD-2024-001",
    status: "delivered",
    estimatedDelivery: "15 Nov 2024",
    carrier: "FedEx Express",
    events: [
      {
        date: "15 Nov",
        time: "10:30",
        status: "Entregado",
        location: "Ciudad de México",
        description: "Paquete entregado en la dirección indicada",
      },
      {
        date: "15 Nov",
        time: "08:00",
        status: "En camino",
        location: "Ciudad de México",
        description: "El paquete está en camino para entrega",
      },
      {
        date: "14 Nov",
        time: "16:45",
        status: "En centro de distribución",
        location: "CDMX Centro",
        description: "Paquete procesado en centro de distribución",
      },
      {
        date: "13 Nov",
        time: "22:00",
        status: "En tránsito",
        location: "Querétaro",
        description: "Paquete en tránsito hacia destino",
      },
      {
        date: "12 Nov",
        time: "14:30",
        status: "Enviado",
        location: "Guadalajara",
        description: "Paquete recolectado por transportista",
      },
    ],
  },
  "ORD-2024-002": {
    orderNumber: "ORD-2024-002",
    status: "processing",
    estimatedDelivery: "20 Nov 2024",
    carrier: "DHL Express",
    events: [
      {
        date: "16 Nov",
        time: "09:00",
        status: "Procesando",
        location: "Almacén SACRINT",
        description: "Pedido en preparación",
      },
      {
        date: "15 Nov",
        time: "15:30",
        status: "Confirmado",
        location: "Sistema",
        description: "Pago confirmado, procesando pedido",
      },
    ],
  },
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-6 w-6" />,
  processing: <Package className="h-6 w-6" />,
  shipped: <Truck className="h-6 w-6" />,
  delivered: <CheckCircle className="h-6 w-6" />,
};

const statusColors: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-100",
  processing: "text-blue-600 bg-blue-100",
  shipped: "text-purple-600 bg-purple-100",
  delivered: "text-green-600 bg-green-100",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = React.useState("");
  const [trackingData, setTrackingData] = React.useState<
    (typeof demoTrackingData)[string] | null
  >(null);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTrackingData(null);
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const data = demoTrackingData[orderNumber.toUpperCase()];

    if (data) {
      setTrackingData(data);
    } else {
      setError(
        "No se encontró el pedido. Verifica el número e intenta de nuevo.",
      );
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Rastrear Pedido</h1>
          <p className="text-muted-foreground mt-2">
            Ingresa tu número de orden para ver el estado de tu envío
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleTrack} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ej: ORD-2024-001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={!orderNumber || isLoading}>
                {isLoading ? "Buscando..." : "Rastrear"}
              </Button>
            </form>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <p className="text-xs text-muted-foreground mt-3">
              Prueba con: ORD-2024-001 o ORD-2024-002
            </p>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedido {trackingData.orderNumber}</CardTitle>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[trackingData.status]}`}
                  >
                    {statusLabels[trackingData.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transportista
                    </p>
                    <p className="font-medium">{trackingData.carrier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Entrega Estimada
                    </p>
                    <p className="font-medium">
                      {trackingData.estimatedDelivery}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estado Actual
                    </p>
                    <p className="font-medium">
                      {statusLabels[trackingData.status]}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    {["processing", "shipped", "delivered"].map(
                      (step, index) => (
                        <div
                          key={step}
                          className={`flex flex-col items-center ${
                            ["delivered", "shipped"].includes(
                              trackingData.status,
                            ) ||
                            (trackingData.status === "processing" &&
                              step === "processing")
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              ["delivered", "shipped"].includes(
                                trackingData.status,
                              ) ||
                              (trackingData.status === "processing" &&
                                step === "processing")
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {statusIcons[step]}
                          </div>
                          <span className="text-xs mt-1">
                            {statusLabels[step]}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.events.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === 0 ? "bg-primary" : "bg-muted"
                          }`}
                        />
                        {index < trackingData.events.length - 1 && (
                          <div className="w-0.5 h-full bg-muted flex-1 min-h-[40px]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.status}</span>
                          <span className="text-xs text-muted-foreground">
                            {event.date} {event.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
