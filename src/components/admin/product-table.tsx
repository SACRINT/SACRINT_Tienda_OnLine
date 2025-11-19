// Product Table Component
// Product listing table with bulk actions

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeCustom } from "@/components/ui/badge-custom";

export interface ProductTableItem {
  id: string;
  name: string;
  sku: string;
  image?: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  category?: string;
  sales?: number;
}

export interface ProductTableProps {
  products: ProductTableItem[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  currency?: string;
  loading?: boolean;
  className?: string;
}

export function ProductTable({
  products,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  onArchive,
  onBulkDelete,
  onBulkArchive,
  currency = "USD",
  loading,
  className,
}: ProductTableProps) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === products.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(products.map((p) => p.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <BadgeCustom variant="success" size="sm">Active</BadgeCustom>;
      case "draft":
        return <BadgeCustom variant="warning" size="sm">Draft</BadgeCustom>;
      case "archived":
        return <BadgeCustom variant="secondary" size="sm">Archived</BadgeCustom>;
      default:
        return null;
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return <span className="text-destructive">Out of stock</span>;
    }
    if (stock <= 10) {
      return <span className="text-warning">Low ({stock})</span>;
    }
    return <span>{stock}</span>;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          {onBulkDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkDelete(Array.from(selectedIds))}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          {onBulkArchive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkArchive(Array.from(selectedIds))}
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === products.length && products.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="p-3 text-left text-sm font-medium">Product</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-right text-sm font-medium">Stock</th>
              <th className="p-3 text-right text-sm font-medium">Price</th>
              <th className="p-3 text-right text-sm font-medium">Sales</th>
              <th className="p-3 text-right text-sm font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => handleSelect(product.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{getStatusBadge(product.status)}</td>
                  <td className="p-3 text-right text-sm">
                    {getStockStatus(product.stock)}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatPrice(product.price)}
                  </td>
                  <td className="p-3 text-right text-sm text-muted-foreground">
                    {product.sales || 0}
                  </td>
                  <td className="p-3 text-right">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setOpenMenuId(openMenuId === product.id ? null : product.id)
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                      {openMenuId === product.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-background border rounded-lg shadow-lg z-10 py-1">
                          {onView && (
                            <button
                              onClick={() => {
                                onView(product.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => {
                                onEdit(product.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                          )}
                          {onDuplicate && (
                            <button
                              onClick={() => {
                                onDuplicate(product.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            >
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </button>
                          )}
                          {onArchive && (
                            <button
                              onClick={() => {
                                onArchive(product.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => {
                                onDelete(product.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductTable;
