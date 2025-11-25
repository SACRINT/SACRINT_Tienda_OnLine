/**
 * Dashboard Home Page
 * Semana 9.2: Dashboard Home Page
 *
 * Página principal del dashboard con KPIs, gráficos y métricas
 */

import { subDays } from "date-fns";
import { getDashboardMetrics } from "@/lib/analytics/metrics";
import { KPICards } from "@/components/dashboard/KPICards";
import {
  SalesChart,
  TopProductsChart,
  OrdersStatusChart,
  RecentOrders,
} from "@/components/dashboard/Charts";
import { db } from "@/lib/db";

interface DashboardHomeProps {
  params: {
    storeId: string;
  };
}

export default async function DashboardHome({
  params: { storeId },
}: DashboardHomeProps) {
  // Fetch data for last 30 days
  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  // Get dashboard metrics
  const metrics = await getDashboardMetrics(storeId, startDate, endDate);

  // Get sales trend data (last 30 days)
  const salesData = await db.order.groupBy({
    by: ["createdAt"],
    where: {
      tenantId: storeId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"],
      },
    },
    _sum: {
      total: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const salesChartData = salesData.map((item) => ({
    date: new Date(item.createdAt).toLocaleDateString("es-MX", {
      month: "short",
      day: "numeric",
    }),
    value: item._sum.total || 0,
  }));

  // Get top products data
  const topProductsData = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        tenantId: storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  const topProducts = await Promise.all(
    topProductsData.map(async (item) => {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { name: true },
      });
      return {
        name: product?.name || "Producto",
        sold: item._sum.quantity || 0,
      };
    })
  );

  // Get orders by status data
  const ordersByStatus = await db.order.groupBy({
    by: ["status"],
    where: {
      tenantId: storeId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
  });

  const ordersStatusData = ordersByStatus.map((item) => ({
    status: item.status,
    count: item._count.id,
  }));

  // Get recent orders
  const recentOrders = await db.order.findMany({
    where: {
      tenantId: storeId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido a tu panel de administración
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards metrics={metrics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={salesChartData} />
        <TopProductsChart data={topProducts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersStatusChart data={ordersStatusData} />
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen Rápido
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tasa de Conversión</span>
              <span className="text-sm font-semibold text-gray-900">
                {metrics.conversion.rate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Valor Promedio</span>
              <span className="text-sm font-semibold text-gray-900">
                ${metrics.orders.averageValue.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Productos Activos</span>
              <span className="text-sm font-semibold text-gray-900">
                {metrics.products.active}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stock Bajo</span>
              <span className="text-sm font-semibold text-red-600">
                {metrics.products.lowStock}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <RecentOrders orders={recentOrders} />
    </div>
  );
}

export const metadata = {
  title: "Dashboard",
  description: "Panel principal de administración",
};
