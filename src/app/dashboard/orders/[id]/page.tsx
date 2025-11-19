import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Mail,
  Phone,
  MapPin,
  Package,
  CreditCard,
  Calendar,
  User,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getOrderById } from "@/lib/db/orders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderStatusUpdater } from "@/components/dashboard/OrderStatusUpdater";
import {
  OrderStatusProgress,
  OrderTimeline,
} from "@/components/dashboard/OrderTimeline";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>;
  }

  const order = await getOrderById(params.id, session.user.tenantId);

  if (!order) {
    notFound();
  }

  const formatPrice = (price: any) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(parseFloat(String(price)));

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Mock timeline events
  const timelineEvents = [
    {
      id: "1",
      status: "PENDING",
      timestamp: order.createdAt,
      description: "Orden recibida",
    },
    ...(order.status !== "PENDING"
      ? [
          {
            id: "2",
            status: order.status,
            timestamp: order.updatedAt || order.createdAt,
            description:
              order.status === "PROCESSING"
                ? "Pedido en preparación"
                : order.status === "SHIPPED"
                  ? "Pedido enviado"
                  : order.status === "DELIVERED"
                    ? "Pedido entregado"
                    : "Estado actualizado",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-primary">
                Orden #{order.orderNumber}
              </h2>
              <Badge variant="outline" className="text-sm">
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Reenviar
          </Button>
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardContent className="pt-6">
          <OrderStatusProgress currentStatus={order.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 border-b last:border-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {item.product?.images?.[0] ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {item.product?.name || "Producto"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.price)}</p>
                      <p className="text-sm text-muted-foreground">
                        Subtotal: {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección de Envío
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="space-y-2">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.street}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.country}
                  </p>
                  {order.shippingAddress.phone && (
                    <p className="flex items-center gap-2 mt-4">
                      <Phone className="h-4 w-4" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hay dirección de envío
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                events={timelineEvents}
                currentStatus={order.status}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{order.user?.name || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {order.user?.email}
              </p>
            </CardContent>
          </Card>

          {/* Status Updater */}
          <Card>
            <CardHeader>
              <CardTitle>Actualizar Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusUpdater
                orderId={order.id}
                currentStatus={order.status}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
