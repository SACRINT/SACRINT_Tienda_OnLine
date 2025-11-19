// Inventory Manager Component
// Manage product stock and inventory

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Package, History, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { BadgeCustom } from "@/components/ui/badge-custom";

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variant?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  lastUpdated: string;
}

export interface StockAdjustment {
  itemId: string;
  type: "add" | "remove" | "set";
  quantity: number;
  reason: string;
}

export interface InventoryManagerProps {
  items: InventoryItem[];
  onAdjustStock: (adjustment: StockAdjustment) => void;
  onViewHistory?: (itemId: string) => void;
  loading?: boolean;
  className?: string;
}

export function InventoryManager({
  items,
  onAdjustStock,
  onViewHistory,
  loading,
  className,
}: InventoryManagerProps) {
  const [adjustments, setAdjustments] = React.useState<
    Record<string, { quantity: number; type: "add" | "remove" | "set" }>
  >({});

  const handleAdjustmentChange = (
    itemId: string,
    field: "quantity" | "type",
    value: any,
  ) => {
    setAdjustments((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: prev[itemId]?.quantity || 0,
        type: prev[itemId]?.type || "add",
        [field]: value,
      },
    }));
  };

  const handleSaveAdjustment = (item: InventoryItem) => {
    const adjustment = adjustments[item.id];
    if (!adjustment || adjustment.quantity === 0) return;

    onAdjustStock({
      itemId: item.id,
      type: adjustment.type,
      quantity: adjustment.quantity,
      reason: "Manual adjustment",
    });

    // Clear adjustment
    setAdjustments((prev) => {
      const newAdj = { ...prev };
      delete newAdj[item.id];
      return newAdj;
    });
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableStock === 0) {
      return (
        <BadgeCustom variant="error" size="sm">
          Out of stock
        </BadgeCustom>
      );
    }
    if (item.availableStock <= item.reorderPoint) {
      return (
        <BadgeCustom variant="warning" size="sm">
          Low stock
        </BadgeCustom>
      );
    }
    return (
      <BadgeCustom variant="success" size="sm">
        In stock
      </BadgeCustom>
    );
  };

  const lowStockItems = items.filter(
    (item) => item.availableStock <= item.reorderPoint,
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Low Stock Alert
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {lowStockItems.length} product(s) are running low on stock
            </p>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 text-left text-sm font-medium">Product</th>
              <th className="p-3 text-center text-sm font-medium">Status</th>
              <th className="p-3 text-right text-sm font-medium">Current</th>
              <th className="p-3 text-right text-sm font-medium">Reserved</th>
              <th className="p-3 text-right text-sm font-medium">Available</th>
              <th className="p-3 text-center text-sm font-medium">Adjust</th>
              <th className="p-3 text-center text-sm font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-muted-foreground"
                >
                  No inventory items
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const adjustment = adjustments[item.id];
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                          {item.variant && ` • ${item.variant}`}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-center">{getStockStatus(item)}</td>
                    <td className="p-3 text-right">{item.currentStock}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {item.reservedStock}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {item.availableStock}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <select
                          value={adjustment?.type || "add"}
                          onChange={(e) =>
                            handleAdjustmentChange(
                              item.id,
                              "type",
                              e.target.value,
                            )
                          }
                          className="px-2 py-1 border rounded text-xs"
                        >
                          <option value="add">Add</option>
                          <option value="remove">Remove</option>
                          <option value="set">Set to</option>
                        </select>
                        <input
                          type="number"
                          value={adjustment?.quantity || ""}
                          onChange={(e) =>
                            handleAdjustmentChange(
                              item.id,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-16 px-2 py-1 border rounded text-sm"
                          min={0}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSaveAdjustment(item)}
                          disabled={!adjustment || adjustment.quantity === 0}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        {onViewHistory && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewHistory(item.id)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryManager;
