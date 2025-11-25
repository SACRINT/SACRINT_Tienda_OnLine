"use client";

import { CheckCircle, Truck, Package, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const dummyOrder = {
  id: "ABC123XYZ",
  status: "Enviado",
  timeline: [
    { name: "Orden Recibida", date: "Nov 20, 2025", status: "complete" },
    { name: "Pago Confirmado", date: "Nov 20, 2025", status: "complete" },
    { name: "Procesando", date: "Nov 21, 2025", status: "complete" },
    { name: "Enviado", date: "Nov 22, 2025", status: "current" },
    { name: "Entregado", date: "Nov 24, 2025 (Estimado)", status: "upcoming" },
  ],
  items: [
    {
      id: "1",
      name: "Laptop Gamer X1",
      price: 1200,
      image: "https://picsum.photos/400/300?random=1",
      quantity: 1,
      slug: "laptop-gamer-x1",
    },
    {
      id: "3",
      name: "Mouse Inalámbrico Ergonómico",
      price: 35,
      image: "https://picsum.photos/400/300?random=3",
      quantity: 2,
      slug: "mouse-inalambrico-ergonomico",
    },
  ],
  subtotal: 1270,
  shipping: 5,
  taxes: 203.2,
  total: 1478.2,
  shippingAddress: "Calle Falsa 123, Colonia Centro, Ciudad de México, 06000, México",
  tracking: {
    carrier: "Estafeta",
    number: "1234567890",
    url: "https://www.estafeta.com/Herramientas/Rastreo",
  },
};

const statusStyles = {
    complete: 'bg-blue-600',
    current: 'ring-8 ring-blue-600 bg-white',
    upcoming: 'bg-gray-200'
};

const statusIcons = {
    complete: <CheckCircle className="h-5 w-5 text-white" />,
    current: <div className="h-2 w-2 rounded-full bg-blue-600" />,
    upcoming: <div className="h-2 w-2 rounded-full bg-gray-400" />
};

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  // In a real app, fetch order by id
  // and check if the current user is the owner
  const order = dummyOrder;

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Orden #{order.id}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Estado actual: <span className="font-medium text-blue-600">{order.status}</span>
          </p>
        </div>

        {/* Timeline */}
        <div className="mt-12">
            <h2 className="sr-only">Rastreo</h2>
            <div className="overflow-hidden rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `calc((${order.timeline.filter(t => t.status === 'complete').length} / ${order.timeline.length - 1}) * 100%)` }}></div>
            </div>
            <ol className="mt-4 grid grid-cols-5 text-sm font-medium text-gray-500">
                {order.timeline.map((step, index) => (
                    <li key={step.name} className="relative text-center">
                        <span className={`absolute -top-10 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full flex items-center justify-center ${statusStyles[step.status as keyof typeof statusStyles]}`}>
                            {statusIcons[step.status as keyof typeof statusIcons]}
                        </span>
                        <span className="hidden sm:block">{step.name}</span>
                        <span className="hidden sm:block text-xs">{step.date}</span>
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
                  <Image src={item.image} alt={item.name} width={80} height={80} className="h-20 w-20 rounded-md object-cover" />
                  <div className="ml-4 flex flex-1 flex-col justify-center">
                    <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">${item.price.toFixed(2)}</p>
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
                    <div className="flex justify-between"><dt>Subtotal</dt><dd>${order.subtotal.toFixed(2)}</dd></div>
                    <div className="flex justify-between"><dt>Envío</dt><dd>${order.shipping.toFixed(2)}</dd></div>
                    <div className="flex justify-between"><dt>Impuestos</dt><dd>${order.taxes.toFixed(2)}</dd></div>
                    <div className="flex justify-between border-t pt-4 text-base font-medium"><dt>Total</dt><dd>${order.total.toFixed(2)}</dd></div>
                </dl>

                <div className="mt-6 border-t pt-6">
                    <h3 className="text-sm font-medium">Dirección de Envío</h3>
                    <p className="mt-2 text-sm text-gray-600">{order.shippingAddress}</p>
                </div>
                
                {order.tracking && (
                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-sm font-medium">Rastreo</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {order.tracking.carrier}: {order.tracking.number}
                            <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">Rastrear paquete</a>
                        </p>
                    </div>
                )}
            </div>
            <div className="mt-6 flex space-x-4">
                <Button variant="outline" className="flex-1">Descargar Factura</Button>
                <Button variant="outline" className="flex-1">Contactar Soporte</Button>
                <Button variant="destructive" className="flex-1">Reportar Problema</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
