// Analytics Database Queries
// Queries optimizadas para analytics y reportes

import { db } from '@/lib/db'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'
import {
  OverviewMetrics,
  SalesMetrics,
  CustomerMetrics,
  DailyRevenue,
  CategoryRevenue,
  ProductSales,
  TopCustomer,
  calculateMetric,
} from './types'

// ============================================
// OVERVIEW QUERIES
// ============================================

export async function getOverviewMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<OverviewMetrics> {
  // Get current period data
  const currentOrders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    include: {
      items: true,
      customer: true,
    },
  })

  // Calculate previous period dates
  const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const previousStartDate = subDays(startDate, periodLength)
  const previousEndDate = subDays(endDate, periodLength)

  // Get previous period data
  const previousOrders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: previousStartDate,
        lte: previousEndDate,
      },
      status: {
        not: 'CANCELLED',
      },
    },
  })

  // Calculate current period metrics
  const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total, 0)
  const currentOrderCount = currentOrders.length
  const currentAvgOrderValue = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0
  const currentCustomerCount = new Set(currentOrders.map((o) => o.customerId)).size

  // Calculate previous period metrics
  const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0)
  const previousOrderCount = previousOrders.length
  const previousAvgOrderValue = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0
  const previousCustomerCount = new Set(previousOrders.map((o) => o.customerId)).size

  return {
    revenue: calculateMetric(currentRevenue, previousRevenue),
    orders: calculateMetric(currentOrderCount, previousOrderCount),
    customers: calculateMetric(currentCustomerCount, previousCustomerCount),
    avgOrderValue: calculateMetric(currentAvgOrderValue, previousAvgOrderValue),
  }
}

// ============================================
// SALES QUERIES
// ============================================

export async function getSalesMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<SalesMetrics> {
  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  })

  // Total metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Revenue by day
  const revenueByDayMap = new Map<string, { revenue: number; orders: number }>()

  orders.forEach((order) => {
    const dateKey = format(new Date(order.createdAt), 'yyyy-MM-dd')
    const existing = revenueByDayMap.get(dateKey) || { revenue: 0, orders: 0 }
    revenueByDayMap.set(dateKey, {
      revenue: existing.revenue + order.total,
      orders: existing.orders + 1,
    })
  })

  const revenueByDay: DailyRevenue[] = Array.from(revenueByDayMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Revenue by category
  const categoryRevenueMap = new Map<string, { name: string; revenue: number; orders: Set<string> }>()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.product?.category) {
        const categoryId = item.product.category.id
        const categoryName = item.product.category.name
        const existing = categoryRevenueMap.get(categoryId) || {
          name: categoryName,
          revenue: 0,
          orders: new Set(),
        }
        existing.revenue += item.price * item.quantity
        existing.orders.add(order.id)
        categoryRevenueMap.set(categoryId, existing)
      }
    })
  })

  const revenueByCategory: CategoryRevenue[] = Array.from(categoryRevenueMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      revenue: data.revenue,
      orders: data.orders.size,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // Top products
  const productSalesMap = new Map<string, { name: string; image?: string; quantity: number; revenue: number; prices: number[] }>()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.product) {
        const productId = item.product.id
        const existing = productSalesMap.get(productId) || {
          name: item.product.name,
          image: item.product.images[0] || undefined,
          quantity: 0,
          revenue: 0,
          prices: [],
        }
        existing.quantity += item.quantity
        existing.revenue += item.price * item.quantity
        existing.prices.push(item.price)
        productSalesMap.set(productId, existing)
      }
    })
  })

  const topProducts: ProductSales[] = Array.from(productSalesMap.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      productImage: data.image,
      quantitySold: data.quantity,
      revenue: data.revenue,
      avgPrice: data.prices.length > 0
        ? data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length
        : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10) // Top 10

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    revenueByDay,
    revenueByCategory,
    topProducts,
  }
}

// ============================================
// CUSTOMER QUERIES
// ============================================

export async function getCustomerMetrics(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<CustomerMetrics> {
  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    include: {
      customer: true,
    },
  })

  // Get all customers for this tenant
  const allCustomers = await db.user.findMany({
    where: {
      tenantId,
      role: 'CUSTOMER',
    },
  })

  const totalCustomers = allCustomers.length

  // Customer segmentation
  const customerOrdersMap = new Map<string, { orders: number; revenue: number; firstOrder: Date; lastOrder: Date; name: string; email: string }>()

  orders.forEach((order) => {
    const existing = customerOrdersMap.get(order.customerId) || {
      orders: 0,
      revenue: 0,
      firstOrder: order.createdAt,
      lastOrder: order.createdAt,
      name: order.customer?.name || 'Unknown',
      email: order.customer?.email || '',
    }
    existing.orders += 1
    existing.revenue += order.total
    if (order.createdAt < existing.firstOrder) existing.firstOrder = order.createdAt
    if (order.createdAt > existing.lastOrder) existing.lastOrder = order.createdAt
    customerOrdersMap.set(order.customerId, existing)
  })

  // New vs returning customers
  const newCustomers = Array.from(customerOrdersMap.values()).filter((c) => c.orders === 1).length
  const returningCustomers = Array.from(customerOrdersMap.values()).filter((c) => c.orders > 1).length

  // Average lifetime value
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const avgLifetimeValue = customerOrdersMap.size > 0 ? totalRevenue / customerOrdersMap.size : 0

  // Average purchase frequency
  const totalPurchases = orders.length
  const avgPurchaseFrequency = customerOrdersMap.size > 0 ? totalPurchases / customerOrdersMap.size : 0

  // Top customers
  const topCustomers: TopCustomer[] = Array.from(customerOrdersMap.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      email: data.email,
      totalOrders: data.orders,
      totalRevenue: data.revenue,
      avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
      lastOrderDate: data.lastOrder.toISOString(),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)

  return {
    totalCustomers,
    newCustomers,
    returningCustomers,
    avgLifetimeValue,
    avgPurchaseFrequency,
    customersBySegment: [
      { segment: 'new', count: newCustomers, revenue: 0, percentage: 0 },
      { segment: 'returning', count: returningCustomers, revenue: 0, percentage: 0 },
    ],
    topCustomers,
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function getOrdersInPeriod(tenantId: string, startDate: Date, endDate: Date) {
  return db.order.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      customer: true,
    },
  })
}
