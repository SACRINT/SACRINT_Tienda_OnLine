/**
 * Inventory Management Types
 * Sistema de gestión de inventario multi-ubicación
 */

export interface InventoryLocation {
  id: string;
  name: string;
  code: string;
  type: "warehouse" | "store" | "distribution_center";
  address: string;
  isActive: boolean;
  capacity?: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  variantId?: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestocked?: Date;
  lastChecked?: Date;
}

export interface StockMovement {
  id: string;
  type: "in" | "out" | "transfer" | "adjustment";
  productId: string;
  variantId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  quantity: number;
  reason: string;
  reference?: string;
  createdBy: string;
  createdAt: Date;
}

export interface StockAlert {
  id: string;
  productId: string;
  variantId?: string;
  locationId: string;
  type: "low_stock" | "out_of_stock" | "overstock";
  currentQuantity: number;
  threshold: number;
  severity: "low" | "medium" | "high";
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  locationId: string;
  status: "draft" | "sent" | "confirmed" | "received" | "cancelled";
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  expectedDelivery?: Date;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
  receivedQuantity?: number;
}

export interface InventoryReport {
  totalValue: number;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  byLocation: {
    locationId: string;
    locationName: string;
    totalValue: number;
    itemCount: number;
  }[];
  byCategory: {
    category: string;
    totalValue: number;
    itemCount: number;
  }[];
}
