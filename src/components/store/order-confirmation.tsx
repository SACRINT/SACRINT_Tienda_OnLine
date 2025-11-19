// Order Confirmation Component
// Success page after checkout

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Package, Mail, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OrderDetails {
  orderNumber: string;
  email: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: {
    type: string;
    last4?: string;
  };
  estimatedDelivery?: string;
}

export interface OrderConfirmationProps {
  order: OrderDetails;
  currency?: string;
  onContinueShopping?: () => void;
  onViewOrder?: () => void;
  className?: string;
}

export function OrderConfirmation({
  order,
  currency = "USD",
  onContinueShopping,
  onViewOrder,
  className,
}: OrderConfirmationProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className={cn("max-w-2xl mx-auto space-y-8", className)}>
      {/* Success header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Thank you for your order!</h1>
          <p className="text-muted-foreground mt-1">
            Order #{order.orderNumber}
          </p>
        </div>
      </div>

      {/* Email confirmation notice */}
      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
        <Mail className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm">
          We've sent a confirmation email to{" "}
          <span className="font-medium">{order.email}</span>
        </p>
      </div>

      {/* Order items */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="font-semibold">Order Items</h2>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Delivery info */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Shipping address */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Shipping Address</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Payment method */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Payment Method</h3>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{order.paymentMethod.type}</p>
            {order.paymentMethod.last4 && (
              <p>ending in {order.paymentMethod.last4}</p>
            )}
          </div>
        </div>
      </div>

      {/* Estimated delivery */}
      {order.estimatedDelivery && (
        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Estimated Delivery</p>
            <p className="text-sm text-muted-foreground">
              {order.estimatedDelivery}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onViewOrder && (
          <Button className="flex-1" onClick={onViewOrder}>
            View Order Details
          </Button>
        )}
        {onContinueShopping && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={onContinueShopping}
          >
            Continue Shopping
          </Button>
        )}
      </div>

      {/* Help */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need help?{" "}
          <a href="/contact" className="text-primary hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}

export default OrderConfirmation;
