// Data Access Layer - Dashboard Analytics
// Dashboard metrics and analytics functions with tenant isolation

import { db } from './client'
import { ensureTenantAccess } from './tenant'

/**
 * Get dashboard metrics summary
 * Returns total orders, revenue, products, and customers for a tenant
 */
export async function getDashboardMetrics(tenantId: string) {
  await ensureTenantAccess(tenantId)

  const [totalOrders, totalRevenue, totalProducts, totalCustomers] =
    await Promise.all([
      db.order.count({ where: { tenantId } }),
      db.order.aggregate({
        where: { tenantId, paymentStatus: 'COMPLETED' },
        _sum: { total: true },
      }),
      db.product.count({ where: { tenantId } }),
      db.user.count({ where: { tenantId } }),
    ])

  return {
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.total || 0),
    totalProducts,
    totalCustomers,
  }
}

/**
 * Get sales data grouped by date
 * Returns daily sales totals for the specified number of days
 */
export async function getSalesData(tenantId: string, days: number = 30) {
  await ensureTenantAccess(tenantId)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const sales = await db.order.groupBy({
    by: ['createdAt'],
    where: { tenantId, createdAt: { gte: startDate } },
    _sum: { total: true },
    _count: true,
  })

  return sales.map((s: any) => ({
    date: s.createdAt,
    total: Number(s._sum.total || 0),
    orders: s._count,
  }))
}

/**
 * Get top selling products
 * Returns products ordered by number of order items (most sold)
 */
export async function getTopProducts(tenantId: string, limit: number = 10) {
  await ensureTenantAccess(tenantId)

  const products = await db.product.findMany({
    where: { tenantId },
    include: {
      _count: { select: { orderItems: true } },
    },
    orderBy: { orderItems: { _count: 'desc' } },
    take: limit,
  })

  return products
}

/**
 * Get recent orders with user and items
 * Returns the most recent orders for a tenant
 */
export async function getRecentOrders(tenantId: string, limit: number = 10) {
  await ensureTenantAccess(tenantId)

  const orders = await db.order.findMany({
    where: { tenantId },
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return orders
}
