"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  trackingNumber: string | null;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusStyles = {
  complete: "bg-blue-600",
  current: "ring-8 ring-blue-600 bg-white",
  upcoming: "bg-gray-200",
};

const statusIcons = {
  complete: <CheckCircle className="h-5 w-5 text-white" />,
  current: <div className="h-2 w-2 rounded-full bg-blue-600" />,
  upcoming: <div className="h-2 w-2 rounded-full bg-gray-400" />,
};

function getTimeline(status: string, createdAt: string) {
  const created = new Date(createdAt);
  const timeline = [
    { name: "Orden Recibida", date: created.toLocaleDateString("es-MX"), status: "complete" },
    {
      name: "Pago Confirmado",
      date: created.toLocaleDateString("es-MX"),
      status: status === "PENDING" ? "current" : "complete",
    },
    {
      name: "Procesando",
      date: new Date(created.getTime() + 86400000).toLocaleDateString("es-MX"),
      status: status === "PROCESSING" ? "current" : status === "PENDING" ? "upcoming" : "complete",
    },
    {
      name: "Enviado",
      date: new Date(created.getTime() + 172800000).toLocaleDateString("es-MX"),
      status:
        status === "SHIPPED"
          ? "current"
          : ["PENDING", "PROCESSING"].includes(status)
            ? "upcoming"
            : "complete",
    },
    {
      name: "Entregado",
      date: new Date(created.getTime() + 345600000).toLocaleDateString("es-MX") + " (Estimado)",
      status: status === "DELIVERED" ? "complete" : "upcoming",
    },
  ];
  return timeline;
}

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 403) {
            setError("No tienes acceso a esta orden");
            return;
          }
          if (res.status === 404) {
            setError("Orden no encontrada");
            return;
          }
          throw new Error("Error al cargar la orden");
        }

        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar la orden");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="mt-2 text-gray-600">{error || "Orden no encontrada"}</p>
          <Button onClick={() => router.push("/account/orders")} className="mt-4">
            Ver mis órdenes
          </Button>
        </div>
      </div>
    );
  }

  const timeline = getTimeline(order.status, order.createdAt);

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Orden #{order.orderNumber}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Estado actual:{" "}
            <span className="font-medium text-blue-600">
              {statusLabels[order.status] || order.status}
            </span>
          </p>
        </div>

        {/* Timeline */}
        <div className="mt-12">
          <h2 className="sr-only">Rastreo</h2>
          <div className="overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600"
              style={{
                width: `calc((${timeline.filter((t) => t.status === "complete").length} / ${timeline.length - 1}) * 100%)`,
              }}
            ></div>
          </div>
          <ol className="mt-4 grid grid-cols-5 text-sm font-medium text-gray-500">
            {timeline.map((step) => (
              <li key={step.name} className="relative text-center">
                <span
                  className={`absolute -top-10 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full ${
                    statusStyles[step.status as keyof typeof statusStyles]
                  }`}
                >
                  {statusIcons[step.status as keyof typeof statusIcons]}
                </span>
                <span className="hidden sm:block">{step.name}</span>
                <span className="hidden text-xs sm:block">{step.date}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-8">
          {/* Items */}
          <div>
            <h2 className="text-lg font-medium text-gray-900">Productos en tu orden</h2>
            <ul role="list" className="mt-6 divide-y divide-gray-200 border-b border-gray-200">
              {order.items.map((item) => (
                <li key={item.id} className="flex py-6">
                  <Image
                    src={item.product.image || "https://via.placeholder.com/80"}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                  <div className="ml-4 flex flex-1 flex-col justify-center">
                    <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      ${item.priceAtPurchase.toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-lg font-medium text-gray-900">Resumen del pedido</h2>
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>${order.subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Envío</dt>
                  <dd>${order.shippingCost.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Impuestos</dt>
                  <dd>${order.tax.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t pt-4 text-base font-medium">
                  <dt>Total</dt>
                  <dd>${order.total.toFixed(2)}</dd>
                </div>
              </dl>

              <div className="mt-6 border-t pt-6">
                <h3 className="text-sm font-medium">Dirección de Envío</h3>
                <p className="mt-2 text-sm text-gray-600">{order.shippingAddress.name}</p>
                <p className="mt-1 text-sm text-gray-600">{order.shippingAddress.street}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="mt-1 text-sm text-gray-600">{order.shippingAddress.country}</p>
              </div>

              {order.trackingNumber && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-sm font-medium">Rastreo</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Número: {order.trackingNumber}
                    <a
                      href={`https://www.estafeta.com/Herramientas/Rastreo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Rastrear paquete
                    </a>
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 flex space-x-4">
              <Button variant="outline" className="flex-1">
                Descargar Factura
              </Button>
              <Button variant="outline" className="flex-1">
                Contactar Soporte
              </Button>
              <Button variant="destructive" className="flex-1">
                Reportar Problema
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
