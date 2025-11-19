"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { EmptyState } from "@/components/ui/empty-state";
import { useCart } from "@/lib/store/useCart";

export default function CartPage() {
  const {
    items: cartItems,
    removeItem,
    updateQuantity,
    subtotal,
    tax,
    total,
  } = useCart();

  const [couponCode, setCouponCode] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = React.useState(0);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Hydrate the cart store on mount
  React.useEffect(() => {
    useCart.persist.rehydrate();
    setMounted(true);
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);

  const handleRemoveItem = (productId: string, variantId?: string | null) => {
    removeItem(productId, variantId);
  };

  const handleUpdateQuantity = (
    productId: string,
    newQuantity: number,
    variantId?: string | null,
  ) => {
    updateQuantity(productId, newQuantity, variantId);
  };

  const applyCoupon = async () => {
    setCouponError(null);
    setIsValidatingCoupon(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: subtotal(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data.coupon.code);
        setCouponDiscount(data.discount);
        setCouponCode("");
      } else {
        setCouponError(data.message || "Cupón inválido");
      }
    } catch (error) {
      // Fallback to demo coupons if API is not available
      const demoCode = couponCode.toUpperCase();
      if (demoCode === "BIENVENIDO10") {
        setAppliedCoupon(demoCode);
        setCouponDiscount(subtotal() * 0.1);
        setCouponCode("");
      } else if (demoCode === "ENVIOGRATIS") {
        setAppliedCoupon(demoCode);
        setCouponDiscount(0);
        setCouponCode("");
      } else if (demoCode === "SUMMER20") {
        setAppliedCoupon(demoCode);
        setCouponDiscount(subtotal() * 0.2);
        setCouponCode("");
      } else {
        setCouponError("Cupón inválido");
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError(null);
  };

  // Calculations
  const cartSubtotal = subtotal();
  const cartTax = tax();
  const shipping = cartSubtotal >= 1000 ? 0 : 99;
  const cartTotal = cartSubtotal - couponDiscount + shipping + cartTax;

  // Don't render until hydrated to avoid SSR mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="max-w-3xl mx-auto px-4">
          <EmptyState
            variant="cart"
            title="Tu carrito está vacío"
            description="Parece que aún no has agregado productos a tu carrito. Explora nuestro catálogo para encontrar lo que buscas."
            action={{
              label: "Explorar Productos",
              onClick: () => (window.location.href = "/shop"),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Tu Carrito</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || "default"}`}
                className="flex gap-4 p-4 bg-white rounded-lg shadow-soft"
              >
                {/* Product Image */}
                <div className="shrink-0 w-24 h-24 bg-neutral-100 rounded-md overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      📦
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-primary truncate">
                        {item.name}
                      </h3>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleRemoveItem(item.productId, item.variantId)
                      }
                      className="text-muted-foreground hover:text-error transition-colors"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <QuantitySelector
                      value={item.quantity}
                      min={1}
                      max={99}
                      onChange={(value) =>
                        handleUpdateQuantity(
                          item.productId,
                          value,
                          item.variantId,
                        )
                      }
                      size="sm"
                    />
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.price)} c/u
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <div className="pt-4">
              <Link
                href="/shop"
                className="inline-flex items-center text-primary hover:text-accent font-medium transition-colors"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Continuar Comprando
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Resumen del Pedido</h2>

              {/* Coupon */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">
                        {appliedCoupon}
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-sm text-error hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código de cupón"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError(null);
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={!couponCode || isValidatingCoupon}
                      >
                        {isValidatingCoupon ? "..." : "Aplicar"}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-error mt-1">{couponError}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Prueba: BIENVENIDO10, ENVIOGRATIS, SUMMER20
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(cartSubtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Descuento</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-success">Gratis</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (16%)</span>
                  <span>{formatPrice(cartTax)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button size="lg" className="w-full mt-6" asChild>
                <Link href="/checkout">
                  Proceder al Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {/* Free Shipping Info */}
              {cartSubtotal < 1000 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Agrega {formatPrice(1000 - cartSubtotal)} más para envío
                  gratis
                </p>
              )}

              {/* Trust Badges */}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Pago seguro con encriptación SSL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
