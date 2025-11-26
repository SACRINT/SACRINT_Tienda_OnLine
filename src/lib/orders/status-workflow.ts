/**
 * Order Status Workflow
 * Task 15.1: Order Status Workflow
 *
 * Sistema de estados de órdenes con validación de transiciones
 * y lógica de negocio para cada cambio de estado
 */

import { db } from "@/lib/db";

// ============================================================================
// ORDER STATUSES
// ============================================================================

export const OrderStatuses = {
  PENDING: "PENDING", // Orden creada, pago pendiente
  PAID: "PROCESSING", // Procesando pedido, listo para procesar
  PROCESSING: "PROCESSING", // Preparando envío
  SHIPPED: "SHIPPED", // En tránsito
  DELIVERED: "DELIVERED", // Entregado
  CANCELLED: "CANCELLED", // Cancelado
  REFUNDED: "REFUNDED", // Reembolsado
} as const;

export type OrderStatus = keyof typeof OrderStatuses;

// ============================================================================
// STATUS TRANSITIONS (Finite State Machine)
// ============================================================================

/**
 * Define las transiciones válidas entre estados
 * Cada estado puede transicionar solo a los estados definidos en su array
 */
export const StatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"], // Solo se puede reembolsar después de entregado
  CANCELLED: ["REFUNDED"], // Puede reembolsarse si estaba pagado
  REFUNDED: [], // Estado final
};

/**
 * Valida si una transición de estado es permitida
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return StatusTransitions[from]?.includes(to) ?? false;
}

/**
 * Obtiene los estados posibles desde un estado actual
 */
export function getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return StatusTransitions[currentStatus] || [];
}

// ============================================================================
// STATUS METADATA
// ============================================================================

export interface StatusMetadata {
  label: string;
  description: string;
  color: "gray" | "yellow" | "blue" | "green" | "red" | "purple";
  icon: string;
  allowsModification: boolean; // Si se puede modificar la orden en este estado
  requiresNotification: boolean; // Si se debe notificar al cliente
}

export const StatusMetadataMap: Record<OrderStatus, StatusMetadata> = {
  PENDING: {
    label: "Pending Payment",
    description: "Order created, waiting for payment confirmation",
    color: "yellow",
    icon: "⏳",
    allowsModification: true,
    requiresNotification: true,
  },
  PAID: {
    label: "Paid",
    description: "Payment confirmed, ready to process",
    color: "blue",
    icon: "💳",
    allowsModification: true,
    requiresNotification: true,
  },
  PROCESSING: {
    label: "Processing",
    description: "Order is being prepared for shipment",
    color: "blue",
    icon: "📦",
    allowsModification: true,
    requiresNotification: true,
  },
  SHIPPED: {
    label: "Shipped",
    description: "Order is in transit to destination",
    color: "purple",
    icon: "🚚",
    allowsModification: false,
    requiresNotification: true,
  },
  DELIVERED: {
    label: "Delivered",
    description: "Order has been delivered successfully",
    color: "green",
    icon: "✅",
    allowsModification: false,
    requiresNotification: true,
  },
  CANCELLED: {
    label: "Cancelled",
    description: "Order has been cancelled",
    color: "red",
    icon: "❌",
    allowsModification: false,
    requiresNotification: true,
  },
  REFUNDED: {
    label: "Refunded",
    description: "Payment has been refunded",
    color: "gray",
    icon: "💰",
    allowsModification: false,
    requiresNotification: true,
  },
};

/**
 * Obtiene metadata de un estado
 */
export function getStatusMetadata(status: OrderStatus): StatusMetadata {
  return StatusMetadataMap[status];
}

// ============================================================================
// STATUS HISTORY TRACKING
// ============================================================================

export interface StatusHistoryEntry {
  from: OrderStatus;
  to: OrderStatus;
  reason?: string;
  changedBy: string; // User ID
  changedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Valida transición y retorna errores si no es válida
 */
export function validateTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return {
      valid: false,
      error: "Order is already in this status",
    };
  }

  if (!canTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }

  return { valid: true };
}

// ============================================================================
// BUSINESS LOGIC PER TRANSITION
// ============================================================================

/**
 * Ejecuta lógica de negocio al transicionar estados
 */
export async function executeTransitionLogic(
  orderId: string,
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Lógica específica por transición
  switch (toStatus) {
    case "PROCESSING":
      // Reducir stock cuando se confirma el pago
      await reduceStock(order);
      break;

    case "CANCELLED":
      // Restaurar stock si la orden se cancela
      if (fromStatus === "PROCESSING" || fromStatus === "PROCESSING") {
        await restoreStock(order);
      }
      break;

    case "REFUNDED":
      // Restaurar stock si se reembolsa
      await restoreStock(order);
      break;

    case "SHIPPED":
      // Registrar fecha de envío
      await db.order.update({
        where: { id: orderId },
        data: { shippedAt: new Date() },
      });
      break;

    case "DELIVERED":
      // Registrar fecha de entrega
      await db.order.update({
        where: { id: orderId },
        data: { deliveredAt: new Date() },
      });
      break;
  }
}

/**
 * Reduce stock de productos en la orden
 */
async function reduceStock(order: any): Promise<void> {
  for (const item of order.items) {
    await db.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });
  }
}

/**
 * Restaura stock de productos en la orden
 */
async function restoreStock(order: any): Promise<void> {
  for (const item of order.items) {
    await db.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity,
        },
      },
    });
  }
}

// ============================================================================
// STATUS QUERY HELPERS
// ============================================================================

/**
 * Verifica si una orden está en estado final (no puede cambiar)
 */
export function isFinalStatus(status: OrderStatus): boolean {
  return ["DELIVERED", "REFUNDED"].includes(status);
}

/**
 * Verifica si una orden puede ser cancelada
 */
export function canBeCancelled(status: OrderStatus): boolean {
  return ["PENDING", "PROCESSING", "PROCESSING"].includes(status);
}

/**
 * Verifica si una orden puede ser reembolsada
 */
export function canBeRefunded(status: OrderStatus): boolean {
  return ["PROCESSING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status);
}

/**
 * Verifica si una orden puede ser modificada (agregar/quitar items)
 */
export function canBeModified(status: OrderStatus): boolean {
  const metadata = getStatusMetadata(status);
  return metadata.allowsModification;
}

// ============================================================================
// STATUS STATISTICS
// ============================================================================

/**
 * Obtiene estadísticas de órdenes por estado
 */
export async function getOrderStatusStats(tenantId: string, dateFrom?: Date, dateTo?: Date) {
  const where: any = { tenantId };

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  const orders = await db.order.findMany({
    where,
    select: {
      status: true,
      total: true,
    },
  });

  const stats = Object.keys(OrderStatuses).map((status) => {
    const ordersInStatus = orders.filter((o) => o.status === status);
    const count = ordersInStatus.length;
    const revenue = ordersInStatus.reduce((sum, o) => sum + Number(o.total), 0);

    return {
      status: status as OrderStatus,
      count,
      revenue: Math.round(revenue * 100) / 100,
      percentage: orders.length > 0 ? Math.round((count / orders.length) * 1000) / 10 : 0,
    };
  });

  return stats;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convierte string a OrderStatus con validación
 */
export function parseOrderStatus(status: string): OrderStatus {
  const upperStatus = status.toUpperCase();

  if (upperStatus in OrderStatuses) {
    return upperStatus as OrderStatus;
  }

  throw new Error(`Invalid order status: ${status}`);
}

/**
 * Obtiene el color Tailwind CSS para un estado
 */
export function getStatusColor(status: OrderStatus): string {
  const colorMap = {
    gray: "bg-gray-100 text-gray-800 border-gray-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    red: "bg-red-100 text-red-800 border-red-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
  };

  const metadata = getStatusMetadata(status);
  return colorMap[metadata.color];
}
