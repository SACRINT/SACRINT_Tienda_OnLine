// Cart Drawer Component
// Slide-out cart panel

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string;
  maxQuantity?: number;
}

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  currency?: string;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onCheckout?: () => void;
  onContinueShopping?: () => void;
  freeShippingThreshold?: number;
  className?: string;
}

export function CartDrawer({
  open,
  onClose,
  items,
  currency = "USD",
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
  freeShippingThreshold = 50,
  className,
}: CartDrawerProps) {
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

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const amountToFreeShipping = freeShippingThreshold - subtotal;
  const hasFreeShipping = subtotal >= freeShippingThreshold;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-xl z-50 transform transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="cart-title" className="text-lg font-semibold">
            Shopping Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        {freeShippingThreshold > 0 && (
          <div className="p-4 bg-muted/50 border-b">
            {hasFreeShipping ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                You have free shipping!
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  Add {formatPrice(amountToFreeShipping)} more for free shipping
                </p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        (subtotal / freeShippingThreshold) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Items */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              {onContinueShopping && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    onContinueShopping();
                    onClose();
                  }}
                >
                  Continue shopping
                </Button>
              )}
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                {/* Image */}
                <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{item.name}</h3>
                  {item.variant && (
                    <p className="text-sm text-muted-foreground">
                      {item.variant}
                    </p>
                  )}
                  <p className="text-sm font-medium mt-1">
                    {formatPrice(item.price)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() =>
                          onUpdateQuantity?.(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="p-1 hover:bg-muted disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          onUpdateQuantity?.(item.id, item.quantity + 1)
                        }
                        disabled={
                          item.maxQuantity !== undefined &&
                          item.quantity >= item.maxQuantity
                        }
                        className="p-1 hover:bg-muted disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem?.(item.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Item total */}
                <div className="text-sm font-medium">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout
            </p>
            <Button className="w-full" size="lg" onClick={onCheckout}>
              Checkout
            </Button>
            {onContinueShopping && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onContinueShopping();
                  onClose();
                }}
              >
                Continue Shopping
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default CartDrawer;
