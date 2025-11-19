// Order Summary Component
// Checkout order summary sidebar

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Tag, Shield } from "lucide-react";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
}

export interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total: number;
  currency?: string;
  couponCode?: string;
  onRemoveCoupon?: () => void;
  collapsible?: boolean;
  className?: string;
}

export function OrderSummary({
  items,
  subtotal,
  discount = 0,
  shipping = 0,
  tax = 0,
  total,
  currency = "USD",
  couponCode,
  onRemoveCoupon,
  collapsible = true,
  className,
}: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = React.useState(!collapsible);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={cn("border rounded-lg", className)}>
      {/* Header */}
      {collapsible ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">Order Summary</span>
            <span className="text-sm text-muted-foreground">
              ({itemCount} items)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{formatPrice(total)}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>
      ) : (
        <div className="p-4 border-b">
          <h3 className="font-semibold">Order Summary</h3>
        </div>
      )}

      {/* Content */}
      {(isExpanded || !collapsible) && (
        <div className="p-4 space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground text-background rounded-full flex items-center justify-center text-xs">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">
                      {item.variant}
                    </p>
                  )}
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Summary lines */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {couponCode && discount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{couponCode}</span>
                  {onRemoveCoupon && (
                    <button
                      onClick={onRemoveCoupon}
                      className="text-xs underline ml-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  formatPrice(shipping)
                )}
              </span>
            </div>

            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure 256-bit SSL encryption</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderSummary;
