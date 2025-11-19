// Payment Form Component
// Multiple payment methods for Mexican market

"use client";

import { useState } from "react";
import {
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle2,
  Store,
  Smartphone,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaymentFormProps {
  amount: number;
  onPaymentMethodReady?: (paymentMethodId: string) => void;
  onError?: (error: string) => void;
}

export interface BillingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

type PaymentMethodType = "card" | "mercadopago" | "oxxo" | "transfer";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);

export function PaymentForm({
  amount,
  onPaymentMethodReady,
  onError,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card");
  const [saveCard, setSaveCard] = useState(false);
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "México",
  });

  // Mock card details (in production, use Stripe Elements)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const [errors, setErrors] = useState<{
    number?: string;
    expiry?: string;
    cvc?: string;
    name?: string;
  }>({});

  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, "");
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiry = (expiry: string): boolean => {
    return /^\d{2}\/\d{2}$/.test(expiry);
  };

  const validateCVC = (cvc: string): boolean => {
    return /^\d{3,4}$/.test(cvc);
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, "");
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(" ");
  };

  const formatExpiry = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardDetails({ ...cardDetails, number: formatted });
    if (errors.number) {
      setErrors({ ...errors, number: undefined });
    }
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiry(value);
    setCardDetails({ ...cardDetails, expiry: formatted });
    if (errors.expiry) {
      setErrors({ ...errors, expiry: undefined });
    }
  };

  const handleCVCChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    setCardDetails({ ...cardDetails, cvc: cleaned });
    if (errors.cvc) {
      setErrors({ ...errors, cvc: undefined });
    }
  };

  const validatePaymentForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!validateCardNumber(cardDetails.number)) {
      newErrors.number = "Número de tarjeta inválido";
    }

    if (!validateExpiry(cardDetails.expiry)) {
      newErrors.expiry = "Fecha de expiración inválida (MM/AA)";
    }

    if (!validateCVC(cardDetails.cvc)) {
      newErrors.cvc = "CVC inválido";
    }

    if (!cardDetails.name.trim()) {
      newErrors.name = "El nombre del titular es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-primary">Método de Pago</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas las transacciones son seguras y encriptadas
        </p>
      </div>

      {/* Payment Method Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setPaymentMethod("card")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 font-medium transition-all",
            paymentMethod === "card"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-background text-foreground hover:border-primary/50",
          )}
        >
          <CreditCard className="h-6 w-6" />
          <span className="text-sm">Tarjeta</span>
        </button>
        <button
          onClick={() => setPaymentMethod("mercadopago")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 font-medium transition-all",
            paymentMethod === "mercadopago"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-background text-foreground hover:border-primary/50",
          )}
        >
          <Smartphone className="h-6 w-6" />
          <span className="text-sm">Mercado Pago</span>
        </button>
        <button
          onClick={() => setPaymentMethod("oxxo")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 font-medium transition-all",
            paymentMethod === "oxxo"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-background text-foreground hover:border-primary/50",
          )}
        >
          <Store className="h-6 w-6" />
          <span className="text-sm">OXXO</span>
        </button>
        <button
          onClick={() => setPaymentMethod("transfer")}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 font-medium transition-all",
            paymentMethod === "transfer"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-background text-foreground hover:border-primary/50",
          )}
        >
          <Building2 className="h-6 w-6" />
          <span className="text-sm">Transferencia</span>
        </button>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === "card" && (
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Número de Tarjeta *
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                value={cardDetails.number}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                maxLength={19}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 pl-12 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                  errors.number ? "border-error" : "border-border",
                )}
                placeholder="1234 5678 9012 3456"
              />
              <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.number && (
              <p className="mt-1 flex items-center gap-1 text-sm text-error">
                <AlertCircle className="h-4 w-4" />
                {errors.number}
              </p>
            )}
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Nombre del Titular *
            </label>
            <input
              type="text"
              value={cardDetails.name}
              onChange={(e) => {
                setCardDetails({ ...cardDetails, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              className={cn(
                "mt-1 w-full rounded-lg border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                errors.name ? "border-error" : "border-border",
              )}
              placeholder="JUAN PÉREZ"
            />
            {errors.name && (
              <p className="mt-1 flex items-center gap-1 text-sm text-error">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Fecha de Expiración *
              </label>
              <input
                type="text"
                value={cardDetails.expiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                maxLength={5}
                className={cn(
                  "mt-1 w-full rounded-lg border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                  errors.expiry ? "border-error" : "border-border",
                )}
                placeholder="MM/AA"
              />
              {errors.expiry && (
                <p className="mt-1 flex items-center gap-1 text-sm text-error">
                  <AlertCircle className="h-4 w-4" />
                  {errors.expiry}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                CVC *
              </label>
              <input
                type="text"
                value={cardDetails.cvc}
                onChange={(e) => handleCVCChange(e.target.value)}
                maxLength={4}
                className={cn(
                  "mt-1 w-full rounded-lg border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                  errors.cvc ? "border-error" : "border-border",
                )}
                placeholder="123"
              />
              {errors.cvc && (
                <p className="mt-1 flex items-center gap-1 text-sm text-error">
                  <AlertCircle className="h-4 w-4" />
                  {errors.cvc}
                </p>
              )}
            </div>
          </div>

          {/* Save Card Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="saveCard"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="saveCard" className="text-sm text-muted-foreground">
              Guardar esta tarjeta para futuras compras
            </label>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-success" />
              <span className="text-sm text-foreground">Encriptado SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm text-foreground">PCI Compliant</span>
            </div>
          </div>
        </div>
      )}

      {/* Mercado Pago Payment */}
      {paymentMethod === "mercadopago" && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-accent/50 p-8 text-center bg-accent/5">
            <Smartphone className="mx-auto h-16 w-16 text-accent" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Pagar con Mercado Pago
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Serás redirigido a Mercado Pago para completar tu compra de forma
              segura
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Acepta: Tarjetas de crédito/débito, dinero en cuenta, Mercado
              Crédito
            </div>
            <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#009ee3] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0077b3]">
              Continuar con Mercado Pago
            </button>
          </div>
        </div>
      )}

      {/* OXXO Payment */}
      {paymentMethod === "oxxo" && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-warning/50 p-8 text-center bg-warning/5">
            <Store className="mx-auto h-16 w-16 text-warning" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Pagar en OXXO
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Recibirás un código de barras para pagar en cualquier tienda OXXO
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>• El pago se refleja en 1-3 horas hábiles</p>
              <p>• Tienes 72 horas para realizar el pago</p>
              <p>• Comisión: $15 MXN</p>
            </div>
            <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-warning px-6 py-3 font-semibold text-white transition-colors hover:bg-warning/90">
              Generar Código de Pago
            </button>
          </div>
        </div>
      )}

      {/* Bank Transfer */}
      {paymentMethod === "transfer" && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-primary/50 p-8 text-center bg-primary/5">
            <Building2 className="mx-auto h-16 w-16 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Transferencia Bancaria
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Realiza una transferencia SPEI desde tu banca en línea
            </p>
            <div className="mt-4 bg-background rounded-lg p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Banco:</span>
                  <span className="font-medium">BBVA México</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CLABE:</span>
                  <span className="font-mono font-medium">
                    0121 8000 0123 4567 89
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beneficiario:</span>
                  <span className="font-medium">SACRINT SA de CV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referencia:</span>
                  <span className="font-mono font-medium">
                    ORD-{Date.now().toString().slice(-8)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              El pago se verifica en 1-24 horas hábiles
            </div>
          </div>
        </div>
      )}

      {/* Order Total */}
      <div className="rounded-lg bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Total a pagar:
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(amount)}
          </span>
        </div>
      </div>
    </div>
  );
}
