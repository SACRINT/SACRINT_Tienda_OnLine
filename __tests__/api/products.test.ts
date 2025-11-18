/**
 * Products API Integration Tests
 *
 * These tests verify the Product Management API endpoints:
 * - GET /api/products/:id
 * - PATCH /api/products/:id (Quick Edit)
 * - POST /api/products/bulk (Bulk Operations)
 * - GET /api/products/stock (Stock Management)
 */

import { GET as getProduct, PATCH as patchProduct } from '@/app/api/products/[id]/route'
import { POST as bulkProducts, GET as exportProducts } from '@/app/api/products/bulk/route'
import { GET as getStock, PATCH as patchStock } from '@/app/api/products/stock/route'
import { mockAdminSession, mockCustomerSession, mockProduct, createMockPrismaClient, parseCSV } from '../utils/test-helpers'
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

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/products/:id', () => {
    it('should return product details with category and images', async () => {
      // Setup
      auth.mockResolvedValue(mockAdminSession)
      db.product.findFirst.mockResolvedValue(mockProduct)

      // Create request
      const req = new NextRequest('http://localhost:3000/api/products/product-1?tenantId=test-tenant-id')
      const params = { id: 'product-1' }

      // Execute
      const response = await getProduct(req, { params })
      const data = await response.json()

      // Verify
      expect(response.status).toBe(200)
      expect(data.id).toBe('product-1')
      expect(data.name).toBe('Test Product')
      expect(data.category).toBeDefined()
      expect(data.images).toHaveLength(1)

      // Verify tenant isolation
      expect(db.product.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: 'product-1',
          tenantId: 'test-tenant-id',
        }),
        include: expect.any(Object),
      })
    })

    it('should return 404 for non-existent product', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.findFirst.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/products/non-existent?tenantId=test-tenant-id')
      const params = { id: 'non-existent' }

      const response = await getProduct(req, { params })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Product not found' })
    })

    it('should enforce tenant isolation', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.findFirst.mockResolvedValue(null) // Product from another tenant

      const req = new NextRequest('http://localhost:3000/api/products/product-1?tenantId=test-tenant-id')
      const params = { id: 'product-1' }

      const response = await getProduct(req, { params })

      // Verify query includes tenantId filter
      expect(db.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'test-tenant-id',
          }),
        })
      )
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/products/:id', () => {
    it('should allow quick edit of price', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.findFirst.mockResolvedValue(mockProduct)
      db.product.update.mockResolvedValue({ ...mockProduct, price: 2499 })
      // db.activityLog.create.mockResolvedValue({})

      const req = new NextRequest('http://localhost:3000/api/products/product-1', {
        method: 'PATCH',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          field: 'price',
          value: 2499,
        }),
      })
      const params = { id: 'product-1' }

      const response = await patchProduct(req, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.price).toBe(2499)
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { price: 2499 },
      })
      // expect(db.activityLog.create.toHaveBeenCalled()
    })

    it('should allow quick edit of stock', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.findFirst.mockResolvedValue(mockProduct)
      db.product.update.mockResolvedValue({ ...mockProduct, stock: 150 })
      // db.activityLog.create.mockResolvedValue({})

      const req = new NextRequest('http://localhost:3000/api/products/product-1', {
        method: 'PATCH',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          field: 'stock',
          value: 150,
        }),
      })
      const params = { id: 'product-1' }

      const response = await patchProduct(req, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stock).toBe(150)
    })

    it('should validate price is positive', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const req = new NextRequest('http://localhost:3000/api/products/product-1', {
        method: 'PATCH',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          field: 'price',
          value: -100, // Invalid negative price
        }),
      })
      const params = { id: 'product-1' }

      const response = await patchProduct(req, { params })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Invalid request' })
      )
    })

    it('should return 403 for unauthorized users', async () => {
      auth.mockResolvedValue(mockCustomerSession) // Customer cannot edit

      const req = new NextRequest('http://localhost:3000/api/products/product-1', {
        method: 'PATCH',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          field: 'price',
          value: 2499,
        }),
      })
      const params = { id: 'product-1' }

      const response = await patchProduct(req, { params })

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/products/bulk', () => {
    it('should perform bulk delete operation', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.updateMany.mockResolvedValue({ count: 3 })
      // db.activityLog.create.mockResolvedValue({})

      const req = new NextRequest('http://localhost:3000/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          productIds: ['product-1', 'product-2', 'product-3'],
          action: 'delete',
        }),
      })

      const response = await bulkProducts(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(3)

      // Verify soft delete (status: ARCHIVED)
      expect(db.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['product-1', 'product-2', 'product-3'] },
          tenantId: 'test-tenant-id',
        },
        data: {
          status: 'ARCHIVED',
          deletedAt: expect.any(Date),
        },
      })

      // Verify activity log
      // expect(db.activityLog.create.toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'BULK_DELETE_PRODUCTS',
          metadata: expect.objectContaining({
            productIds: ['product-1', 'product-2', 'product-3'],
          }),
        }),
      })
    })

    it('should perform bulk price update', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.updateMany.mockResolvedValue({ count: 2 })
      // db.activityLog.create.mockResolvedValue({})

      const req = new NextRequest('http://localhost:3000/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          productIds: ['product-1', 'product-2'],
          action: 'updatePrice',
          value: 1999,
        }),
      })

      const response = await bulkProducts(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(db.product.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: { in: ['product-1', 'product-2'] },
        }),
        data: { price: 1999 },
      })
    })

    it('should perform bulk stock update', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.updateMany.mockResolvedValue({ count: 2 })
      // db.activityLog.create.mockResolvedValue({})

      const req = new NextRequest('http://localhost:3000/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          productIds: ['product-1', 'product-2'],
          action: 'updateStock',
          value: 50,
        }),
      })

      const response = await bulkProducts(req)

      expect(response.status).toBe(200)
      expect(db.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { stock: 50 },
        })
      )
    })

    it('should require value for operations that need it', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const req = new NextRequest('http://localhost:3000/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          productIds: ['product-1'],
          action: 'updatePrice',
          // Missing value
        }),
      })

      const response = await bulkProducts(req)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual(
        expect.objectContaining({ error: 'Invalid request' })
      )
    })
  })

  describe('GET /api/products/stock', () => {
    it('should return stock summary with categorization', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockProducts = [
        { ...mockProduct, id: 'p1', stock: 0, price: 1000 }, // Out of stock
        { ...mockProduct, id: 'p2', stock: 5, price: 2000 }, // Low stock (< 10)
        { ...mockProduct, id: 'p3', stock: 100, price: 1500 }, // In stock
        { ...mockProduct, id: 'p4', stock: 50, price: 3000 }, // In stock
      ]

      db.product.findMany.mockResolvedValue(mockProducts)
      // db.activityLog.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/products/stock?tenantId=test-tenant-id&lowStockThreshold=10')

      const response = await getStock(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()
      expect(data.summary.outOfStock).toBe(1)
      expect(data.summary.lowStock).toBe(1)
      expect(data.summary.inStock).toBe(2)

      // Verify inventory value calculation
      // 0*1000 + 5*2000 + 100*1500 + 50*3000 = 310,000
      expect(data.summary.totalInventoryValue).toBe(310000)

      expect(data.outOfStock).toHaveLength(1)
      expect(data.lowStock).toHaveLength(1)
      expect(data.inStock).toHaveLength(2)
    })

    it('should return recent stock changes', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.product.findMany.mockResolvedValue([mockProduct])

      const mockActivityLogs = [
        {
          id: 'log-1',
          action: 'PRODUCT_STOCK_UPDATE',
          metadata: { productId: 'product-1', previousStock: 90, newStock: 100 },
          createdAt: new Date('2025-01-15'),
          user: { name: 'Admin', email: 'admin@test.com' },
        },
      ]
      // db.activityLog.findMany.mockResolvedValue(mockActivityLogs)

      const req = new NextRequest('http://localhost:3000/api/products/stock?tenantId=test-tenant-id')

      const response = await getStock(req)
      const data = await response.json()

      expect(data.recentChanges).toHaveLength(1)
      expect(data.recentChanges[0].action).toBe('PRODUCT_STOCK_UPDATE')
    })
  })

  describe('GET /api/products/bulk (CSV Export)', () => {
    it('should export products as CSV', async () => {
      auth.mockResolvedValue(mockAdminSession)

      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          price: 1999,
          stock: 100,
          status: 'PUBLISHED',
          category: { name: 'Electronics' },
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'product-2',
          name: 'Product with "Quotes"',
          sku: 'TEST-002',
          price: 2999,
          stock: 50,
          status: 'DRAFT',
          category: { name: 'Books' },
          createdAt: new Date('2025-01-02'),
        },
      ]

      db.product.findMany.mockResolvedValue(mockProducts)

      const req = new NextRequest('http://localhost:3000/api/products/bulk?tenantId=test-tenant-id&format=csv')

      const response = await exportProducts(req)
      const csv = await response.text()

      // Verify CSV format
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('products-export')

      // Parse CSV
      const rows = parseCSV(csv)

      // Verify headers
      expect(rows[0]).toContain('ID')
      expect(rows[0]).toContain('Name')
      expect(rows[0]).toContain('SKU')
      expect(rows[0]).toContain('Price')

      // Verify data rows
      expect(rows).toHaveLength(3) // Header + 2 products
      expect(rows[1]).toContain('Test Product')

      // Verify proper quote escaping
      expect(rows[2].join(',')).toContain('Product with ""Quotes""')
    })
  })
})
