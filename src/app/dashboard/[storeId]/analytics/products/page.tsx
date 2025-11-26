/**
 * Product Analytics Dashboard
 * Task 12.1: Product Analytics Dashboard
 *
 * Métricas por producto:
 * - Views (visitas a la página)
 * - Add-to-cart rate
 * - Conversion rate (cart → order)
 * - Revenue
 * - Stock level
 * - Tendencias de ventas
 */

import { Metadata } from "next";
import { requireAuth, getStoreOrThrow } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";
import { Package, TrendingUp, ShoppingCart, DollarSign, Eye, AlertTriangle } from "lucide-react";

interface ProductAnalyticsPageProps {
  params: {
    storeId: string;
  };
  searchParams: {
    period?: string; // "7d" | "30d" | "90d"
    sortBy?: string; // "revenue" | "views" | "conversion"
  };
}

export const metadata: Metadata = {
  title: "Analytics de Productos",
  description: "Analiza el rendimiento de tus productos",
};

/**
 * Obtiene analytics por producto
 */
async function getProductAnalytics(tenantId: string, days: number = 30, limit: number = 20) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Obtener productos con sus métricas
  const products = await db.product.findMany({
    where: {
      tenantId,
      published: true,
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      images: {
        take: 1,
        orderBy: { order: "asc" },
        select: { url: true, alt: true },
      },
      orderItems: {
        where: {
          order: {
            createdAt: { gte: since },
            status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] }, // Órdenes confirmadas
          },
        },
        select: {
          quantity: true,
          priceAtPurchase: true,
        },
      },
      cartItems: {
        where: {
          createdAt: { gte: since },
        },
        select: {
          quantity: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          orderItems: true,
        },
      },
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calcular métricas por producto
  const productMetrics = products.map((product) => {
    // Revenue = sum(orderItems.quantity * priceAtPurchase)
    const revenue = product.orderItems.reduce((sum, item) => {
      return sum + item.quantity * Number(item.priceAtPurchase);
    }, 0);

    // Units sold
    const unitsSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);

    // Add to cart count
    const addToCartCount = product.cartItems.length;

    // Conversion rate (órdenes / add-to-cart)
    const conversionRate =
      addToCartCount > 0 ? (product._count.orderItems / addToCartCount) * 100 : 0;

    // Stock status
    const stockStatus =
      product.stock === 0
        ? "out_of_stock"
        : product.stock <= product.lowStockThreshold
          ? "low_stock"
          : "in_stock";

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || "Sin categoría",
      image: product.images[0]?.url || null,
      basePrice: Number(product.basePrice),
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      stockStatus,
      revenue,
      unitsSold,
      addToCartCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      reviewCount: product._count.reviews,
      featured: product.featured,
    };
  });

  return productMetrics;
}

/**
 * Calcula métricas generales
 */
async function getOverallMetrics(tenantId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalRevenue, totalOrders, totalProducts, lowStockCount] = await Promise.all([
    // Revenue total
    db.orderItem
      .aggregate({
        where: {
          order: {
            tenantId,
            createdAt: { gte: since },
            status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
          },
        },
        _sum: {
          quantity: true,
        },
      })
      .then(async (result) => {
        // Calcular revenue real
        const orderItems = await db.orderItem.findMany({
          where: {
            order: {
              tenantId,
              createdAt: { gte: since },
              status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
            },
          },
          select: {
            quantity: true,
            priceAtPurchase: true,
          },
        });

        return orderItems.reduce((sum, item) => {
          return sum + item.quantity * Number(item.priceAtPurchase);
        }, 0);
      }),

    // Total de órdenes
    db.order.count({
      where: {
        tenantId,
        createdAt: { gte: since },
        status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      },
    }),

    // Total de productos
    db.product.count({
      where: {
        tenantId,
        published: true,
      },
    }),

    // Productos con stock bajo
    db.product.count({
      where: {
        tenantId,
        published: true,
        stock: { gt: 0, lte: db.product.fields.lowStockThreshold },
      },
    }),
  ]);

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    totalOrders,
    totalProducts,
    lowStockCount,
    avgOrderValue,
  };
}

export default async function ProductAnalyticsPage({
  params: { storeId },
  searchParams,
}: ProductAnalyticsPageProps) {
  const session = await requireAuth();
  const store = await getStoreOrThrow(storeId, session.user.id);

  // Parse parameters
  const period = searchParams.period || "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const sortBy = searchParams.sortBy || "revenue";

  // Obtener datos
  const [metrics, productMetrics] = await Promise.all([
    getOverallMetrics(storeId, days),
    getProductAnalytics(storeId, days, 50),
  ]);

  // Ordenar productos según sortBy
  const sortedProducts = [...productMetrics].sort((a, b) => {
    switch (sortBy) {
      case "revenue":
        return b.revenue - a.revenue;
      case "units":
        return b.unitsSold - a.unitsSold;
      case "conversion":
        return b.conversionRate - a.conversionRate;
      case "stock":
        return a.stock - b.stock;
      default:
        return b.revenue - a.revenue;
    }
  });

  const topProducts = sortedProducts.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Productos</h1>
          <p className="mt-1 text-gray-600">Analiza el rendimiento y métricas de tus productos</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <a
            href={`/dashboard/${storeId}/analytics/products?period=7d&sortBy=${sortBy}`}
            className={`rounded-lg border px-4 py-2 ${
              period === "7d"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            7 días
          </a>
          <a
            href={`/dashboard/${storeId}/analytics/products?period=30d&sortBy=${sortBy}`}
            className={`rounded-lg border px-4 py-2 ${
              period === "30d"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            30 días
          </a>
          <a
            href={`/dashboard/${storeId}/analytics/products?period=90d&sortBy=${sortBy}`}
            className={`rounded-lg border px-4 py-2 ${
              period === "90d"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            90 días
          </a>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenue Total</p>
              <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">
                ${metrics.avgOrderValue.toFixed(2)} promedio
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Órdenes</p>
              <p className="text-2xl font-bold">{metrics.totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Productos Activos</p>
              <p className="text-2xl font-bold">{metrics.totalProducts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold">{metrics.lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
          <div className="flex gap-2">
            <a
              href={`/dashboard/${storeId}/analytics/products?period=${period}&sortBy=revenue`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                sortBy === "revenue"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Revenue
            </a>
            <a
              href={`/dashboard/${storeId}/analytics/products?period=${period}&sortBy=units`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                sortBy === "units"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Unidades Vendidas
            </a>
            <a
              href={`/dashboard/${storeId}/analytics/products?period=${period}&sortBy=conversion`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                sortBy === "conversion"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Conversión
            </a>
            <a
              href={`/dashboard/${storeId}/analytics/products?period=${period}&sortBy=stock`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                sortBy === "stock"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Stock
            </a>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="rounded-lg border bg-white">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold">Top 10 Productos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Mejores productos por{" "}
            {sortBy === "revenue"
              ? "revenue"
              : sortBy === "units"
                ? "unidades vendidas"
                : sortBy === "conversion"
                  ? "conversión"
                  : "stock"}
          </p>
        </div>
        <div className="overflow-x-auto">
          {topProducts.length === 0 ? (
            <p className="py-12 text-center text-gray-500">
              No hay datos de ventas en este período
            </p>
          ) : (
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Unidades
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Conversión
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-green-600">
                        ${product.revenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium">{product.unitsSold}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          product.conversionRate >= 50
                            ? "bg-green-100 text-green-700"
                            : product.conversionRate >= 20
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.conversionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          product.stockStatus === "out_of_stock"
                            ? "bg-red-100 text-red-700"
                            : product.stockStatus === "low_stock"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.stock === 0 ? "Agotado" : `${product.stock} unid.`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
