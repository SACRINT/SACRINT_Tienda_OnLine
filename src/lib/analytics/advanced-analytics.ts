/**
 * Advanced Analytics - Semana 22
 * Analytics avanzados para reportes
 */
import { db } from "@/lib/db";

export async function getRevenueTrends(tenantId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: since },
      paymentStatus: "COMPLETED",
    },
    select: {
      total: true,
      createdAt: true,
    },
  });

  // Agrupar por día
  const dailyRevenue = orders.reduce((acc, order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    if (!acc[date]) acc[date] = 0;
    acc[date] += Number(order.total);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(dailyRevenue).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

export async function getTopProducts(tenantId: string, limit: number = 10) {
  const products = await db.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  return products;
}

export async function getCustomerLifetimeValue(tenantId: string) {
  const customers = await db.user.findMany({
    where: { tenantId },
    include: {
      orders: {
        where: { paymentStatus: "COMPLETED" },
        select: { total: true },
      },
    },
  });

  return customers.map(customer => ({
    userId: customer.id,
    email: customer.email,
    totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.total), 0),
    orderCount: customer.orders.length,
  }));
}
