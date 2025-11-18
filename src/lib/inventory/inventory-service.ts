/**
 * Inventory Management Service
 * Week 19-20: Advanced Inventory Management
 *
 * Features:
 * - Stock reservations for pending orders
 * - Automatic inventory adjustments
 * - Low stock alerts
 * - Inventory history tracking
 * - Bulk inventory updates
 * - Stock forecasting (basic)
 */

import { db } from '@/lib/db'
import { InventoryReason, ReservationStatus } from '@prisma/client'
import { createNotification } from '@/lib/notifications/notification-service'
import { NotificationType } from '@prisma/client'

export interface InventoryAdjustment {
  productId: string
  variantId?: string
  adjustment: number // Positive or negative
  reason: InventoryReason
}

export interface ReservationCreate {
  orderId: string
  items: {
    productId: string
    variantId?: string
    quantity: number
  }[]
}

/**
 * Reserve stock for an order
 */
export async function reserveStock(data: ReservationCreate) {
  try {
    // Check stock availability for all items
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      })

      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`)
      }
    }

    // Create reservation
    const reservation = await db.inventoryReservation.create({
      data: {
        orderId: data.orderId,
        status: ReservationStatus.RESERVED,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            reservedQuantity: item.quantity,
          })),
        },
      },
    })

    // Deduct stock and log changes
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      })

      await db.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })

      await db.inventoryLog.create({
        data: {
          productId: item.productId,
          adjustment: -item.quantity,
          reason: InventoryReason.PURCHASE,
          previousStock: product!.stock,
          newStock: product!.stock - item.quantity,
        },
      })
    }

    return { success: true, reservationId: reservation.id }
  } catch (error: any) {
    console.error('[Inventory Service] Reserve error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Confirm reservation when order is paid
 */
export async function confirmReservation(orderId: string) {
  try {
    await db.inventoryReservation.updateMany({
      where: { orderId },
      data: {
        status: ReservationStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('[Inventory Service] Confirm error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cancel reservation and restore stock
 */
export async function cancelReservation(orderId: string) {
  try {
    const reservation = await db.inventoryReservation.findUnique({
      where: { orderId },
      include: { items: true },
    })

    if (!reservation) {
      throw new Error('Reservation not found')
    }

    // Restore stock
    for (const item of reservation.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      })

      await db.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.reservedQuantity } },
      })

      await db.inventoryLog.create({
        data: {
          productId: item.productId,
          adjustment: item.reservedQuantity,
          reason: InventoryReason.RETURN,
          previousStock: product!.stock,
          newStock: product!.stock + item.reservedQuantity,
        },
      })
    }

    // Mark reservation as cancelled
    await db.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: ReservationStatus.CANCELLED },
    })

    return { success: true }
  } catch (error: any) {
    console.error('[Inventory Service] Cancel error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Adjust inventory (recount, damage, etc.)
 */
export async function adjustInventory(
  adjustments: InventoryAdjustment[],
  userId: string,
  tenantId: string
) {
  try {
    for (const adj of adjustments) {
      const product = await db.product.findUnique({
        where: { id: adj.productId },
        select: { stock: true, name: true },
      })

      if (!product) {
        throw new Error(`Product ${adj.productId} not found`)
      }

      const newStock = Math.max(0, product.stock + adj.adjustment)

      await db.product.update({
        where: { id: adj.productId },
        data: { stock: newStock },
      })

      await db.inventoryLog.create({
        data: {
          productId: adj.productId,
          adjustment: adj.adjustment,
          reason: adj.reason,
          previousStock: product.stock,
          newStock,
        },
      })

      // Check for low stock and notify
      await checkLowStock(adj.productId, newStock, product.name, userId, tenantId)
    }

    return { success: true }
  } catch (error: any) {
    console.error('[Inventory Service] Adjust error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check for low stock and create notification
 */
async function checkLowStock(
  productId: string,
  stock: number,
  productName: string,
  userId: string,
  tenantId: string
) {
  const LOW_STOCK_THRESHOLD = 10

  if (stock <= LOW_STOCK_THRESHOLD && stock > 0) {
    await createNotification({
      userId,
      tenantId,
      type: NotificationType.SYSTEM,
      title: 'Low Stock Alert',
      message: `Product "${productName}" is running low on stock. Current: ${stock} units.`,
      actionUrl: `/admin/stock`,
      metadata: { productId, stock },
    })
  } else if (stock === 0) {
    await createNotification({
      userId,
      tenantId,
      type: NotificationType.SYSTEM,
      title: 'Out of Stock',
      message: `Product "${productName}" is out of stock.`,
      actionUrl: `/admin/stock`,
      metadata: { productId },
    })
  }
}

/**
 * Get inventory history for a product
 */
export async function getInventoryHistory(productId: string, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return db.inventoryLog.findMany({
    where: {
      productId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(tenantId: string, threshold = 10) {
  return db.product.findMany({
    where: {
      tenantId,
      stock: { lte: threshold, gt: 0 },
      published: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      basePrice: true,
    },
    orderBy: { stock: 'asc' },
  })
}

/**
 * Get out of stock products
 */
export async function getOutOfStockProducts(tenantId: string) {
  return db.product.findMany({
    where: {
      tenantId,
      stock: 0,
      published: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      basePrice: true,
    },
  })
}

/**
 * Basic stock forecasting (7-day average)
 */
export async function forecastStock(productId: string) {
  const history = await getInventoryHistory(productId, 7)

  const purchases = history.filter((h) => h.reason === InventoryReason.PURCHASE)
  const totalSold = purchases.reduce((sum, h) => sum + Math.abs(h.adjustment), 0)
  const averagePerDay = totalSold / 7

  const currentProduct = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  })

  const daysUntilStockout = currentProduct
    ? Math.floor(currentProduct.stock / (averagePerDay || 1))
    : 0

  return {
    currentStock: currentProduct?.stock || 0,
    averageDailySales: averagePerDay,
    estimatedDaysUntilStockout: daysUntilStockout,
    recommendedReorder: daysUntilStockout < 7,
  }
}

/**
 * Bulk stock update
 */
export async function bulkStockUpdate(
  updates: { productId: string; newStock: number }[],
  reason: InventoryReason,
  userId: string,
  tenantId: string
) {
  const adjustments: InventoryAdjustment[] = []

  for (const update of updates) {
    const product = await db.product.findUnique({
      where: { id: update.productId },
      select: { stock: true },
    })

    if (product) {
      adjustments.push({
        productId: update.productId,
        adjustment: update.newStock - product.stock,
        reason,
      })
    }
  }

  return adjustInventory(adjustments, userId, tenantId)
}
