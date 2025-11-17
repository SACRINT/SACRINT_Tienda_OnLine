// Unit Tests - Dashboard Analytics DAL
// Tests for dashboard data access layer functions

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import {
  getDashboardMetrics,
  getSalesData,
  getTopProducts,
  getRecentOrders,
} from '@/lib/db/dashboard'

describe('Dashboard DAL', () => {
  const testTenantId = 'test-tenant-id'

  describe('getDashboardMetrics', () => {
    it('should return metrics object with required properties', async () => {
      const metrics = await getDashboardMetrics(testTenantId)

      expect(metrics).toHaveProperty('totalOrders')
      expect(metrics).toHaveProperty('totalRevenue')
      expect(metrics).toHaveProperty('totalProducts')
      expect(metrics).toHaveProperty('totalCustomers')
    })

    it('should return numeric values for all metrics', async () => {
      const metrics = await getDashboardMetrics(testTenantId)

      expect(typeof metrics.totalOrders).toBe('number')
      expect(typeof metrics.totalRevenue).toBe('number')
      expect(typeof metrics.totalProducts).toBe('number')
      expect(typeof metrics.totalCustomers).toBe('number')
    })

    it('should return non-negative values', async () => {
      const metrics = await getDashboardMetrics(testTenantId)

      expect(metrics.totalOrders).toBeGreaterThanOrEqual(0)
      expect(metrics.totalRevenue).toBeGreaterThanOrEqual(0)
      expect(metrics.totalProducts).toBeGreaterThanOrEqual(0)
      expect(metrics.totalCustomers).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getSalesData', () => {
    it('should return array of sales', async () => {
      const sales = await getSalesData(testTenantId, 30)

      expect(Array.isArray(sales)).toBe(true)
    })

    it('should return sales with correct structure', async () => {
      const sales = await getSalesData(testTenantId, 30)

      if (sales.length > 0) {
        const sale = sales[0]
        expect(sale).toHaveProperty('date')
        expect(sale).toHaveProperty('total')
        expect(sale).toHaveProperty('orders')
      }
    })

    it('should respect days parameter', async () => {
      const sales7 = await getSalesData(testTenantId, 7)
      const sales30 = await getSalesData(testTenantId, 30)

      // 7 days should have fewer or equal results than 30 days
      expect(sales7.length).toBeLessThanOrEqual(sales30.length)
    })

    it('should handle default days parameter', async () => {
      const salesDefault = await getSalesData(testTenantId)
      const sales30 = await getSalesData(testTenantId, 30)

      expect(salesDefault.length).toBe(sales30.length)
    })
  })

  describe('getTopProducts', () => {
    it('should return array of products', async () => {
      const products = await getTopProducts(testTenantId, 10)

      expect(Array.isArray(products)).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const products5 = await getTopProducts(testTenantId, 5)
      const products10 = await getTopProducts(testTenantId, 10)

      expect(products5.length).toBeLessThanOrEqual(5)
      expect(products10.length).toBeLessThanOrEqual(10)
    })

    it('should return products with order items count', async () => {
      const products = await getTopProducts(testTenantId, 10)

      if (products.length > 0) {
        const product = products[0]
        expect(product).toHaveProperty('_count')
        expect(product._count).toHaveProperty('orderItems')
      }
    })

    it('should handle default limit parameter', async () => {
      const productsDefault = await getTopProducts(testTenantId)
      const products10 = await getTopProducts(testTenantId, 10)

      expect(productsDefault.length).toBe(products10.length)
    })
  })

  describe('getRecentOrders', () => {
    it('should return array of orders', async () => {
      const orders = await getRecentOrders(testTenantId, 10)

      expect(Array.isArray(orders)).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const orders5 = await getRecentOrders(testTenantId, 5)
      const orders10 = await getRecentOrders(testTenantId, 10)

      expect(orders5.length).toBeLessThanOrEqual(5)
      expect(orders10.length).toBeLessThanOrEqual(10)
    })

    it('should return orders with user and items', async () => {
      const orders = await getRecentOrders(testTenantId, 10)

      if (orders.length > 0) {
        const order = orders[0]
        expect(order).toHaveProperty('user')
        expect(order).toHaveProperty('items')
        expect(Array.isArray(order.items)).toBe(true)
      }
    })

    it('should handle default limit parameter', async () => {
      const ordersDefault = await getRecentOrders(testTenantId)
      const orders10 = await getRecentOrders(testTenantId, 10)

      expect(ordersDefault.length).toBe(orders10.length)
    })

    it('should return orders sorted by createdAt descending', async () => {
      const orders = await getRecentOrders(testTenantId, 10)

      if (orders.length > 1) {
        const firstDate = new Date(orders[0].createdAt)
        const secondDate = new Date(orders[1].createdAt)
        expect(firstDate >= secondDate).toBe(true)
      }
    })
  })
})
