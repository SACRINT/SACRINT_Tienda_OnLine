/**
 * Advanced Order Management & Fulfillment
 * Semana 34, Tarea 34.7: Gestión avanzada de órdenes y fulfillment
 */

import { logger } from '@/lib/monitoring'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'cancelled'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  total: number
}

export interface ShippingInfo {
  method: string
  carrier: string
  trackingNumber?: string
  estimatedDelivery: Date
  actualDelivery?: Date
  cost: number
  insurance?: number
}

export interface Order {
  id: string
  orderId: string
  customerId: string
  tenantId: string
  items: OrderItem[]
  status: OrderStatus
  fulfillmentStatus: FulfillmentStatus
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  createdAt: Date
  updatedAt: Date
  shippingInfo?: ShippingInfo
  notes?: string
  metadata: Record<string, any>
}

export interface InventoryHold {
  orderId: string
  productId: string
  quantity: number
  heldUntil: Date
  released: boolean
}

export interface OrderTimeline {
  orderId: string
  events: Array<{
    timestamp: Date
    status: OrderStatus
    message: string
    userId?: string
  }>
}

export class AdvancedOrderManager {
  private orders: Map<string, Order> = new Map()
  private inventoryHolds: Map<string, InventoryHold[]> = new Map()
  private orderTimelines: Map<string, OrderTimeline> = new Map()

  constructor() {
    logger.debug({ type: 'order_manager_init' }, 'Advanced Order Manager inicializado')
  }

  createOrder(
    customerId: string,
    tenantId: string,
    items: OrderItem[],
    currency: string = 'USD',
  ): Order {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const tax = items.reduce((sum, item) => sum + (item.total * item.taxRate) / 100, 0)
    const discount = items.reduce((sum, item) => sum + (item.total * item.discount) / 100, 0)
    const total = subtotal + tax - discount

    const now = new Date()
    const order: Order = {
      id: `order_${Date.now()}_${Math.random()}`,
      orderId: `ORD-${Date.now()}`,
      customerId,
      tenantId,
      items,
      status: 'pending',
      fulfillmentStatus: 'unfulfilled',
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: 0,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency,
      createdAt: now,
      updatedAt: now,
      metadata: {},
    }

    this.orders.set(order.id, order)

    // Crear timeline
    const timeline: OrderTimeline = {
      orderId: order.id,
      events: [{ timestamp: now, status: 'pending', message: 'Orden creada' }],
    }
    this.orderTimelines.set(order.id, timeline)

    logger.info({ type: 'order_created', orderId: order.id, customerId }, `Orden creada: ${order.orderId}`)

    return order
  }

  holdInventory(orderId: string, items: OrderItem[]): void {
    const holds: InventoryHold[] = items.map((item) => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      heldUntil: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 horas
      released: false,
    }))

    this.inventoryHolds.set(orderId, holds)
    logger.info({ type: 'inventory_held', orderId, itemsCount: items.length }, 'Inventario reservado')
  }

  confirmOrder(orderId: string, paymentId: string): Order | null {
    const order = this.orders.get(orderId)
    if (!order) return null

    order.status = 'confirmed'
    order.updatedAt = new Date()
    this.addOrderEvent(orderId, 'confirmed', 'Orden confirmada por pago')

    logger.info({ type: 'order_confirmed', orderId, paymentId }, 'Orden confirmada')

    return order
  }

  packOrder(orderId: string, shippingInfo: Partial<ShippingInfo>): Order | null {
    const order = this.orders.get(orderId)
    if (!order) return null

    order.status = 'packed'
    order.shippingInfo = {
      method: shippingInfo.method || 'standard',
      carrier: shippingInfo.carrier || 'unknown',
      cost: shippingInfo.cost || 0,
      estimatedDelivery: shippingInfo.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
    order.updatedAt = new Date()

    this.addOrderEvent(orderId, 'packed', 'Orden empaquetada')

    logger.info({ type: 'order_packed', orderId, carrier: shippingInfo.carrier }, 'Orden empaquetada')

    return order
  }

  shipOrder(orderId: string, trackingNumber: string): Order | null {
    const order = this.orders.get(orderId)
    if (!order) return null

    order.status = 'shipped'
    if (order.shippingInfo) {
      order.shippingInfo.trackingNumber = trackingNumber
    }
    order.updatedAt = new Date()

    this.addOrderEvent(orderId, 'shipped', `Enviada con número de seguimiento: ${trackingNumber}`)

    logger.info({ type: 'order_shipped', orderId, trackingNumber }, 'Orden enviada')

    return order
  }

  deliverOrder(orderId: string): Order | null {
    const order = this.orders.get(orderId)
    if (!order) return null

    order.status = 'delivered'
    if (order.shippingInfo) {
      order.shippingInfo.actualDelivery = new Date()
    }
    order.fulfillmentStatus = 'fulfilled'
    order.updatedAt = new Date()

    this.addOrderEvent(orderId, 'delivered', 'Orden entregada')

    // Release inventory hold
    const holds = this.inventoryHolds.get(orderId)
    if (holds) {
      holds.forEach((h) => (h.released = true))
    }

    logger.info({ type: 'order_delivered', orderId }, 'Orden entregada')

    return order
  }

  cancelOrder(orderId: string, reason?: string): Order | null {
    const order = this.orders.get(orderId)
    if (!order) return null

    if (['shipped', 'delivered'].includes(order.status)) {
      logger.error({ type: 'order_cancel_failed', orderId }, 'No se puede cancelar orden ya enviada')
      return null
    }

    order.status = 'cancelled'
    order.updatedAt = new Date()
    this.addOrderEvent(orderId, 'cancelled', `Cancelada: ${reason || 'Sin especificar'}`)

    // Release inventory hold
    const holds = this.inventoryHolds.get(orderId)
    if (holds) {
      holds.forEach((h) => (h.released = true))
    }

    logger.info({ type: 'order_cancelled', orderId, reason }, 'Orden cancelada')

    return order
  }

  private addOrderEvent(orderId: string, status: OrderStatus, message: string): void {
    const timeline = this.orderTimelines.get(orderId)
    if (timeline) {
      timeline.events.push({
        timestamp: new Date(),
        status,
        message,
      })
    }
  }

  getOrder(orderId: string): Order | null {
    return this.orders.get(orderId) || null
  }

  getCustomerOrders(customerId: string, limit: number = 50): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  getTenantOrders(tenantId: string, status?: OrderStatus, limit: number = 100): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.tenantId === tenantId && (!status || o.status === status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  getOrderTimeline(orderId: string): OrderTimeline | null {
    return this.orderTimelines.get(orderId) || null
  }

  getOrderMetrics(tenantId: string): {
    totalOrders: number
    confirmedOrders: number
    shippedOrders: number
    deliveredOrders: number
    cancelledOrders: number
    averageOrderValue: number
    totalRevenue: number
  } {
    const orders = Array.from(this.orders.values()).filter((o) => o.tenantId === tenantId)

    return {
      totalOrders: orders.length,
      confirmedOrders: orders.filter((o) => o.status === 'confirmed').length,
      shippedOrders: orders.filter((o) => o.status === 'shipped').length,
      deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
      cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    }
  }
}

let globalOrderManager: AdvancedOrderManager | null = null

export function initializeAdvancedOrderManager(): AdvancedOrderManager {
  if (!globalOrderManager) {
    globalOrderManager = new AdvancedOrderManager()
  }
  return globalOrderManager
}

export function getAdvancedOrderManager(): AdvancedOrderManager {
  if (!globalOrderManager) {
    return initializeAdvancedOrderManager()
  }
  return globalOrderManager
}
