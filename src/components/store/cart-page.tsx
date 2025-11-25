// Cart Page Component
// Full page cart view with summary

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Minus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";


export interface CartPageItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  stock: number;
  href: string;
}

export interface CartPageProps {
  items: CartPageItem[];
  currency?: string;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onApplyCoupon?: (code: string) => void;
  onCheckout?: () => void;
  couponCode?: string;
  couponDiscount?: number;
  taxRate?: number;
  shippingCost?: number;
  freeShippingThreshold?: number;
  className?: string;
}

export function CartPage({
  items,
  currency = "USD",
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onCheckout,
  couponCode,
  couponDiscount = 0,
  taxRate = 0,
  shippingCost = 0,
  freeShippingThreshold = 50,
  className,
}: CartPageProps) {
  const [couponInput, setCouponInput] = React.useState("");

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const effectiveShipping =
    subtotal >= freeShippingThreshold ? 0 : shippingCost;
  const tax = (subtotal - couponDiscount) * taxRate;
  const total = subtotal - couponDiscount + effectiveShipping + tax;

  const handleApplyCoupon = () => {
    if (couponInput.trim()) {
      onApplyCoupon?.(couponInput.trim());
      setCouponInput("");
    }
  };

  if (items.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Add some items to get started
        </p>
        <Button asChild>
          <a href="/shop">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("grid lg:grid-cols-3 gap-8", className)}>
      {/* Cart items */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-2xl font-bold">Shopping Cart</h2>

        <div className="border rounded-lg divide-y">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex gap-4">
              {/* Image */}
              <a
                href={item.href}
                className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </a>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">
                      <a href={item.href} className="hover:text-primary">
                        {item.name}
                      </a>
                    </h3>
                    {item.variant && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.variant}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">{formatPrice(item.price)}</p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() =>
                          onUpdateQuantity?.(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="p-2 hover:bg-muted disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          onUpdateQuantity?.(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock}
                        className="p-2 hover:bg-muted disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {item.stock <= 10 && (
                      <span className="text-xs text-warning">
                        Only {item.stock} left
                      </span>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => onRemoveItem?.(item.id)}
                    className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="lg:col-span-1">
        <div className="border rounded-lg p-6 space-y-6 sticky top-4">
          <h3 className="text-lg font-semibold">Order Summary</h3>

          {/* Coupon */}
          {onApplyCoupon && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 px-3 py-2 text-sm border rounded-md"
                />
                <Button variant="outline" size="sm" onClick={handleApplyCoupon}>
                  Apply
                </Button>
              </div>
              {couponCode && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Tag className="h-4 w-4" />
                  <span>
                    {couponCode} applied (-{formatPrice(couponDiscount)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Summary lines */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {effectiveShipping === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  formatPrice(effectiveShipping)
                )}
              </span>
            </div>

            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Free shipping notice */}
          {subtotal < freeShippingThreshold && (
            <p className="text-xs text-muted-foreground">
              Add {formatPrice(freeShippingThreshold - subtotal)} more for free
              shipping
            </p>
          )}

          {/* Checkout button */}
          <Button className="w-full" size="lg" onClick={onCheckout}>
            Proceed to Checkout
          </Button>

          {/* Security badges */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Secure checkout powered by Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
