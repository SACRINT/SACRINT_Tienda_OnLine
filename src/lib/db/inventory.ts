// Inventory Data Access Layer
// Functions for inventory management, reservations, and stock tracking

import { db } from "./client";
import { ensureTenantAccess } from "./tenant";
import type { InventoryReason } from "@/lib/types/user-role";

/**
 * Gets current stock for a product or variant with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID
 * @param variantId - Optional variant ID
 * @returns Stock quantity
 */
export async function getProductStock(
  tenantId: string,
  productId: string,
  variantId?: string,
) {
  await ensureTenantAccess(tenantId);

  if (variantId) {
    const variant = await db.productVariant.findFirst({
      where: {
        id: variantId,
        product: {
          tenantId,
        },
      },
      select: { stock: true },
    });

    if (!variant) {
      throw new Error("Variant not found or does not belong to tenant");
    }

    return { stock: variant.stock };
  }

  const product = await db.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
    select: { stock: true },
  });

  if (!product) {
    throw new Error("Product not found or does not belong to tenant");
  }

  return { stock: product.stock };
}

/**
 * Creates an inventory reservation for an order with tenant validation
 * IMPORTANT: Does NOT deduct stock yet, only creates reservation record
 * @param tenantId - Tenant ID to validate access
 * @param orderId - Order ID
 * @param items - Array of items to reserve
 * @returns Reservation ID
 */
export async function reserveInventory(
  tenantId: string,
  orderId: string,
  items: Array<{ productId: string; variantId?: string; quantity: number }>,
) {
  await ensureTenantAccess(tenantId);

  // Verify order belongs to tenant
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      tenantId,
    },
  });

  if (!order) {
    throw new Error("Order not found or does not belong to tenant");
  }

  // Validate all items have sufficient stock
  for (const item of items) {
    if (item.quantity <= 0) {
      throw new Error("Quantity must be positive");
    }

    const stockInfo = await getProductStock(
      tenantId,
      item.productId,
      item.variantId,
    );

    if (stockInfo.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for product ${item.productId}. Available: ${stockInfo.stock}, Requested: ${item.quantity}`,
      );
    }
  }

  // Create reservation with items
  const reservation = await db.inventoryReservation.create({
    data: {
      orderId,
      status: "RESERVED",
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
  });

  return reservation.id;
}

/**
 * Confirms a reservation and deducts stock with tenant validation
 * Uses transaction to ensure atomicity
 * @param tenantId - Tenant ID to validate access
 * @param reservationId - Reservation ID
 */
export async function confirmInventoryReservation(
  tenantId: string,
  reservationId: string,
) {
  await ensureTenantAccess(tenantId);

  // Get reservation with items and order
  const reservation = await db.inventoryReservation.findUnique({
    where: { id: reservationId },
    include: {
      items: true,
      order: {
        select: {
          tenantId: true,
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Verify reservation's order belongs to tenant
  if (reservation.order.tenantId !== tenantId) {
    throw new Error("Reservation does not belong to tenant");
  }

  if (reservation.status !== "RESERVED") {
    throw new Error(`Reservation already ${reservation.status.toLowerCase()}`);
  }

  // Use transaction to deduct stock and update reservation
  await db.$transaction(async (tx: any) => {
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
        });
      } else {
        // Deduct from product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.reservedQuantity,
            },
          },
        });
      }
    }

    // Update reservation status
    await tx.inventoryReservation.update({
      where: { id: reservationId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });
  });

  console.log(
    `[INVENTORY] Confirmed reservation ${reservationId}, deducted stock for ${reservation.items.length} items`,
  );
}

/**
 * Cancels a reservation with tenant validation
 * IMPORTANT: Does NOT restore stock (stock was never deducted)
 * @param tenantId - Tenant ID to validate access
 * @param reservationId - Reservation ID
 */
export async function cancelInventoryReservation(
  tenantId: string,
  reservationId: string,
) {
  await ensureTenantAccess(tenantId);

  const reservation = await db.inventoryReservation.findUnique({
    where: { id: reservationId },
    include: {
      order: {
        select: {
          tenantId: true,
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Verify reservation's order belongs to tenant
  if (reservation.order.tenantId !== tenantId) {
    throw new Error("Reservation does not belong to tenant");
  }

  if (reservation.status !== "RESERVED") {
    throw new Error(`Reservation already ${reservation.status.toLowerCase()}`);
  }

  // Simply mark as cancelled (no stock changes needed)
  await db.inventoryReservation.update({
    where: { id: reservationId },
    data: {
      status: "CANCELLED",
    },
  });

  console.log(`[INVENTORY] Cancelled reservation ${reservationId}`);
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
  reason: InventoryReason,
) {
  // Get current product
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true, tenantId: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const previousStock = product.stock;
  const newStock = previousStock + adjustment;

  // Validate stock doesn't go negative
  if (newStock < 0) {
    throw new Error(
      `Cannot adjust stock. Would result in negative stock: ${newStock}`,
    );
  }

  // Use transaction to update stock and create log
  const updated = await db.$transaction(async (tx: any) => {
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
    });

    // Create inventory log
    await tx.inventoryLog.create({
      data: {
        productId,
        adjustment,
        reason,
        previousStock,
        newStock,
      },
    });

    return updatedProduct;
  });

  console.log(
    `[INVENTORY] Adjusted stock for product ${productId}: ${previousStock} → ${newStock} (${adjustment >= 0 ? "+" : ""}${adjustment})`,
  );

  return updated;
}

/**
 * Gets products with low stock
 * @param tenantId - Tenant ID
 * @param threshold - Stock threshold (default 10)
 * @returns Products with stock <= threshold
 */
export async function getLowStockProducts(
  tenantId: string,
  threshold: number = 10,
) {
  await ensureTenantAccess(tenantId);

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
      stock: "asc", // Lowest stock first
    },
  });

  return products;
}

/**
 * Gets inventory change history for a product with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param productId - Product ID
 * @param limit - Max number of records (default 50)
 * @returns Inventory logs ordered by date descending
 */
export async function getInventoryHistory(
  tenantId: string,
  productId: string,
  limit: number = 50,
) {
  await ensureTenantAccess(tenantId);

  // Verify product belongs to tenant
  const product = await db.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
  });

  if (!product) {
    throw new Error("Product not found or does not belong to tenant");
  }

  const logs = await db.inventoryLog.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return logs;
}

/**
 * Gets complete inventory report for a tenant
 * @param tenantId - Tenant ID
 * @returns Summary stats and all products with stock info
 */
export async function getInventoryReport(tenantId: string) {
  await ensureTenantAccess(tenantId);

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
  });

  // Calculate summary statistics
  const totalProducts = products.length;

  let totalVariants = 0;
  let totalItemsInStock = 0;
  let lowStockProducts = 0;

  products.forEach((product: any) => {
    totalItemsInStock += product.stock;
    totalVariants += product.variants.length;

    if (product.stock < 10) {
      lowStockProducts++;
    }

    product.variants.forEach((variant: any) => {
      totalItemsInStock += variant.stock;
    });
  });

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
  };
}
