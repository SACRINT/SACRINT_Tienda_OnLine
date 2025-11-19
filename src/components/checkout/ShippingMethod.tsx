// Shipping Method Component
// Select shipping speed and cost

"use client";

import { Check, Truck, Clock, Zap, Package, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  carrier?: string;
  price: number;
  estimatedDays: string;
  icon: "truck" | "clock" | "zap" | "standard" | "express" | "same-day";
}

export interface ShippingMethodProps {
  options: ShippingOption[];
  selectedMethodId?: string;
  onMethodSelect: (method: ShippingOption) => void;
  subtotal?: number;
  freeShippingThreshold?: number;
}

const ICON_MAP = {
  truck: Truck,
  clock: Clock,
  zap: Zap,
  standard: Package,
  express: Truck,
  "same-day": Zap,
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);

export function ShippingMethod({
  options,
  selectedMethodId,
  onMethodSelect,
  subtotal = 0,
  freeShippingThreshold = 999,
}: ShippingMethodProps) {
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">
          Método de Envío
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona cómo deseas recibir tu pedido
        </p>
      </div>

      {/* Free Shipping Banner */}
      {qualifiesForFreeShipping ? (
        <div className="p-3 bg-success/10 rounded-lg flex items-center gap-2">
          <Truck className="h-5 w-5 text-success" />
          <span className="text-sm font-medium text-success">
            ¡Envío gratis disponible en tu compra!
          </span>
        </div>
      ) : (
        <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Agrega {formatPrice(freeShippingThreshold - subtotal)} más para envío gratis
          </span>
        </div>
      )}

      {/* Shipping Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const Icon = ICON_MAP[option.icon] || Package;
          const isSelected = selectedMethodId === option.id;
          const isFree = option.price === 0 || (qualifiesForFreeShipping && option.id === "standard");
          const finalPrice = isFree ? 0 : option.price;

          return (
            <button
              key={option.id}
              onClick={() => onMethodSelect(option)}
              className={cn(
                "relative w-full rounded-lg border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/50 hover:shadow-soft"
              )}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute right-4 top-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {option.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {option.description}
                      </p>
                      {option.carrier && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {option.carrier}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-medium text-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {option.estimatedDays}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex-shrink-0 text-right">
                  {isFree ? (
                    <div>
                      {option.price > 0 && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {formatPrice(option.price)}
                        </span>
                      )}
                      <span className="rounded-full bg-success/10 text-success px-3 py-1 text-sm font-semibold">
                        Gratis
                      </span>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(finalPrice)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-accent/10 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-foreground">
              Información de Envío
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Envío gratis en pedidos mayores a {formatPrice(freeShippingThreshold)}</li>
              <li>• Los tiempos de entrega son estimados</li>
              <li>• Recibirás un número de rastreo para seguir tu pedido</li>
              <li>• Envíos a toda la República Mexicana</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Default shipping options (can be customized per order)
export const DEFAULT_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    name: "Envío Estándar",
    description: "Entrega regular al mejor precio",
    carrier: "Estafeta",
    price: 99,
    estimatedDays: "3-5 días hábiles",
    icon: "standard",
  },
  {
    id: "express",
    name: "Envío Express",
    description: "Entrega rápida para cuando lo necesitas pronto",
    carrier: "FedEx",
    price: 199,
    estimatedDays: "1-2 días hábiles",
    icon: "express",
  },
  {
    id: "same-day",
    name: "Mismo Día",
    description: "Entrega el mismo día (CDMX y área metropolitana)",
    carrier: "99 Minutos",
    price: 299,
    estimatedDays: "Hoy antes de 6pm",
    icon: "same-day",
  },
];
