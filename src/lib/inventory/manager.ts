/**
 * Inventory Management System
 * Handles stock reservations, updates, and tracking
 */

import { db } from "@/lib/db/client";
import { logger } from "@/lib/monitoring/logger";
import { cache } from "@/lib/cache/redis";
import { emitLowInventory } from "@/lib/websocket/server";

export type InventoryMovementType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "RESERVATION"
  | "RELEASE"
  | "DAMAGE"
  | "TRANSFER";

export interface InventoryReservation {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reservedBy: string;
  reservedAt: Date;
  expiresAt: Date;
  orderId?: string;
  status: "RESERVED" | "CONFIRMED" | "CANCELLED";
}

export interface InventoryLog {
  id: string;
  productId: string;
  variantId?: string;
  adjustment: number;
  reason?: string;
  userId?: string;
  orderId?: string;
  createdAt: Date;
}

/**
 * Reserve inventory for an order
 */
export async function reserveInventory(
  tenantId: string,
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>,
  reservedBy: string,
  orderId?: string,
  expirationMinutes: number = 15,
): Promise<InventoryReservation[]> {
  const reservations: InventoryReservation[] = [];
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  try {
    await db.$transaction(async (tx: any) => {
      for (const item of items) {
        // Check available stock
        const product = await tx.product.findUnique({
          where: { id: item.productId, tenantId },
          include: {
            variants: item.variantId ? { where: { id: item.variantId } } : undefined,
          },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const currentStock = item.variantId ? product.variants[0]?.stock || 0 : product.stock;

        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${product.name}. Available: ${currentStock}, Requested: ${item.quantity}`,
          );
        }

        // Create reservation
        const reservation = await tx.inventoryReservation.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            reservedBy,
            expiresAt,
            orderId,
            status: "RESERVED",
            tenantId,
          },
        });

        reservations.push(reservation as InventoryReservation);

        logger.info(
          {
            tenantId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            reservationId: reservation.id,
          },
          `Inventory reserved for product ${item.productId}`,
        );
      }
    });

    // Invalidate cache
    await cache.delPattern(`product:*`);

    return reservations;
  } catch (error) {
    logger.error({ error: error, tenantId, items }, "Failed to reserve inventory");
    throw error;
  }
}

/**
 * Confirm reservation and deduct from stock
 */
export async function confirmInventoryReservation(
  tenantId: string,
  reservationId: string,
): Promise<void> {
  try {
    await db.$transaction(async (tx: any) => {
      const reservation = await tx.inventoryReservation.findFirst({
        where: { id: reservationId, tenantId },
        include: {
          product: true,
          variant: true,
        },
      });

      if (!reservation) {
        throw new Error(`Reservation ${reservationId} not found`);
      }

      if (reservation.status !== "RESERVED") {
        throw new Error(`Reservation ${reservationId} is not reserved`);
      }

      // Deduct from stock
      if (reservation.variantId) {
        const variant = await tx.productVariant.update({
          where: { id: reservation.variantId },
          data: {
            stock: {
              decrement: reservation.quantity,
            },
          },
        });

        // Create movement record
        await tx.inventoryLog.create({
          data: {
            productId: reservation.productId,
            adjustment: -reservation.quantity,
            reason: "SALE",
            orderId: reservation.orderId,
          },
        });

        // Check low stock
        if (variant.stock <= (reservation.product.lowStockThreshold || 10)) {
          emitLowInventory(
            tenantId,
            reservation.productId,
            reservation.product.name,
            variant.stock,
          );
        }
      } else {
        const product = await tx.product.update({
          where: { id: reservation.productId },
          data: {
            stock: {
              decrement: reservation.quantity,
            },
          },
        });

        // Create movement record
        await tx.inventoryLog.create({
          data: {
            productId: reservation.productId,
            adjustment: -reservation.quantity,
            reason: "SALE",
            orderId: reservation.orderId,
          },
        });

        // Check low stock
        if (product.stock <= (product.lowStockThreshold || 10)) {
          emitLowInventory(tenantId, reservation.productId, product.name, product.stock);
        }
      }

      // Mark reservation as confirmed
      await tx.inventoryReservation.update({
        where: { id: reservationId },
        data: { status: "CONFIRMED" },
      });

      logger.info(
        {
          tenantId,
          productId: reservation.productId,
          quantity: reservation.quantity,
          reservationId,
        },
        `Inventory reservation confirmed: ${reservationId}`,
      );
    });

    // Invalidate cache
    await cache.delPattern(`product:*`);
  } catch (error) {
    logger.error({ error: error, tenantId, reservationId }, "Failed to confirm reservation");
    throw error;
  }
}

/**
 * Release (cancel) inventory reservation
 */
export async function releaseInventoryReservation(
  tenantId: string,
  reservationId: string,
): Promise<void> {
  try {
    await db.inventoryReservation.updateMany({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
    });

    logger.info({ tenantId, reservationId }, `Inventory reservation released: ${reservationId}`);
  } catch (error) {
    logger.error({ error, tenantId, reservationId }, "Failed to release reservation");
    throw error;
  }
}

/**
 * Expire old reservations (cleanup job)
 */
export async function expireOldReservations(tenantId?: string): Promise<number> {
  try {
    const result = await db.inventoryReservation.updateMany({
      where: {
        status: "RESERVED",
        order: tenantId ? { tenantId } : undefined,
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (result.count > 0) {
      logger.info({ tenantId, count: result.count }, `Expired ${result.count} old reservations`);
    }

    return result.count;
  } catch (error) {
    logger.error({ error, tenantId }, "Failed to expire old reservations");
    return 0;
  }
}

/**
 * Adjust inventory (manual adjustment)
 */
export async function adjustInventory(
  tenantId: string,
  productId: string,
  variantId: string | undefined,
  quantity: number,
  reason: string,
  userId?: string,
): Promise<void> {
  try {
    await db.$transaction(async (tx: any) => {
      if (variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
        });

        if (!variant) {
          throw new Error(`Variant ${variantId} not found`);
        }

        const previousStock = variant.stock;
        const newStock = previousStock + quantity;

        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: newStock },
        });

        await tx.inventoryLog.create({
          data: {
            productId,
            adjustment: quantity,
            reason,
          },
        });
      } else {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        const previousStock = product.stock;
        const newStock = previousStock + quantity;

        await tx.product.update({
          where: { id: productId },
          data: { stock: newStock },
        });

        await tx.inventoryLog.create({
          data: {
            productId,
            adjustment: quantity,
            reason,
          },
        });
      }

      logger.audit(
        { tenantId, productId, variantId, quantity, reason, userId },
        "Inventory adjusted",
      );
    });

    // Invalidate cache
    await cache.delPattern(`product:*`);
  } catch (error) {
    logger.error({ error: error, tenantId, productId }, "Failed to adjust inventory");
    throw error;
  }
}

/**
 * Get inventory movements history
 */
export async function getInventoryMovements(
  tenantId: string,
  productId?: string,
  limit: number = 50,
  offset: number = 0,
): Promise<{ movements: InventoryLog[]; total: number }> {
  try {
    const where = {
      ...(productId && { productId }),
    };

    const [movements, total] = await Promise.all([
      db.inventoryLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.inventoryLog.count({ where }),
    ]);

    return {
      movements: movements as InventoryLog[],
      total,
    };
  } catch (error) {
    logger.error({ error: error, tenantId, productId }, "Failed to get inventory movements");
    throw error;
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(
  tenantId: string,
): Promise<Array<{ id: string; name: string; stock: number; threshold: number }>> {
  try {
    const products = await db.product.findMany({
      where: {
        tenantId,
        published: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
      },
    });

    // Filter products with low stock in memory
    const lowStockProducts = products.filter((p: any) => p.stock <= (p.lowStockThreshold || 10));

    return lowStockProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.lowStockThreshold || 10,
    }));
  } catch (error) {
    logger.error({ error: error, tenantId }, "Failed to get low stock products");
    throw error;
  }
}
