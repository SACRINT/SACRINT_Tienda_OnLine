// Order Table Component
// Order listing table for admin

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, MoreHorizontal, Printer, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import {
  OrderStatusIndicator,
  PaymentStatusIndicator,
} from "@/components/ui/status-indicator";

export interface OrderTableItem {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  items: number;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  date: string;
  shippingMethod?: string;
}

export interface OrderTableProps {
  orders: OrderTableItem[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onView?: (id: string) => void;
  onPrint?: (id: string) => void;
  onEmail?: (id: string) => void;
  onExport?: (id: string) => void;
  currency?: string;
  loading?: boolean;
  className?: string;
}

export function OrderTable({
  orders,
  selectedIds,
  onSelectionChange,
  onView,
  onPrint,
  onEmail,
  onExport,
  currency = "USD",
  loading,
  className,
}: OrderTableProps) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(orders.map((o) => o.id)));
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

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="p-3 text-left w-10">
              <input
                type="checkbox"
                checked={
                  selectedIds.size === orders.length && orders.length > 0
                }
                onChange={handleSelectAll}
                className="rounded"
              />
            </th>
            <th className="p-3 text-left text-sm font-medium">Order</th>
            <th className="p-3 text-left text-sm font-medium">Customer</th>
            <th className="p-3 text-center text-sm font-medium">Status</th>
            <th className="p-3 text-center text-sm font-medium">Payment</th>
            <th className="p-3 text-right text-sm font-medium">Total</th>
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
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted-foreground">
                No orders found
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                className="border-b last:border-0 hover:bg-muted/50"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(order.id)}
                    onChange={() => handleSelect(order.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items} items • {order.date}
                    </p>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <AvatarCustom
                      src={order.customer.avatar}
                      name={order.customer.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {order.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customer.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <OrderStatusIndicator status={order.status} size="sm" />
                </td>
                <td className="p-3 text-center">
                  <PaymentStatusIndicator
                    status={order.paymentStatus}
                    size="sm"
                  />
                </td>
                <td className="p-3 text-right font-medium">
                  {formatPrice(order.total)}
                </td>
                <td className="p-3 text-right">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setOpenMenuId(openMenuId === order.id ? null : order.id)
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>

                    {openMenuId === order.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-background border rounded-lg shadow-lg z-10 py-1">
                        {onView && (
                          <button
                            onClick={() => {
                              onView(order.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                        )}
                        {onPrint && (
                          <button
                            onClick={() => {
                              onPrint(order.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Printer className="h-4 w-4" />
                            Print Invoice
                          </button>
                        )}
                        {onEmail && (
                          <button
                            onClick={() => {
                              onEmail(order.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Mail className="h-4 w-4" />
                            Send Email
                          </button>
                        )}
                        {onExport && (
                          <button
                            onClick={() => {
                              onExport(order.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          >
                            <FileText className="h-4 w-4" />
                            Export PDF
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
  );
}

export default OrderTable;
