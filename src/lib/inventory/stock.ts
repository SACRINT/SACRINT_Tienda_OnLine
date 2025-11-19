// @ts-nocheck
// Stock Management
// Core inventory tracking functionality

import { db } from "@/lib/db";
import { eventBus, Events } from "@/lib/realtime/events";

export type StockMovementType =
  | "purchase"
  | "sale"
  | "return"
  | "adjustment"
  | "transfer"
  | "loss"
  | "initial";

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string;
  type: StockMovementType;
  quantity: number; // Positive for in, negative for out
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string; // Order ID, PO number, etc.
  createdBy: string;
  createdAt: Date;
}

export interface StockLevel {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

// Get current stock for a product
export async function getProductStock(productId: string): Promise<number> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  return product?.stock || 0;
}

// Update stock level
export async function updateStock(
  productId: string,
  quantity: number,
  type: StockMovementType,
  options?: {
    variantId?: string;
    reason?: string;
    reference?: string;
    createdBy?: string;
  },
): Promise<{ success: boolean; newStock: number; movement?: StockMovement }> {
  return await db.$transaction(async (tx) => {
    // Get current stock
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true, tenantId: true, name: true },
    });

    if (!product) {
      return { success: false, newStock: 0 };
    }

    const previousStock = product.stock;
    const newStock = previousStock + quantity;

    // Prevent negative stock
    if (newStock < 0) {
      return { success: false, newStock: previousStock };
    }

    // Update product stock
    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    // Create movement record
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        variantId: options?.variantId,
        type,
        quantity,
        previousStock,
        newStock,
        reason: options?.reason,
        reference: options?.reference,
        createdBy: options?.createdBy || "system",
      },
    });

    // Emit real-time update
    eventBus.emit(Events.STOCK_UPDATE, {
      productId,
      tenantId: product.tenantId,
      oldStock: previousStock,
      newStock,
    });

    // Check for low stock alert
    if (newStock <= 5 && previousStock > 5) {
      // Would trigger notification
      console.log("Low stock alert for:", product.name);
    }

    return {
      success: true,
      newStock,
      movement: {
        id: movement.id,
        productId: movement.productId,
        variantId: movement.variantId || undefined,
        type: movement.type as StockMovementType,
        quantity: movement.quantity,
        previousStock: movement.previousStock,
        newStock: movement.newStock,
        reason: movement.reason || undefined,
        reference: movement.reference || undefined,
        createdBy: movement.createdBy,
        createdAt: movement.createdAt,
      },
    };
  });
}

// Reserve stock for order
export async function reserveStock(
  productId: string,
  quantity: number,
  orderId: string,
): Promise<boolean> {
  const result = await updateStock(productId, -quantity, "sale", {
    reference: orderId,
    reason: "Reserved for order",
  });
  return result.success;
}

// Release reserved stock
export async function releaseStock(
  productId: string,
  quantity: number,
  orderId: string,
): Promise<boolean> {
  const result = await updateStock(productId, quantity, "return", {
    reference: orderId,
    reason: "Order cancelled/returned",
  });
  return result.success;
}

// Bulk stock update
export async function bulkUpdateStock(
  updates: Array<{
    productId: string;
    quantity: number;
    type: StockMovementType;
    reason?: string;
  }>,
  createdBy: string,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const update of updates) {
    const result = await updateStock(
      update.productId,
      update.quantity,
      update.type,
      { reason: update.reason, createdBy },
    );

    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// Get stock levels for all products
export async function getStockLevels(
  tenantId: string,
  options?: {
    status?: "in_stock" | "low_stock" | "out_of_stock";
    categoryId?: string;
    search?: string;
  },
): Promise<StockLevel[]> {
  const where: Record<string, unknown> = { tenantId };

  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }

  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { sku: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const products = await db.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      reorderPoint: true,
      reorderQuantity: true,
    },
  });

  let levels = products.map((product) => {
    const currentStock = product.stock;
    const reservedStock = 0; // Would calculate from pending orders
    const availableStock = currentStock - reservedStock;

    let status: StockLevel["status"] = "in_stock";
    if (currentStock === 0) {
      status = "out_of_stock";
    } else if (currentStock <= (product.reorderPoint || 5)) {
      status = "low_stock";
    }

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku || "",
      currentStock,
      reservedStock,
      availableStock,
      reorderPoint: product.reorderPoint || 5,
      reorderQuantity: product.reorderQuantity || 10,
      status,
    };
  });

  // Filter by status
  if (options?.status) {
    levels = levels.filter((l) => l.status === options.status);
  }

  return levels;
}

// Get stock movement history
export async function getStockMovements(
  productId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    type?: StockMovementType;
    limit?: number;
  },
): Promise<StockMovement[]> {
  const where: Record<string, unknown> = { productId };

  if (options?.type) {
    where.type = options.type;
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      (where.createdAt as Record<string, Date>).gte = options.startDate;
    }
    if (options.endDate) {
      (where.createdAt as Record<string, Date>).lte = options.endDate;
    }
  }

  const movements = await db.stockMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
  });

  return movements.map((m) => ({
    id: m.id,
    productId: m.productId,
    variantId: m.variantId || undefined,
    type: m.type as StockMovementType,
    quantity: m.quantity,
    previousStock: m.previousStock,
    newStock: m.newStock,
    reason: m.reason || undefined,
    reference: m.reference || undefined,
    createdBy: m.createdBy,
    createdAt: m.createdAt,
  }));
}
