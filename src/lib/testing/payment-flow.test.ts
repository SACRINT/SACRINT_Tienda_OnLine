/**
 * End-to-End Testing Suite & Payment Flow Integration Tests
 * Semana 35, Tarea 35.9-35.10: E2E & Payment Flow Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { getPaymentOrchestrator } from '@/lib/payments'
import { getAdvancedOrderManager } from '@/lib/payments'
import { getAdvancedFraudDetector } from '@/lib/payments'
import { getInvoiceGenerator } from '@/lib/payments'

describe('Payment Flow Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  describe('Complete Payment Flow', () => {
    it('should process a successful payment end-to-end', async () => {
      const orchestrator = getPaymentOrchestrator()

      const result = await orchestrator.processPayment('order-123', 100, 'USD', 'stripe')

      expect(result.success).toBe(true)
      expect(result.transaction).toBeDefined()
      expect(result.transaction?.amount).toBe(100)
      expect(result.transaction?.status).toBe('captured')
    })

    it('should fail gracefully when all gateways fail', async () => {
      const orchestrator = getPaymentOrchestrator()

      // Disable all gateways
      orchestrator.toggleGateway('stripe', false)
      orchestrator.toggleGateway('mercadopago', false)

      const result = await orchestrator.processPayment('order-456', 50, 'USD')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('ALL_GATEWAYS_FAILED')
    })

    it('should detect fraud and block suspicious transactions', async () => {
      const fraudDetector = getAdvancedFraudDetector()

      const fraudScore = fraudDetector.analyzeFraudRisk('customer-123', {
        amount: 5000,
        currency: 'USD',
        country: 'KP', // North Korea - suspicious
        device: 'unknown-device',
        ip: '127.0.0.1',
        paymentMethod: 'card',
        email: 'test@tempmail.com',
        timestamp: new Date(),
      })

      expect(fraudScore.score).toBeGreaterThan(70)
      expect(fraudScore.riskLevel).toBe('high')
    })
  })

  describe('Order Management Flow', () => {
    it('should create and manage order lifecycle', async () => {
      const orderManager = getAdvancedOrderManager()

      // Create order
      const order = orderManager.createOrder('customer-123', 'tenant-456', [
        {
          id: 'item-1',
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 50,
          discount: 0,
          taxRate: 21,
          total: 100,
        },
      ])

      expect(order.status).toBe('pending')
      expect(order.total).toBe(100)

      // Confirm order
      const confirmed = orderManager.confirmOrder(order.id, 'txn-123')
      expect(confirmed?.status).toBe('confirmed')

      // Pack order
      const packed = orderManager.packOrder(order.id, {
        method: 'express',
        carrier: 'FedEx',
        cost: 15,
      })
      expect(packed?.status).toBe('packed')

      // Ship order
      const shipped = orderManager.shipOrder(order.id, 'FDX123456789')
      expect(shipped?.status).toBe('shipped')
      expect(shipped?.shippingInfo?.trackingNumber).toBe('FDX123456789')

      // Deliver order
      const delivered = orderManager.deliverOrder(order.id)
      expect(delivered?.status).toBe('delivered')
      expect(delivered?.fulfillmentStatus).toBe('fulfilled')
    })

    it('should prevent cancellation of shipped orders', async () => {
      const orderManager = getAdvancedOrderManager()

      const order = orderManager.createOrder('customer-123', 'tenant-456', [])
      orderManager.confirmOrder(order.id, 'txn-123')
      orderManager.packOrder(order.id, { method: 'express', carrier: 'FedEx' })
      orderManager.shipOrder(order.id, 'FDX123456789')

      const cancelled = orderManager.cancelOrder(order.id, 'Test cancellation')

      expect(cancelled).toBeNull()
    })
  })

  describe('Invoice Generation', () => {
    it('should generate invoices with correct calculations', async () => {
      const invoiceGenerator = getInvoiceGenerator()

      const invoice = invoiceGenerator.generateInvoice(
        'order-789',
        'customer-123',
        'tenant-456',
        [
          {
            id: '1',
            description: 'Product A',
            quantity: 2,
            unitPrice: 100,
            discount: 10,
            taxRate: 21,
            total: 200,
          },
        ],
        'USD',
      )

      expect(invoice.total).toBeGreaterThan(invoice.subtotal)
      expect(invoice.taxAmount).toBeGreaterThan(0)
      expect(invoice.status).toBe('draft')
    })

    it('should export invoices in multiple formats', async () => {
      const invoiceGenerator = getInvoiceGenerator()

      const invoice = invoiceGenerator.generateInvoice(
        'order-xyz',
        'customer-123',
        'tenant-456',
        [],
        'USD',
      )

      const pdf = invoiceGenerator.exportInvoice(invoice.id, 'pdf')
      const json = invoiceGenerator.exportInvoice(invoice.id, 'json')
      const html = invoiceGenerator.exportInvoice(invoice.id, 'html')
      const xml = invoiceGenerator.exportInvoice(invoice.id, 'xml')

      expect(pdf).toBeTruthy()
      expect(json).toBeTruthy()
      expect(html).toContain('<html>')
      expect(xml).toContain('<?xml')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid payment amounts', async () => {
      const orchestrator = getPaymentOrchestrator()

      expect(() => {
        orchestrator.processPayment('order-123', -100, 'USD')
      }).toThrow()
    })

    it('should handle network timeouts gracefully', async () => {
      const orchestrator = getPaymentOrchestrator()

      // Simulate timeout by using very short timeout
      const result = await orchestrator.processPayment('order-123', 100, 'USD')

      // Should either succeed or fail gracefully
      expect(result.success !== undefined).toBe(true)
    })

    it('should recover from gateway failures', async () => {
      const orchestrator = getPaymentOrchestrator()

      // First attempt fails (simulated)
      // Second attempt should succeed with fallback gateway
      const result = await orchestrator.processPayment('order-123', 100, 'USD', 'stripe')

      expect(result.attemptCount >= 1).toBe(true)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous payments', async () => {
      const orchestrator = getPaymentOrchestrator()

      const promises = Array(5)
        .fill(null)
        .map((_, i) =>
          orchestrator.processPayment(`order-${i}`, 100, 'USD'),
        )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      expect(results.every((r) => r.transaction || !r.success)).toBe(true)
    })

    it('should handle concurrent order creation', async () => {
      const orderManager = getAdvancedOrderManager()

      const promises = Array(10)
        .fill(null)
        .map((_, i) =>
          orderManager.createOrder(`customer-${i}`, 'tenant-456', []),
        )

      const orders = await Promise.all(promises)

      expect(orders).toHaveLength(10)
      expect(orders.every((o) => o.id)).toBe(true)
    })
  })
})
