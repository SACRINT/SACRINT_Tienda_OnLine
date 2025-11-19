"use client"

import * as React from "react"
import Link from "next/link"
import {
  Package,
  Eye,
  Calendar,
  Filter,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Mock orders data
const orders = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    date: "2024-03-10",
    status: "DELIVERED",
    total: 2999,
    items: [
      { name: "Auriculares Bluetooth Pro", quantity: 1, price: 2999 },
    ],
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    date: "2024-03-05",
    status: "SHIPPED",
    total: 1598,
    items: [
      { name: "Camiseta Premium", quantity: 2, price: 599 },
      { name: "Calcetines Pack x3", quantity: 1, price: 400 },
    ],
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    date: "2024-02-28",
    status: "DELIVERED",
    total: 4999,
    items: [
      { name: "Reloj Inteligente Series 5", quantity: 1, price: 4999 },
    ],
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    date: "2024-02-15",
    status: "DELIVERED",
    total: 1899,
    items: [
      { name: "Tenis Casual Street", quantity: 1, price: 1899 },
    ],
  },
  {
    id: "5",
    orderNumber: "ORD-2024-005",
    date: "2024-02-01",
    status: "CANCELLED",
    total: 899,
    items: [
      { name: "Sudadera Hoodie Premium", quantity: 1, price: 899 },
    ],
  },
]

const statusConfig = {
  PENDING: {
    label: "Pendiente",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  PROCESSING: {
    label: "Procesando",
    color: "bg-info/10 text-info border-info/20",
    icon: Package,
  },
  SHIPPED: {
    label: "Enviado",
    color: "bg-accent/10 text-accent border-accent/20",
    icon: Truck,
  },
  DELIVERED: {
    label: "Entregado",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-error/10 text-error border-error/20",
    icon: XCircle,
  },
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false
    if (
      searchQuery &&
      !order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">Mis Pedidos</h1>
            <p className="text-muted-foreground mt-1">
              Historial de todos tus pedidos
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de orden..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="PROCESSING">Procesando</SelectItem>
                  <SelectItem value="SHIPPED">Enviado</SelectItem>
                  <SelectItem value="DELIVERED">Entregado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron pedidos
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig]
              const StatusIcon = status.icon

              return (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Order Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {order.orderNumber}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("gap-1", status.color)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.date)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.length} producto(s):{" "}
                          {order.items.map((item) => item.name).join(", ")}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold">
                            {formatPrice(order.total)}
                          </p>
                        </div>
                        <Button asChild>
                          <Link href={`/account/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
