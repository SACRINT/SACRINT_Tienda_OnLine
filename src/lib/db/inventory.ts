// Inventory Data Access Layer
// Functions for inventory management, reservations, and stock tracking

import { db } from './client'
import { ensureTenantAccess } from './tenant'
import type { InventoryReason } from '@/lib/types/user-role'

/**
 * Gets current stock for a product or variant
 * @param productId - Product ID
 * @param variantId - Optional variant ID
 * @returns Stock quantity
 */
export async function getProductStock(productId: string, variantId?: string) {
  if (variantId) {
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    })

    if (!variant) {
      throw new Error('Variant not found')
    }

    return { stock: variant.stock }
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  return { stock: product.stock }
}

/**
 * Creates an inventory reservation for an order
 * IMPORTANT: Does NOT deduct stock yet, only creates reservation record
 * @param orderId - Order ID
 * @param items - Array of items to reserve
 * @returns Reservation ID
 */
export async function reserveInventory(
  orderId: string,
  items: Array<{ productId: string; variantId?: string; quantity: number }>
) {
  // Validate all items have sufficient stock
  for (const item of items) {
    if (item.quantity <= 0) {
      throw new Error('Quantity must be positive')
    }

    const stockInfo = await getProductStock(item.productId, item.variantId)

    if (stockInfo.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for product ${item.productId}. Available: ${stockInfo.stock}, Requested: ${item.quantity}`
      )
    }
  }

  // Create reservation with items
  const reservation = await db.inventoryReservation.create({
    data: {
      orderId,
      status: 'RESERVED',
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          reservedQuantity: item.quantity,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  return reservation.id
}

/**
 * Confirms a reservation and deducts stock
 * Uses transaction to ensure atomicity
 * @param reservationId - Reservation ID
 */
export async function confirmInventoryReservation(reservationId: string) {
  // Get reservation with items
  const reservation = await db.inventoryReservation.findUnique({
    where: { id: reservationId },
    include: { items: true },
  })

  if (!reservation) {
    throw new Error('Reservation not found')
  }

  if (reservation.status !== 'RESERVED') {
    throw new Error(`Reservation already ${reservation.status.toLowerCase()}`)
  }

  // Use transaction to deduct stock and update reservation
  await db.$transaction(async (tx) => {
    // Deduct stock for each item
    for (const item of reservation.items) {
      if (item.variantId) {
        // Deduct from variant stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.reservedQuantity,
            },
          },
        })
      } else {
        // Deduct from product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.reservedQuantity,
            },
          },
        })
      }
    }

    // Update reservation status
    await tx.inventoryReservation.update({
      where: { id: reservationId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    })
  })

  console.log(
    `[INVENTORY] Confirmed reservation ${reservationId}, deducted stock for ${reservation.items.length} items`
  )
}

/**
 * Cancels a reservation
 * IMPORTANT: Does NOT restore stock (stock was never deducted)
 * @param reservationId - Reservation ID
 */
export async function cancelInventoryReservation(reservationId: string) {
  const reservation = await db.inventoryReservation.findUnique({
    where: { id: reservationId },
  })

  if (!reservation) {
    throw new Error('Reservation not found')
  }

  if (reservation.status !== 'RESERVED') {
    throw new Error(`Reservation already ${reservation.status.toLowerCase()}`)
  }

  // Simply mark as cancelled (no stock changes needed)
  await db.inventoryReservation.update({
    where: { id: reservationId },
    data: {
      status: 'CANCELLED',
    },
  })

  console.log(`[INVENTORY] Cancelled reservation ${reservationId}`)
}

/**
 * Adjusts product stock manually
 * Creates inventory log for tracking
 * @param productId - Product ID
 * @param adjustment - Positive (increase) or negative (decrease)
 * @param reason - Reason for adjustment
 * @returns Updated product
 */
export async function adjustProductStock(
  productId: string,
  adjustment: number,
  reason: InventoryReason
) {
  // Get current product
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true, tenantId: true },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  const previousStock = product.stock
  const newStock = previousStock + adjustment

  // Validate stock doesn't go negative
  if (newStock < 0) {
    throw new Error(
      `Cannot adjust stock. Would result in negative stock: ${newStock}`
    )
  }

  // Use transaction to update stock and create log
  const updated = await db.$transaction(async (tx) => {
    // Update product stock
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            size: true,
            color: true,
            stock: true,
          },
        },
      },
    })

    // Create inventory log
    await tx.inventoryLog.create({
      data: {
        productId,
        adjustment,
        reason,
        previousStock,
        newStock,
      },
    })

    return updatedProduct
  })

  console.log(
    `[INVENTORY] Adjusted stock for product ${productId}: ${previousStock} → ${newStock} (${adjustment >= 0 ? '+' : ''}${adjustment})`
  )

  return updated
}

/**
 * Gets products with low stock
 * @param tenantId - Tenant ID
 * @param threshold - Stock threshold (default 10)
 * @returns Products with stock <= threshold
 */
export async function getLowStockProducts(
  tenantId: string,
  threshold: number = 10
) {
  await ensureTenantAccess(tenantId)

  // Get products with low stock
  const products = await db.product.findMany({
    where: {
      tenantId,
      stock: {
        lte: threshold,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      lowStockThreshold: true,
      variants: {
        where: {
          stock: {
            lte: threshold,
          },
        },
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          stock: true,
        },
      },
    },
    orderBy: {
      stock: 'asc', // Lowest stock first
    },
  })

  return products
}

/**
 * Gets inventory change history for a product
 * @param productId - Product ID
 * @param limit - Max number of records (default 50)
 * @returns Inventory logs ordered by date descending
 */
export async function getInventoryHistory(
  productId: string,
  limit: number = 50
) {
  const logs = await db.inventoryLog.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })

  return logs
}

/**
 * Gets complete inventory report for a tenant
 * @param tenantId - Tenant ID
 * @returns Summary stats and all products with stock info
 */
export async function getInventoryReport(tenantId: string) {
  await ensureTenantAccess(tenantId)

  // Get all products for this tenant
  const products = await db.product.findMany({
    where: {
      tenantId,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      reserved: true,
      lowStockThreshold: true,
      variants: {
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          stock: true,
        },
      },
    },
  })

  // Calculate summary statistics
  const totalProducts = products.length

  let totalVariants = 0
  let totalItemsInStock = 0
  let lowStockProducts = 0

  products.forEach((product) => {
    totalItemsInStock += product.stock
    totalVariants += product.variants.length

    if (product.stock < 10) {
      lowStockProducts++
    }

    product.variants.forEach((variant) => {
      totalItemsInStock += variant.stock
    })
  })

  return {
    summary: {
      totalProducts,
      totalVariants,
      totalItemsInStock,
      lowStockProducts,
    },
    products: products.map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      reserved: p.reserved,
      available: p.stock - p.reserved,
      lowStockThreshold: p.lowStockThreshold,
      variants: p.variants,
    })),
  }
}
