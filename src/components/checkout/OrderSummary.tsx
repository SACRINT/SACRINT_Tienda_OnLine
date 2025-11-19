// Order Summary Component
// Final review of order before placing

"use client";
import Image from "next/image";

import { Package, MapPin, Truck, CreditCard, Tag, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Address } from "@/components/account";
import type { ShippingOption } from "./ShippingMethod";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  variantInfo?: string;
}

export interface OrderSummaryProps {
  items: CartItem[];
  shippingAddress: Address;
  shippingMethod: ShippingOption;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount?: number;
  couponCode?: string;
  total: number;
  onEdit?: (step: "shipping" | "method" | "payment") => void;
}

export function OrderSummary({
  items,
  shippingAddress,
  shippingMethod,
  subtotal,
  shippingCost,
  tax,
  discount = 0,
  couponCode,
  total,
  onEdit,
}: OrderSummaryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">
          Revisar Pedido
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa todos los detalles antes de confirmar tu pedido
        </p>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Package className="h-5 w-5" />
              Productos ({items.length})
            </h3>
          </div>
        </div>
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 px-6 py-4">
              {item.productImage ? (
                <Image
                  src={item.productImage}
                  alt={item.productName}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium text-foreground">
                  {item.productName}
                </h4>
                {item.variantInfo && (
                  <p className="text-sm text-muted-foreground">{item.variantInfo}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  Cantidad: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {formatPrice(item.price)}
                </p>
                {item.quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price / item.quantity)} c/u
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <MapPin className="h-5 w-5" />
              Dirección de Envío
            </h3>
            <button
              onClick={() => onEdit?.("shipping")}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="font-medium text-foreground">
            {shippingAddress.fullName}
          </p>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>{shippingAddress.addressLine1}</p>
            {shippingAddress.addressLine2 && (
              <p>{shippingAddress.addressLine2}</p>
            )}
            <p>
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postalCode}
            </p>
            <p>{shippingAddress.country}</p>
            <p className="mt-2 font-medium">{shippingAddress.phone}</p>
          </div>
        </div>
      </div>

      {/* Shipping Method */}
      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Truck className="h-5 w-5" />
              Método de Envío
            </h3>
            <button
              onClick={() => onEdit?.("method")}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{shippingMethod.name}</p>
              <p className="text-sm text-muted-foreground">
                {shippingMethod.description}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Entrega estimada: {shippingMethod.estimatedDays}
              </p>
            </div>
            <div className="text-right">
              {shippingMethod.price === 0 ? (
                <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  Gratis
                </span>
              ) : (
                <p className="font-semibold text-foreground">
                  {formatPrice(shippingMethod.price)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <CreditCard className="h-5 w-5" />
              Método de Pago
            </h3>
            <button
              onClick={() => onEdit?.("payment")}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-accent"
            >
              <Edit2 className="h-4 w-4" />
              Editar
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Tarjeta de Crédito</p>
              <p className="text-sm text-muted-foreground">•••• •••• •••• 4242</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Tag className="h-5 w-5" />
            Detalles del Precio
          </h3>
        </div>
        <div className="space-y-3 px-6 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">
              {formatPrice(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span className="font-medium text-foreground">
              {shippingCost === 0 ? (
                <span className="text-success">Gratis</span>
              ) : (
                formatPrice(shippingCost)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA (16%)</span>
            <span className="font-medium text-foreground">{formatPrice(tax)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                Descuento
                {couponCode && (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                    {couponCode}
                  </span>
                )}
              </span>
              <span className="font-medium text-success">
                -{formatPrice(discount)}
              </span>
            </div>
          )}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-foreground">
                Total
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Al realizar este pedido, aceptas nuestros{" "}
          <a
            href="/terms"
            className="font-medium text-primary hover:text-accent"
          >
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a
            href="/privacy"
            className="font-medium text-primary hover:text-accent"
          >
            Política de Privacidad
          </a>
          . Tu información de pago se procesa de forma segura.
        </p>
      </div>
    </div>
  );
}
