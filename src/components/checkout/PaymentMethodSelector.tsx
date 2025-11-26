"use client";

/**
 * Payment Method Selector Component
 * Task 14.9: Payment Method Selector
 *
 * Permite al usuario elegir entre Stripe y Mercado Pago
 * y configurar opciones específicas de cada método
 */

import { useState } from "react";
import { CreditCard, DollarSign, Banknote, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export type PaymentProvider = "stripe" | "mercado_pago";
export type PaymentMethod = "card" | "bank_transfer" | "cash" | "wallet";

interface PaymentMethodSelectorProps {
  onProviderChange: (provider: PaymentProvider) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onInstallmentsChange?: (installments: number) => void;
  selectedProvider?: PaymentProvider;
  selectedMethod?: PaymentMethod;
  installments?: number;
  amount: number;
  currency?: string;
  country?: string;
  showInstallments?: boolean;
  className?: string;
}

export function PaymentMethodSelector({
  onProviderChange,
  onMethodChange,
  onInstallmentsChange,
  selectedProvider = "stripe",
  selectedMethod = "card",
  installments = 1,
  amount,
  currency = "USD",
  country = "US",
  showInstallments = true,
  className,
}: PaymentMethodSelectorProps) {
  const [provider, setProvider] = useState<PaymentProvider>(selectedProvider);
  const [method, setMethod] = useState<PaymentMethod>(selectedMethod);
  const [selectedInstallments, setSelectedInstallments] = useState(installments);

  // Determinar qué métodos están disponibles según el proveedor
  const availableMethods = getAvailableMethods(provider, country);

  // Calcular cuotas disponibles (solo para Mercado Pago en LATAM)
  const maxInstallments = provider === "mercado_pago" ? 12 : 1;
  const installmentOptions = Array.from({ length: maxInstallments }, (_, i) => i + 1);

  const handleProviderChange = (newProvider: PaymentProvider) => {
    setProvider(newProvider);
    onProviderChange(newProvider);

    // Si el método actual no está disponible en el nuevo proveedor, cambiar al primero disponible
    const methods = getAvailableMethods(newProvider, country);
    if (!methods.includes(method)) {
      const newMethod = methods[0] || "card";
      setMethod(newMethod);
      onMethodChange(newMethod);
    }
  };

  const handleMethodChange = (newMethod: PaymentMethod) => {
    setMethod(newMethod);
    onMethodChange(newMethod);
  };

  const handleInstallmentsChange = (value: string) => {
    const num = parseInt(value);
    setSelectedInstallments(num);
    onInstallmentsChange?.(num);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Provider Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Payment Provider</Label>
        <RadioGroup
          value={provider}
          onValueChange={(value) => handleProviderChange(value as PaymentProvider)}
          className="grid grid-cols-2 gap-4"
        >
          {/* Stripe Option */}
          <Card
            className={cn(
              "cursor-pointer transition-all",
              provider === "stripe"
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "hover:border-gray-400"
            )}
            onClick={() => handleProviderChange("stripe")}
          >
            <CardContent className="flex items-center space-x-4 p-4">
              <RadioGroupItem value="stripe" id="stripe" className="shrink-0" />
              <Label
                htmlFor="stripe"
                className="flex items-center space-x-3 cursor-pointer flex-1"
              >
                <CreditCard className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-medium">Stripe</div>
                  <div className="text-xs text-muted-foreground">
                    Credit/Debit Cards
                  </div>
                </div>
              </Label>
            </CardContent>
          </Card>

          {/* Mercado Pago Option */}
          <Card
            className={cn(
              "cursor-pointer transition-all",
              provider === "mercado_pago"
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "hover:border-gray-400"
            )}
            onClick={() => handleProviderChange("mercado_pago")}
          >
            <CardContent className="flex items-center space-x-4 p-4">
              <RadioGroupItem value="mercado_pago" id="mercado_pago" className="shrink-0" />
              <Label
                htmlFor="mercado_pago"
                className="flex items-center space-x-3 cursor-pointer flex-1"
              >
                <DollarSign className="h-6 w-6 text-cyan-600" />
                <div>
                  <div className="font-medium">Mercado Pago</div>
                  <div className="text-xs text-muted-foreground">
                    LATAM Payments
                  </div>
                </div>
              </Label>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Payment Method</Label>
        <div className="grid grid-cols-2 gap-3">
          {availableMethods.map((methodOption) => (
            <Card
              key={methodOption}
              className={cn(
                "cursor-pointer transition-all",
                method === methodOption
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "hover:border-gray-400"
              )}
              onClick={() => handleMethodChange(methodOption)}
            >
              <CardContent className="flex items-center space-x-3 p-4">
                {getMethodIcon(methodOption)}
                <div className="text-sm font-medium">
                  {getMethodLabel(methodOption)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Installments (only for Mercado Pago with card) */}
      {provider === "mercado_pago" &&
        method === "card" &&
        showInstallments &&
        maxInstallments > 1 && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Installments</Label>
            <Select
              value={selectedInstallments.toString()}
              onValueChange={handleInstallmentsChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {installmentOptions.map((num) => {
                  const installmentAmount = amount / num;
                  return (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x {currency} {installmentAmount.toFixed(2)}
                      {num === 1 ? " (no interest)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Total: {currency} {amount.toFixed(2)}
            </p>
          </div>
        )}

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 mt-0.5">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-sm text-blue-900">
              {provider === "stripe" && (
                <>
                  <strong>Stripe:</strong> Secure payments with international cards.
                  Supports Visa, Mastercard, American Express, and more.
                </>
              )}
              {provider === "mercado_pago" && (
                <>
                  <strong>Mercado Pago:</strong> Popular payment method in Latin
                  America. Supports local cards, bank transfers, and cash payments.
                  {method === "card" && " Pay in installments with no extra fees."}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAvailableMethods(
  provider: PaymentProvider,
  country: string
): PaymentMethod[] {
  if (provider === "stripe") {
    return ["card"];
  }

  // Mercado Pago - métodos disponibles según país
  const latamCountries = ["AR", "BR", "CL", "CO", "MX", "PE", "UY"];

  if (latamCountries.includes(country)) {
    return ["card", "bank_transfer", "cash"];
  }

  return ["card"];
}

function getMethodIcon(method: PaymentMethod) {
  const icons = {
    card: <CreditCard className="h-5 w-5 text-blue-600" />,
    bank_transfer: <Building2 className="h-5 w-5 text-green-600" />,
    cash: <Banknote className="h-5 w-5 text-orange-600" />,
    wallet: <DollarSign className="h-5 w-5 text-purple-600" />,
  };

  return icons[method];
}

function getMethodLabel(method: PaymentMethod): string {
  const labels = {
    card: "Credit/Debit Card",
    bank_transfer: "Bank Transfer",
    cash: "Cash Payment",
    wallet: "Digital Wallet",
  };

  return labels[method];
}
