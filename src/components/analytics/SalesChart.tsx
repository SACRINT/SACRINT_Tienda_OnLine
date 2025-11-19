"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface SalesData {
  date: string
  ventas: number
  ordenes: number
}

interface SalesChartProps {
  data?: SalesData[]
  title?: string
  className?: string
}

// Mock data
const defaultData: SalesData[] = [
  { date: "Lun", ventas: 12500, ordenes: 45 },
  { date: "Mar", ventas: 18200, ordenes: 62 },
  { date: "Mie", ventas: 15800, ordenes: 54 },
  { date: "Jue", ventas: 22100, ordenes: 78 },
  { date: "Vie", ventas: 28500, ordenes: 95 },
  { date: "Sab", ventas: 35200, ordenes: 112 },
  { date: "Dom", ventas: 24800, ordenes: 82 },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)

export function SalesChart({
  data = defaultData,
  title = "Ventas de la Semana",
  className,
}: SalesChartProps) {
  const [period, setPeriod] = React.useState<"week" | "month" | "year">("week")

  // Calculate totals and trends
  const totalSales = data.reduce((sum, d) => sum + d.ventas, 0)
  const totalOrders = data.reduce((sum, d) => sum + d.ordenes, 0)
  const avgOrderValue = totalSales / totalOrders

  // Simulate trend (in real app, compare with previous period)
  const salesTrend = 12.5
  const ordersTrend = 8.3

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex gap-1">
            {(["week", "month", "year"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalSales)}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-sm text-muted-foreground">Ventas Totales</p>
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  salesTrend >= 0 ? "text-success" : "text-error"
                )}
              >
                {salesTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(salesTrend)}%
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalOrders}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-sm text-muted-foreground">Órdenes</p>
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  ordersTrend >= 0 ? "text-success" : "text-error"
                )}
              >
                {ordersTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(ordersTrend)}%
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(avgOrderValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Ticket Promedio</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "ventas" ? formatCurrency(value) : value,
                  name === "ventas" ? "Ventas" : "Órdenes",
                ]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ventas"
                name="Ventas"
                stroke="#0A1128"
                strokeWidth={2}
                dot={{ fill: "#0A1128", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="ordenes"
                name="Órdenes"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={{ fill: "#D4AF37", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
