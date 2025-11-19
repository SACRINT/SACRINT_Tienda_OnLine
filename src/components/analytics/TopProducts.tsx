"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductStat {
  id: string
  name: string
  sales: number
  revenue: number
  trend: number
  stock: number
}

interface TopProductsProps {
  className?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value)

export function TopProducts({ className }: TopProductsProps) {
  const products: ProductStat[] = [
    { id: "1", name: "Auriculares Bluetooth Pro Max", sales: 156, revenue: 467844, trend: 23, stock: 45 },
    { id: "2", name: "Zapatillas Running Ultra", sales: 132, revenue: 329868, trend: 15, stock: 28 },
    { id: "3", name: "Smartwatch Series 5", sales: 98, revenue: 293902, trend: -5, stock: 12 },
    { id: "4", name: "Camiseta Premium Algodón", sales: 245, revenue: 146755, trend: 8, stock: 89 },
    { id: "5", name: "Mochila Urban Pro", sales: 87, revenue: 130413, trend: 32, stock: 34 },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Productos Más Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sales} ventas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{formatCurrency(product.revenue)}</p>
                <div className="flex items-center justify-end gap-1">
                  {product.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-error" />
                  )}
                  <span
                    className={cn(
                      "text-xs",
                      product.trend >= 0 ? "text-success" : "text-error"
                    )}
                  >
                    {product.trend >= 0 ? "+" : ""}{product.trend}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        <div className="mt-4 p-3 bg-warning/10 rounded-lg">
          <p className="text-sm font-medium text-warning">
            Stock bajo: {products.filter(p => p.stock < 15).length} productos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Considera reabastecer Smartwatch Series 5
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
