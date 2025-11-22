/**
 * Stock Manager
 * Gestión de inventario y movimientos de stock
 */

import { logger } from "../monitoring/logger";
import { trackError } from "../monitoring/metrics";

export class StockManager {
  /**
   * Calcular stock disponible
   */
  static calculateAvailableStock(quantity: number, reservedQuantity: number): number {
    return Math.max(0, quantity - reservedQuantity);
  }

  /**
   * Verificar si hay stock suficiente
   */
  static hasStockAvailable(
    quantity: number,
    reservedQuantity: number,
    requiredQuantity: number,
  ): boolean {
    const available = this.calculateAvailableStock(quantity, reservedQuantity);
    return available >= requiredQuantity;
  }

  /**
   * Calcular nivel de alerta de stock
   */
  static getStockAlertLevel(
    currentQuantity: number,
    reorderPoint: number,
  ): "ok" | "low" | "critical" | "out" {
    if (currentQuantity === 0) return "out";
    if (currentQuantity <= reorderPoint * 0.5) return "critical";
    if (currentQuantity <= reorderPoint) return "low";
    return "ok";
  }

  /**
   * Generar alerta de stock
   */
  static shouldGenerateAlert(
    currentQuantity: number,
    reorderPoint: number,
    lastAlertDate?: Date,
  ): boolean {
    const alertLevel = this.getStockAlertLevel(currentQuantity, reorderPoint);

    if (alertLevel === "ok") return false;

    // No generar alerta si ya se generó una en las últimas 24 horas
    if (lastAlertDate) {
      const hoursSinceLastAlert = (Date.now() - lastAlertDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastAlert < 24) return false;
    }

    return true;
  }

  /**
   * Calcular cantidad a reordenar
   */
  static calculateReorderQuantity(
    currentQuantity: number,
    reorderPoint: number,
    reorderQuantity: number,
    maxCapacity?: number,
  ): number {
    if (currentQuantity > reorderPoint) return 0;

    const suggestedQuantity = reorderQuantity;

    if (maxCapacity) {
      const availableCapacity = maxCapacity - currentQuantity;
      return Math.min(suggestedQuantity, availableCapacity);
    }

    return suggestedQuantity;
  }

  /**
   * Validar movimiento de stock
   */
  static validateStockMovement(
    type: "in" | "out" | "transfer" | "adjustment",
    quantity: number,
    currentStock: number,
    fromLocation?: string,
    toLocation?: string,
  ): { valid: boolean; error?: string } {
    if (quantity <= 0) {
      return { valid: false, error: "La cantidad debe ser mayor a 0" };
    }

    if (type === "out" || type === "transfer") {
      if (quantity > currentStock) {
        return {
          valid: false,
          error: "Stock insuficiente para esta operación",
        };
      }
    }

    if (type === "transfer") {
      if (!fromLocation || !toLocation) {
        return {
          valid: false,
          error: "Se requieren ubicaciones de origen y destino",
        };
      }
      if (fromLocation === toLocation) {
        return {
          valid: false,
          error: "Las ubicaciones de origen y destino deben ser diferentes",
        };
      }
    }

    return { valid: true };
  }

  /**
   * Calcular valor de inventario
   */
  static calculateInventoryValue(
    items: Array<{
      quantity: number;
      cost: number;
    }>,
  ): number {
    return items.reduce((total, item) => {
      return total + item.quantity * item.cost;
    }, 0);
  }

  /**
   * Calcular días de stock restante
   */
  static calculateDaysOfStock(currentQuantity: number, averageDailySales: number): number {
    if (averageDailySales === 0) return Infinity;
    return Math.floor(currentQuantity / averageDailySales);
  }

  /**
   * Calcular tasa de rotación de inventario
   */
  static calculateTurnoverRate(
    soldQuantity: number,
    averageInventory: number,
    periodDays: number = 30,
  ): number {
    if (averageInventory === 0) return 0;
    return (soldQuantity / averageInventory) * (365 / periodDays);
  }

  /**
   * Logging de movimiento de stock
   */
  static async logStockMovement(movement: {
    type: "in" | "out" | "transfer" | "adjustment";
    productId: string;
    quantity: number;
    fromLocationId?: string;
    toLocationId?: string;
    reason: string;
    userId: string;
  }): Promise<void> {
    try {
      logger.info(
        {
          type: "stock_movement",
          movementType: movement.type,
          productId: movement.productId,
          quantity: movement.quantity,
          fromLocation: movement.fromLocationId,
          toLocation: movement.toLocationId,
          reason: movement.reason,
          userId: movement.userId,
        },
        `Stock ${movement.type}: ${movement.quantity} units`,
      );
    } catch (error) {
      trackError("stock_logging_error", error instanceof Error ? error.message : "Unknown");
      logger.error({ error }, "Failed to log stock movement");
    }
  }
}

export default StockManager;
