/**
 * Customers API Integration Tests
 *
 * These tests verify the Customer Management API endpoints:
 * - GET /api/customers/segmentation (RFM Analysis)
 * - GET /api/customers/:id (Customer Details)
 * - GET /api/customers/bulk (CSV Export)
 */

import { GET as getSegmentation } from '@/app/api/customers/segmentation/route'
import { GET as getCustomer } from '@/app/api/customers/[id]/route'
import { GET as exportCustomers } from '@/app/api/customers/bulk/route'
import { mockAdminSession, mockCustomer, createMockPrismaClient, calculateRFMScore, assignSegment, parseCSV } from '../utils/test-helpers'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: createMockPrismaClient(),
}))

const { auth } = require('@/lib/auth/auth')
const { db } = require('@/lib/db')

describe('Customers API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/customers/segmentation', () => {
    it('should calculate RFM scores correctly', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const mockCustomersWithOrders = [
        {
          id: 'customer-1',
          name: 'Champion Customer',
          email: 'champion@test.com',
          orders: [
            { total: 50000, status: 'DELIVERED', createdAt: thirtyDaysAgo },
            { total: 30000, status: 'DELIVERED', createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
            { total: 40000, status: 'DELIVERED', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
          ],
        },
      ]

      db.user.findMany.mockResolvedValue(mockCustomersWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/segmentation?tenantId=test-tenant-id')

      const response = await getSegmentation(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.customers).toBeDefined()
      expect(data.customers[0].rfmScore).toBeDefined()
      expect(data.customers[0].rfmScore.recency).toBeGreaterThan(0)
      expect(data.customers[0].rfmScore.frequency).toBeGreaterThan(0)
      expect(data.customers[0].rfmScore.monetary).toBeGreaterThan(0)
    })

    it('should assign Champions segment correctly', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const rfmScore = calculateRFMScore(10, 10, 1500)
      expect(rfmScore.recency).toBe(5)
      expect(rfmScore.frequency).toBe(5)
      expect(rfmScore.monetary).toBe(5)

      const segment = assignSegment(rfmScore, 10)
      expect(segment).toBe('champions')
    })

    it('should assign Loyal segment correctly', async () => {
      const rfmScore = calculateRFMScore(45, 5, 600)
      expect(rfmScore.frequency).toBeGreaterThanOrEqual(3)
      expect(rfmScore.monetary).toBeGreaterThanOrEqual(3)

      const segment = assignSegment(rfmScore, 45)
      expect(segment).toBe('loyal')
    })

    it('should assign Promising segment correctly', async () => {
      const rfmScore = calculateRFMScore(15, 1, 50)
      expect(rfmScore.recency).toBeGreaterThanOrEqual(4)
      expect(rfmScore.frequency).toBeLessThanOrEqual(2)

      const segment = assignSegment(rfmScore, 15)
      expect(segment).toBe('promising')
    })

    it('should assign New segment correctly', async () => {
      const rfmScore = calculateRFMScore(5, 1, 100)
      expect(rfmScore.recency).toBe(5)
      expect(rfmScore.frequency).toBe(1)

      const segment = assignSegment(rfmScore, 5)
      expect(segment).toBe('new')
    })

    it('should assign At Risk segment correctly', async () => {
      const rfmScore = calculateRFMScore(150, 5, 700)
      expect(rfmScore.recency).toBeLessThanOrEqual(2)
      expect(rfmScore.frequency).toBeGreaterThanOrEqual(3)

      const segment = assignSegment(rfmScore, 150)
      expect(segment).toBe('atRisk')
    })

    it('should assign Lost segment correctly', async () => {
      const rfmScore = calculateRFMScore(200, 1, 50)
      expect(rfmScore.recency).toBe(1)

      const segment = assignSegment(rfmScore, 200)
      expect(segment).toBe('lost')
    })

    it('should return summary with segment counts', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockCustomersWithOrders = [
        {
          id: 'c1',
          name: 'Champion',
          email: 'c1@test.com',
          orders: [
            { total: 100000, status: 'DELIVERED', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          ],
        },
        {
          id: 'c2',
          name: 'Lost',
          email: 'c2@test.com',
          orders: [
            { total: 5000, status: 'DELIVERED', createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) },
          ],
        },
      ]

      db.user.findMany.mockResolvedValue(mockCustomersWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/segmentation?tenantId=test-tenant-id')

      const response = await getSegmentation(req)
      const data = await response.json()

      expect(data.summary).toBeDefined()
      expect(data.summary.total).toBe(2)
      expect(data.summary.champions + data.summary.loyal + data.summary.atRisk + data.summary.lost + data.summary.new + data.summary.promising).toBe(2)
    })

    it('should sort customers by RFM total score', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const now = new Date()
      const mockCustomersWithOrders = [
        {
          id: 'c1',
          name: 'Low Score',
          email: 'c1@test.com',
          orders: [
            { total: 5000, status: 'DELIVERED', createdAt: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000) },
          ],
        },
        {
          id: 'c2',
          name: 'High Score',
          email: 'c2@test.com',
          orders: [
            { total: 150000, status: 'DELIVERED', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
          ],
        },
      ]

      db.user.findMany.mockResolvedValue(mockCustomersWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/segmentation?tenantId=test-tenant-id')

      const response = await getSegmentation(req)
      const data = await response.json()

      // First customer should have higher RFM score
      expect(data.customers[0].rfmScore.total).toBeGreaterThan(data.customers[1].rfmScore.total)
    })
  })

  describe('GET /api/customers/:id', () => {
    it('should return customer with order history', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockCustomerWithOrders = {
        ...mockCustomer,
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-001',
            status: 'DELIVERED',
            total: 5000,
            createdAt: new Date('2025-01-10'),
            items: [{ id: 'item-1', quantity: 1, price: 5000, product: { name: 'Product 1' } }],
          },
          {
            id: 'order-2',
            orderNumber: 'ORD-002',
            status: 'PENDING',
            total: 3000,
            createdAt: new Date('2025-01-15'),
            items: [{ id: 'item-2', quantity: 2, price: 1500, product: { name: 'Product 2' } }],
          },
        ],
      }

      db.user.findFirst.mockResolvedValue(mockCustomerWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/customer-1?tenantId=test-tenant-id')
      const params = { id: 'customer-1' }

      const response = await getCustomer(req, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders).toHaveLength(2)
      expect(data.orders[0].createdAt).toBe(new Date('2025-01-15').toISOString())
    })

    it('should return customer with addresses', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.user.findFirst.mockResolvedValue(mockCustomer)

      const req = new NextRequest('http://localhost:3000/api/customers/customer-1?tenantId=test-tenant-id')
      const params = { id: 'customer-1' }

      const response = await getCustomer(req, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.addresses).toBeDefined()
      expect(data.addresses.length).toBeGreaterThan(0)
      expect(data.addresses[0].isDefault).toBe(true)
    })

    it('should calculate customer stats correctly', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockCustomerWithOrders = {
        ...mockCustomer,
        orders: [
          { id: 'o1', total: 5000, status: 'DELIVERED', createdAt: new Date('2025-01-10'), items: [] },
          { id: 'o2', total: 3000, status: 'DELIVERED', createdAt: new Date('2025-01-15'), items: [] },
        ],
      }

      db.user.findFirst.mockResolvedValue(mockCustomerWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/customer-1?tenantId=test-tenant-id')
      const params = { id: 'customer-1' }

      const response = await getCustomer(req, { params })
      const data = await response.json()

      expect(data.stats.totalOrders).toBe(2)
      expect(data.stats.totalSpent).toBe(8000)
      expect(data.stats.averageOrderValue).toBe(4000)
      expect(data.stats.lastOrderDate).toBe(new Date('2025-01-15').toISOString())
    })

    it('should exclude cancelled orders from stats', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockCustomerWithOrders = {
        ...mockCustomer,
        orders: [
          { id: 'o1', total: 5000, status: 'DELIVERED', createdAt: new Date('2025-01-10'), items: [] },
          { id: 'o2', total: 3000, status: 'CANCELLED', createdAt: new Date('2025-01-15'), items: [] },
        ],
      }

      db.user.findFirst.mockResolvedValue(mockCustomerWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/customer-1?tenantId=test-tenant-id')
      const params = { id: 'customer-1' }

      const response = await getCustomer(req, { params })
      const data = await response.json()

      expect(data.stats.totalOrders).toBe(1)
      expect(data.stats.totalSpent).toBe(5000)
    })

    it('should return 404 for non-existent customer', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.user.findFirst.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/customers/non-existent?tenantId=test-tenant-id')
      const params = { id: 'non-existent' }

      const response = await getCustomer(req, { params })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/customers/bulk', () => {
    it('should export customers as CSV', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockCustomersWithOrders = [
        {
          id: 'c1',
          name: 'John Doe',
          email: 'john@test.com',
          phone: '+1234567890',
          createdAt: new Date('2024-01-01'),
          orders: [
            { total: 5000, status: 'DELIVERED', createdAt: new Date('2025-01-10'), items: [] },
          ],
        },
      ]

      db.user.findMany.mockResolvedValue(mockCustomersWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/bulk?tenantId=test-tenant-id')

      const response = await exportCustomers(req)
      const csv = await response.text()

      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('customers-export')

      const rows = parseCSV(csv)
      expect(rows.length).toBeGreaterThan(1)
      expect(rows[0]).toContain('Name')
      expect(rows[0]).toContain('Email')
    })

    it('should escape quotes in customer names', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockCustomersWithOrders = [
        {
          id: 'c1',
          name: 'John "Johnny" Doe',
          email: 'john@test.com',
          phone: '+1234567890',
          createdAt: new Date('2024-01-01'),
          orders: [],
        },
      ]

      db.user.findMany.mockResolvedValue(mockCustomersWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/bulk?tenantId=test-tenant-id')

      const response = await exportCustomers(req)
      const csv = await response.text()

      expect(csv).toContain('John ""Johnny"" Doe')
    })

    it('should filter by customerIds if provided', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockCustomersWithOrders = [
        {
          id: 'c1',
          name: 'Customer 1',
          email: 'c1@test.com',
          createdAt: new Date('2024-01-01'),
          orders: [],
        },
      ]

      db.user.findMany.mockResolvedValue(mockCustomersWithOrders)

      const req = new NextRequest('http://localhost:3000/api/customers/bulk?tenantId=test-tenant-id&customerIds=c1,c2')

      const response = await exportCustomers(req)

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['c1', 'c2'] },
          }),
        })
      )
    })
  })
})
