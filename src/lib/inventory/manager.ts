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
  status: "ACTIVE" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
}

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId?: string;
  type: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
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
            variants: item.variantId
              ? { where: { id: item.variantId } }
              : undefined,
          },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const currentStock = item.variantId
          ? product.variants[0]?.stock || 0
          : product.stock;

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
            status: "ACTIVE",
            tenantId,
          },
        });

        reservations.push(reservation as InventoryReservation);

        logger.info(`Inventory reserved for product ${item.productId}`, {
          tenantId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          reservationId: reservation.id,
        });
      }
    });

    // Invalidate cache
    await cache.delPattern(`product:*`);

    return reservations;
  } catch (error) {
    logger.error("Failed to reserve inventory", error as Error, {
      tenantId,
      items,
    });
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
      const reservation = await tx.inventoryReservation.findUnique({
        where: { id: reservationId, tenantId },
        include: {
          product: true,
          variant: true,
        },
      });

      if (!reservation) {
        throw new Error(`Reservation ${reservationId} not found`);
      }

      if (reservation.status !== "ACTIVE") {
        throw new Error(`Reservation ${reservationId} is not active`);
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
        await tx.inventoryMovement.create({
          data: {
            productId: reservation.productId,
            variantId: reservation.variantId,
            type: "SALE",
            quantity: -reservation.quantity,
            previousStock: variant.stock + reservation.quantity,
            newStock: variant.stock,
            orderId: reservation.orderId,
            tenantId,
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
          where: { id: reservation.productId, tenantId },
          data: {
            stock: {
              decrement: reservation.quantity,
            },
          },
        });

        // Create movement record
        await tx.inventoryMovement.create({
          data: {
            productId: reservation.productId,
            type: "SALE",
            quantity: -reservation.quantity,
            previousStock: product.stock + reservation.quantity,
            newStock: product.stock,
            orderId: reservation.orderId,
            tenantId,
          },
        });

        // Check low stock
        if (product.stock <= (product.lowStockThreshold || 10)) {
          emitLowInventory(
            tenantId,
            reservation.productId,
            product.name,
            product.stock,
          );
        }
      }

      // Mark reservation as confirmed
      await tx.inventoryReservation.update({
        where: { id: reservationId },
        data: { status: "CONFIRMED" },
      });

      logger.info(`Inventory reservation confirmed: ${reservationId}`, {
        tenantId,
        productId: reservation.productId,
        quantity: reservation.quantity,
      });
    });

    // Invalidate cache
    await cache.delPattern(`product:*`);
  } catch (error) {
    logger.error("Failed to confirm reservation", error as Error, {
      tenantId,
      reservationId,
    });
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
    await db.inventoryReservation.update({
      where: { id: reservationId, tenantId },
      data: { status: "CANCELLED" },
    });

    logger.info(`Inventory reservation released: ${reservationId}`, {
      tenantId,
    });
  } catch (error) {
    logger.error("Failed to release reservation", error as Error, {
      tenantId,
      reservationId,
    });
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
        ...(tenantId && { tenantId }),
        status: "ACTIVE",
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    if (result.count > 0) {
      logger.info(`Expired ${result.count} old reservations`, { tenantId });
    }

    return result.count;
  } catch (error) {
    logger.error("Failed to expire old reservations", error as Error, { tenantId });
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

        await tx.inventoryMovement.create({
          data: {
            productId,
            variantId,
            type: "ADJUSTMENT",
            quantity,
            previousStock,
            newStock,
            reason,
            userId,
            tenantId,
          },
        });
      } else {
        const product = await tx.product.findUnique({
          where: { id: productId, tenantId },
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

        await tx.inventoryMovement.create({
          data: {
            productId,
            type: "ADJUSTMENT",
            quantity,
            previousStock,
            newStock,
            reason,
            userId,
            tenantId,
          },
        });
      }

      logger.audit("Inventory adjusted", {
        tenantId,
        productId,
        variantId,
        quantity,
        reason,
        userId,
      });
    });

    // Invalidate cache
    await cache.delPattern(`product:*`);
  } catch (error) {
    logger.error("Failed to adjust inventory", error as Error, {
      tenantId,
      productId,
    });
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
): Promise<{ movements: InventoryMovement[]; total: number }> {
  try {
    const where = {
      tenantId,
      ...(productId && { productId }),
    };

    const [movements, total] = await Promise.all([
      db.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
          variant: {
            select: {
              sku: true,
              name: true,
            },
          },
        },
      }),
      db.inventoryMovement.count({ where }),
    ]);

    return {
      movements: movements as InventoryMovement[],
      total,
    };
  } catch (error) {
    logger.error("Failed to get inventory movements", error as Error, {
      tenantId,
      productId,
    });
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
        stock: {
          lte: db.product.fields.lowStockThreshold,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
      },
    });

    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.lowStockThreshold || 10,
    }));
  } catch (error) {
    logger.error("Failed to get low stock products", error as Error, { tenantId });
    throw error;
  }
}
