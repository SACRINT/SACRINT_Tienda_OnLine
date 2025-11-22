/**
 * Stock Alert System
 * Sistema de alertas automáticas de inventario
 */

import { logger } from "../monitoring/logger";
import { alertManager } from "../monitoring/alerts";
import type { StockAlert } from "./types";

export class StockAlertSystem {
  /**
   * Verificar y generar alertas de stock bajo
   */
  static async checkLowStockAlerts(
    inventory: Array<{
      productId: string;
      productName: string;
      locationId: string;
      locationName: string;
      quantity: number;
      reorderPoint: number;
    }>,
  ): Promise<StockAlert[]> {
    const alerts: StockAlert[] = [];

    for (const item of inventory) {
      if (item.quantity === 0) {
        // Out of stock - Critical
        const alert: StockAlert = {
          id: `alert-${item.productId}-${item.locationId}-${Date.now()}`,
          productId: item.productId,
          locationId: item.locationId,
          type: "out_of_stock",
          currentQuantity: 0,
          threshold: item.reorderPoint,
          severity: "high",
          isResolved: false,
          createdAt: new Date(),
        };
        alerts.push(alert);

        // Send critical alert
        await alertManager.send({
          title: "Producto Agotado",
          message: `${item.productName} está agotado en ${item.locationName}`,
          severity: "critical",
          metadata: {
            productId: item.productId,
            locationId: item.locationId,
            productName: item.productName,
            locationName: item.locationName,
          },
        });
      } else if (item.quantity <= item.reorderPoint * 0.5) {
        // Very low stock - High priority
        const alert: StockAlert = {
          id: `alert-${item.productId}-${item.locationId}-${Date.now()}`,
          productId: item.productId,
          locationId: item.locationId,
          type: "low_stock",
          currentQuantity: item.quantity,
          threshold: item.reorderPoint,
          severity: "high",
          isResolved: false,
          createdAt: new Date(),
        };
        alerts.push(alert);

        await alertManager.send({
          title: "Stock Crítico",
          message: `${item.productName} tiene stock muy bajo (${item.quantity} unidades) en ${item.locationName}`,
          severity: "error",
          metadata: {
            productId: item.productId,
            locationId: item.locationId,
            quantity: item.quantity,
            threshold: item.reorderPoint,
          },
        });
      } else if (item.quantity <= item.reorderPoint) {
        // Low stock - Medium priority
        const alert: StockAlert = {
          id: `alert-${item.productId}-${item.locationId}-${Date.now()}`,
          productId: item.productId,
          locationId: item.locationId,
          type: "low_stock",
          currentQuantity: item.quantity,
          threshold: item.reorderPoint,
          severity: "medium",
          isResolved: false,
          createdAt: new Date(),
        };
        alerts.push(alert);

        await alertManager.send({
          title: "Stock Bajo",
          message: `${item.productName} necesita reabastecimiento (${item.quantity}/${item.reorderPoint}) en ${item.locationName}`,
          severity: "warning",
          metadata: {
            productId: item.productId,
            locationId: item.locationId,
            quantity: item.quantity,
            threshold: item.reorderPoint,
          },
        });
      }
    }

    logger.info(
      {
        type: "stock_alerts_generated",
        alertCount: alerts.length,
      },
      `Generated ${alerts.length} stock alerts`,
    );

    return alerts;
  }

  /**
   * Generar alerta de movimiento inusual
   */
  static async alertUnusualMovement(
    productId: string,
    productName: string,
    quantity: number,
    averageQuantity: number,
    threshold: number = 3,
  ): Promise<void> {
    const ratio = quantity / averageQuantity;

    if (ratio >= threshold) {
      await alertManager.send({
        title: "Movimiento de Stock Inusual",
        message: `Movimiento inusualmente grande detectado para ${productName}: ${quantity} unidades (promedio: ${averageQuantity})`,
        severity: "warning",
        metadata: {
          productId,
          quantity,
          averageQuantity,
          ratio,
        },
      });

      logger.warn(
        {
          type: "unusual_stock_movement",
          productId,
          quantity,
          averageQuantity,
          ratio,
        },
        "Unusual stock movement detected",
      );
    }
  }

  /**
   * Verificar discrepancias en inventario
   */
  static async checkInventoryDiscrepancies(
    expected: Array<{ productId: string; quantity: number }>,
    actual: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const discrepancies: Array<{
      productId: string;
      expected: number;
      actual: number;
      difference: number;
    }> = [];

    const expectedMap = new Map(expected.map((item) => [item.productId, item.quantity]));

    for (const actualItem of actual) {
      const expectedQty = expectedMap.get(actualItem.productId) || 0;
      const difference = actualItem.quantity - expectedQty;

      if (Math.abs(difference) > 0) {
        discrepancies.push({
          productId: actualItem.productId,
          expected: expectedQty,
          actual: actualItem.quantity,
          difference,
        });
      }
    }

    if (discrepancies.length > 0) {
      await alertManager.send({
        title: "Discrepancias en Inventario",
        message: `Se encontraron ${discrepancies.length} discrepancias en el conteo de inventario`,
        severity: "warning",
        metadata: {
          discrepancyCount: discrepancies.length,
          discrepancies: discrepancies.slice(0, 5), // Primeros 5
        },
      });

      logger.warn(
        {
          type: "inventory_discrepancies",
          discrepancyCount: discrepancies.length,
          discrepancies,
        },
        "Inventory discrepancies detected",
      );
    }
  }

  /**
   * Alerta de productos próximos a vencer (para productos perecederos)
   */
  static async alertExpiringProducts(
    products: Array<{
      productId: string;
      productName: string;
      expiryDate: Date;
      quantity: number;
      locationId: string;
    }>,
    daysThreshold: number = 30,
  ): Promise<void> {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    const expiringProducts = products.filter((product) => product.expiryDate <= thresholdDate);

    if (expiringProducts.length > 0) {
      await alertManager.send({
        title: "Productos Próximos a Vencer",
        message: `${expiringProducts.length} productos vencerán en los próximos ${daysThreshold} días`,
        severity: "warning",
        metadata: {
          count: expiringProducts.length,
          products: expiringProducts.slice(0, 10),
        },
      });

      logger.info(
        {
          type: "expiring_products_alert",
          count: expiringProducts.length,
          daysThreshold,
        },
        "Expiring products alert sent",
      );
    }
  }
}

export default StockAlertSystem;
