// Dashboard Analytics API
// GET /api/dashboard/stats - Get dashboard statistics

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Demo tenant ID
const DEMO_TENANT_ID = async () => {
  const tenant = await db.tenant.findUnique({
    where: { slug: "demo-store" },
  });
  return tenant?.id || "";
};

export async function GET() {
  try {
    const tenantId = await DEMO_TENANT_ID();

    if (!tenantId) {
      return NextResponse.json(
        { error: "Demo tenant not found" },
        { status: 404 },
      );
    }

    // Get counts
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      recentOrders,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      // Total products
      db.product.count({
        where: { tenantId, published: true },
      }),

      // Total orders
      db.order.count({
        where: { tenantId },
      }),

      // Total customers
      db.user.count({
        where: { tenantId, role: "CUSTOMER" },
      }),

      // Total revenue
      db.order.aggregate({
        where: {
          tenantId,
          paymentStatus: "COMPLETED",
        },
        _sum: { total: true },
      }),

      // Recent orders
      db.order.findMany({
        where: { tenantId },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Top products by sales
      db.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: {
            tenantId,
            paymentStatus: "COMPLETED",
          },
        },
        _sum: {
          quantity: true,
          priceAtPurchase: true,
        },
        orderBy: {
          _sum: {
            priceAtPurchase: "desc",
          },
        },
        take: 5,
      }),

      // Orders by status
      db.order.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
      }),
    ]);

    // Get product names for top products
    const productIds = topProducts.map(
      (p: (typeof topProducts)[number]) => p.productId,
    );
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(
      products.map((p: { id: string; name: string }) => [p.id, p.name]),
    );

    const topProductsWithNames = topProducts.map(
      (p: (typeof topProducts)[number]) => ({
        name: productMap.get(p.productId) || "Unknown",
        sales: p._sum.quantity || 0,
        revenue: Number(p._sum.priceAtPurchase) || 0,
      }),
    );

    // Calculate average order value
    const avgOrderValue =
      totalOrders > 0 ? Number(totalRevenue._sum.total || 0) / totalOrders : 0;

    // Format recent orders
    const formattedRecentOrders = recentOrders.map(
      (order: (typeof recentOrders)[number]) => ({
        id: order.orderNumber,
        customer: order.user.name || order.user.email || "Cliente",
        total: Number(order.total),
        status: order.status.toLowerCase(),
        date: formatRelativeTime(order.createdAt),
      }),
    );

    // Format order status data
    type OrderStatusGroup = (typeof ordersByStatus)[number];
    const orderStatusData = [
      {
        name: "Completadas",
        value:
          ordersByStatus.find((o: OrderStatusGroup) => o.status === "DELIVERED")
            ?._count || 0,
        color: "#22c55e",
      },
      {
        name: "En Proceso",
        value:
          ordersByStatus.find(
            (o: OrderStatusGroup) => o.status === "PROCESSING",
          )?._count || 0,
        color: "#3b82f6",
      },
      {
        name: "Pendientes",
        value:
          ordersByStatus.find((o: OrderStatusGroup) => o.status === "PENDING")
            ?._count || 0,
        color: "#f59e0b",
      },
      {
        name: "Canceladas",
        value:
          ordersByStatus.find((o: OrderStatusGroup) => o.status === "CANCELLED")
            ?._count || 0,
        color: "#ef4444",
      },
    ];

    return NextResponse.json({
      kpiData: {
        revenue: {
          value: Number(totalRevenue._sum.total || 0),
          change: 12.5,
          trend: "up",
        },
        orders: {
          value: totalOrders,
          change: 8.2,
          trend: "up",
        },
        products: {
          value: totalProducts,
          change: 0,
          trend: "up",
        },
        customers: {
          value: totalCustomers,
          change: 15.3,
          trend: "up",
        },
        avgOrderValue: {
          value: Math.round(avgOrderValue),
          change: 3.8,
          trend: "up",
        },
        conversionRate: {
          value: 3.2,
          change: 0.5,
          trend: "up",
        },
        repeatCustomers: {
          value: 28,
          change: 4.2,
          trend: "up",
        },
        cartAbandonment: {
          value: 68,
          change: -5.1,
          trend: "down",
        },
      },
      topProductsData: topProductsWithNames,
      recentOrders: formattedRecentOrders,
      orderStatusData,
    });
  } catch (error) {
    console.error("[DASHBOARD] Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
  return `Hace ${days} día${days > 1 ? "s" : ""}`;
}
