"use client"

import Link from "next/link"
import {
  User,
  Package,
  MapPin,
  Heart,
  CreditCard,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Calendar,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// Mock user data
const user = {
  name: "Juan Pérez",
  email: "juan@email.com",
  image: null,
  memberSince: "Marzo 2024",
  totalOrders: 12,
  totalSpent: 15680,
  wishlistCount: 5,
}

// Mock recent orders
const recentOrders = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    date: "2024-03-10",
    status: "DELIVERED",
    total: 2999,
    items: 2,
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    date: "2024-03-05",
    status: "SHIPPED",
    total: 1598,
    items: 3,
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    date: "2024-02-28",
    status: "DELIVERED",
    total: 4999,
    items: 1,
  },
]

const statusConfig = {
  PENDING: { label: "Pendiente", color: "bg-warning/10 text-warning" },
  PROCESSING: { label: "Procesando", color: "bg-info/10 text-info" },
  PAID: { label: "Pagado", color: "bg-success/10 text-success" },
  SHIPPED: { label: "Enviado", color: "bg-accent/10 text-accent" },
  DELIVERED: { label: "Entregado", color: "bg-success/10 text-success" },
  CANCELLED: { label: "Cancelado", color: "bg-error/10 text-error" },
}

export default function AccountPage() {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-primary">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Miembro desde {user.memberSince}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/account/profile">
              Editar Perfil
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-2xl font-bold">{user.totalOrders}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gastado</p>
                  <p className="text-2xl font-bold">{formatPrice(user.totalSpent)}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lista de Deseos</p>
                  <p className="text-2xl font-bold">{user.wishlistCount}</p>
                </div>
                <div className="p-3 bg-error/10 rounded-full">
                  <Heart className="h-6 w-6 text-error" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Mi Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  <Link
                    href="/account/orders"
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <span>Mis Pedidos</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <span>Mis Direcciones</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                      <span>Lista de Deseos</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/account/profile"
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span>Perfil</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Separator />
                  <button
                    className="flex items-center gap-3 px-4 py-3 w-full hover:bg-muted transition-colors text-error"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pedidos Recientes</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/account/orders">Ver todos</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No tienes pedidos aún
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/shop">Explorar Productos</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => {
                      const status = statusConfig[order.status as keyof typeof statusConfig]
                      return (
                        <Link
                          key={order.id}
                          href={`/account/orders/${order.id}`}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{order.orderNumber}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.date)}
                              <span>•</span>
                              {order.items} productos
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-medium">{formatPrice(order.total)}</p>
                            <Badge variant="outline" className={status.color}>
                              {status.label}
                            </Badge>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
