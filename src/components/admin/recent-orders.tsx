// Recent Orders Component
// Recent orders table for dashboard

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarCustom } from "@/components/ui/avatar-custom";
import { OrderStatusIndicator } from "@/components/ui/status-indicator";

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  items: number;
  date: string;
}

export interface RecentOrdersProps {
  orders: RecentOrder[];
  currency?: string;
  onViewOrder?: (orderId: string) => void;
  onViewAll?: () => void;
  loading?: boolean;
  className?: string;
}

export function RecentOrders({
  orders,
  currency = "USD",
  onViewOrder,
  onViewAll,
  loading,
  className,
}: RecentOrdersProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Recent Orders</h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No recent orders
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Order</th>
                <th className="text-left p-3 text-sm font-medium">Customer</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-right p-3 text-sm font-medium">Total</th>
                <th className="text-right p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items} items
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
                  <td className="p-3">
                    <OrderStatusIndicator status={order.status} size="sm" />
                  </td>
                  <td className="p-3 text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </td>
                  <td className="p-3 text-right">
                    {onViewOrder && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewOrder(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentOrders;
