/**
 * Orders API Integration Tests
 *
 * These tests verify the Order Management API endpoints:
 * - PATCH /api/orders/:id/status (Status Workflow)
 * - POST /api/orders/:id/notes (Internal & Customer Notes)
 * - POST /api/orders/:id/refund (Stripe Refunds)
 */

import { GET as getStatusHistory, PATCH as updateStatus } from '@/app/api/orders/[id]/status/route'
import { GET as getNotes, POST as createNote, DELETE as deleteNote } from '@/app/api/orders/[id]/notes/route'
import { GET as getRefunds, POST as processRefund } from '@/app/api/orders/[id]/refund/route'
import { mockAdminSession, mockCustomerSession, mockOrder, createMockPrismaClient } from '../utils/test-helpers'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: createMockPrismaClient(),
}))

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    refunds: {
      create: jest.fn(),
    },
  }))
})

const { auth } = require('@/lib/auth/auth')
const { db } = require('@/lib/db')
const Stripe = require('stripe')

describe('Orders API', () => {
  let mockStripe: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockStripe = new Stripe()
  })

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status from PENDING to PROCESSING', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.order.findFirst.mockResolvedValue(mockOrder)
      db.order.update.mockResolvedValue({ ...mockOrder, status: 'PROCESSING' })
      db.activityLog.create.mockResolvedValue({})
      db.orderNote.create.mockResolvedValue({})

      const req = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PATCH',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          status: 'PROCESSING',
          note: 'Order is being prepared',
        }),
      })
      const params = { id: 'order-1' }

      const response = await updateStatus(req, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('PROCESSING')
      expect(db.activityLog.create).toHaveBeenCalled()
    })

    it('should validate allowed status transitions', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.order.findFirst.mockResolvedValue({ ...mockOrder, status: 'DELIVERED' })

      const req = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PATCH',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          status: 'PENDING',
        }),
      })
      const params = { id: 'order-1' }

      const response = await updateStatus(req, { params })
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/orders/:id/notes', () => {
    it('should create an internal note', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.order.findFirst.mockResolvedValue(mockOrder)
      db.orderNote.create.mockResolvedValue({
        id: 'note-1',
        content: 'Internal note',
        type: 'INTERNAL',
      })

      const req = new NextRequest('http://localhost:3000/api/orders/order-1/notes', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          content: 'Internal note',
          type: 'INTERNAL',
        }),
      })
      const params = { id: 'order-1' }

      const response = await createNote(req, { params })
      expect(response.status).toBe(201)
    })
  })

  describe('POST /api/orders/:id/refund', () => {
    it('should process a full refund via Stripe', async () => {
      auth.mockResolvedValue(mockAdminSession)
      db.order.findFirst.mockResolvedValue(mockOrder)
      db.order.update.mockResolvedValue({ ...mockOrder, status: 'CANCELLED' })
      db.activityLog.create.mockResolvedValue({})
      db.orderNote.create.mockResolvedValue({})

      mockStripe.refunds.create.mockResolvedValue({
        id: 'refund_123',
        status: 'succeeded',
        amount: 2999,
      })

      const req = new NextRequest('http://localhost:3000/api/orders/order-1/refund', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: 'test-tenant-id',
          reason: 'requested_by_customer',
        }),
      })
      const params = { id: 'order-1' }

      const response = await processRefund(req, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
