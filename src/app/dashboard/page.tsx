"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  CreditCard,
  Repeat,
  Eye,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Mock data
const kpiData = {
  revenue: { value: 158750, change: 12.5, trend: "up" },
  orders: { value: 342, change: 8.2, trend: "up" },
  products: { value: 156, change: -2.1, trend: "down" },
  customers: { value: 1247, change: 15.3, trend: "up" },
  avgOrderValue: { value: 464, change: 3.8, trend: "up" },
  conversionRate: { value: 3.2, change: 0.5, trend: "up" },
  repeatCustomers: { value: 28, change: 4.2, trend: "up" },
  cartAbandonment: { value: 68, change: -5.1, trend: "down" },
};

const revenueData = [
  { name: "Ene", revenue: 45000, orders: 120 },
  { name: "Feb", revenue: 52000, orders: 145 },
  { name: "Mar", revenue: 48000, orders: 130 },
  { name: "Abr", revenue: 61000, orders: 168 },
  { name: "May", revenue: 55000, orders: 152 },
  { name: "Jun", revenue: 67000, orders: 189 },
  { name: "Jul", revenue: 72000, orders: 198 },
  { name: "Ago", revenue: 69000, orders: 185 },
  { name: "Sep", revenue: 81000, orders: 220 },
  { name: "Oct", revenue: 93000, orders: 256 },
  { name: "Nov", revenue: 158750, orders: 342 },
];

const orderStatusData = [
  { name: "Completadas", value: 245, color: "#22c55e" },
  { name: "En Proceso", value: 67, color: "#3b82f6" },
  { name: "Pendientes", value: 18, color: "#f59e0b" },
  { name: "Canceladas", value: 12, color: "#ef4444" },
];

const topProductsData = [
  { name: "Auriculares BT Pro", sales: 89, revenue: 133411 },
  { name: "Camiseta Premium", sales: 156, revenue: 93444 },
  { name: "Zapatillas Ultra", sales: 67, revenue: 167433 },
  { name: "Smartwatch Fit", sales: 45, revenue: 148455 },
  { name: "Lámpara LED", sales: 78, revenue: 70122 },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: "María García",
    total: 2999,
    status: "completed",
    date: "Hace 5 min",
  },
  {
    id: "ORD-002",
    customer: "Carlos López",
    total: 1598,
    status: "processing",
    date: "Hace 15 min",
  },
  {
    id: "ORD-003",
    customer: "Ana Martínez",
    total: 4497,
    status: "pending",
    date: "Hace 32 min",
  },
  {
    id: "ORD-004",
    customer: "José Rodríguez",
    total: 899,
    status: "completed",
    date: "Hace 1 hora",
  },
  {
    id: "ORD-005",
    customer: "Laura Sánchez",
    total: 3298,
    status: "completed",
    date: "Hace 2 horas",
  },
];

const statusColors: Record<string, string> = {
  completed: "bg-success/10 text-success",
  processing: "bg-info/10 text-info",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-error/10 text-error",
};

const statusLabels: Record<string, string> = {
  completed: "Completada",
  processing: "En Proceso",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

export default function DashboardPage() {
  const [dateRange, setDateRange] = React.useState("30d");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("es-MX").format(value);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta. Aquí está el resumen de tu tienda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="12m">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href="/analytics/reports">Ver Reportes</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpiData.revenue.value)}
            </div>
            <div className="flex items-center text-xs mt-1">
              {kpiData.revenue.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-error mr-1" />
              )}
              <span
                className={
                  kpiData.revenue.trend === "up" ? "text-success" : "text-error"
                }
              >
                {kpiData.revenue.change}%
              </span>
              <span className="text-muted-foreground ml-1">
                vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(kpiData.orders.value)}
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              <span className="text-success">{kpiData.orders.change}%</span>
              <span className="text-muted-foreground ml-1">
                vs mes anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(kpiData.products.value)}
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowDownRight className="h-4 w-4 text-error mr-1" />
              <span className="text-error">
                {Math.abs(kpiData.products.change)}%
              </span>
              <span className="text-muted-foreground ml-1">stock bajo</span>
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(kpiData.customers.value)}
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              <span className="text-success">{kpiData.customers.change}%</span>
              <span className="text-muted-foreground ml-1">nuevos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* AOV */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Promedio
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpiData.avgOrderValue.value)}
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              <span className="text-success">
                {kpiData.avgOrderValue.change}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa Conversión
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData.conversionRate.value}%
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              <span className="text-success">
                +{kpiData.conversionRate.change}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Repeat Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Recurrentes
            </CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData.repeatCustomers.value}%
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowUpRight className="h-4 w-4 text-success mr-1" />
              <span className="text-success">
                {kpiData.repeatCustomers.change}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cart Abandonment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Abandono Carrito
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiData.cartAbandonment.value}%
            </div>
            <div className="flex items-center text-xs mt-1">
              <ArrowDownRight className="h-4 w-4 text-success mr-1" />
              <span className="text-success">
                {Math.abs(kpiData.cartAbandonment.change)}%
              </span>
              <span className="text-muted-foreground ml-1">mejor</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tendencia de Ingresos</CardTitle>
            <CardDescription>Ingresos mensuales del último año</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis
                  className="text-xs"
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Estado de Órdenes</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>Top 5 por ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProductsData.map((product, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.sales} ventas
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Órdenes Recientes</CardTitle>
              <CardDescription>Últimas 5 órdenes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/orders">Ver Todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{order.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.id} · {order.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={statusColors[order.status]}
                    >
                      {statusLabels[order.status]}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
