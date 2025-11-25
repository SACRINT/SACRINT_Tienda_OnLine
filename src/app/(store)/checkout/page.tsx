"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  XCircle,
  MapPin,
  Truck,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/store/useCart";
import { env } from "@/lib/config/env";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateAddressSchema } from "@/lib/security/schemas/order-schemas";
import type { CreateAddressInput } from "@/lib/security/schemas/order-schemas";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const steps = [
  { id: "01", name: "Dirección de Envío", status: "current" },
  { id: "02", name: "Método de Envío", status: "upcoming" },
  { id: "03", name: "Método de Pago", status: "upcoming" },
  { id: "04", name: "Revisar y Confirmar", status: "upcoming" },
];

// Error messages mapping
const ERROR_MESSAGES: Record<string, string> = {
  card_declined: "La tarjeta fue rechazada. Por favor intenta con otra tarjeta.",
  insufficient_funds: "Fondos insuficientes. Por favor intenta con otra tarjeta.",
  expired_card: "Tu tarjeta ha expirado. Por favor usa una tarjeta válida.",
  incorrect_cvc:
    "El código de seguridad (CVC) es incorrecto. Por favor verifica e intenta de nuevo.",
  processing_error: "Hubo un error procesando el pago. Por favor intenta de nuevo.",
  rate_limit: "Demasiados intentos. Por favor espera unos minutos e intenta de nuevo.",
  out_of_stock: "Uno de los productos ya no está disponible. Por favor actualiza tu carrito.",
  invalid_address: "La dirección de envío no es válida. Por favor verifica los datos.",
  shipping_unavailable: "El envío a esa región no está disponible actualmente.",
  amount_mismatch:
    "Hubo un problema con el monto del pago. Por favor recarga la página e intenta de nuevo.",
};

// Component for displaying errors
function ErrorAlert({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        Error
        <button onClick={onDismiss} className="ml-2">
          <XCircle className="h-4 w-4" />
        </button>
      </AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={`relative ${stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : ""}`}
          >
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-blue-600" />
                </div>
                <a
                  href="#"
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-900"
                >
                  <span className="text-white">{step.id}</span>
                </a>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <a
                  href="#"
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white"
                  aria-current="step"
                >
                  <span className="text-blue-600">{step.id}</span>
                </a>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <a
                  href="#"
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400"
                >
                  <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface ShippingAddressStepProps {
  onAddressChange: (data: CreateAddressInput) => void;
  initialData?: CreateAddressInput;
}

function ShippingAddressStep({ onAddressChange, initialData }: ShippingAddressStepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<CreateAddressInput>({
    resolver: zodResolver(CreateAddressSchema) as any,
    defaultValues: initialData || ({ country: "MX" } as CreateAddressInput),
    mode: "onChange",
  });

  // Watch all form fields and update parent on change
  const formData = watch();

  // Update parent whenever form data changes
  React.useEffect(() => {
    const validateAndUpdate = async () => {
      try {
        const validated = await CreateAddressSchema.parseAsync(formData);
        onAddressChange(validated);
      } catch {
        // Validation failed, don't update parent
      }
    };
    validateAndUpdate();
  }, [formData, onAddressChange]);

  return (
    <div className="space-y-6">
      {/* Contact Information Section */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-blue-600" />
          Información de Contacto
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Full Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input
              {...register("name")}
              type="text"
              placeholder="Juan Pérez García"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="juan@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="+1 (555) 123-4567"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      {/* Shipping Address Section */}
      <div className="border-t pt-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-blue-600" />
          Dirección de Envío
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {/* Street Address */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Calle y Número</label>
            <input
              {...register("street")}
              type="text"
              placeholder="Avenida Principal 123, Apt 4B"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>}
          </div>

          {/* City, State, Postal Code Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ciudad</label>
              <input
                {...register("city")}
                type="text"
                placeholder="México"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado/Región</label>
              <input
                {...register("state")}
                type="text"
                placeholder="CDMX"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Código Postal</label>
              <input
                {...register("postalCode")}
                type="text"
                placeholder="06500"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Country (Hidden - Default to Mexico) */}
      <input {...register("country")} type="hidden" value="MX" />
    </div>
  );
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  cost: number;
  deliveryDays: string;
}

interface ShippingMethodStepProps {
  onMethodChange: (method: ShippingMethod) => void;
  selectedMethod?: ShippingMethod;
}

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Envío Estándar",
    description: "Entrega en 5-7 días hábiles",
    cost: 4.99,
    deliveryDays: "5-7 días",
  },
  {
    id: "express",
    name: "Envío Express",
    description: "Entrega en 2-3 días hábiles",
    cost: 12.99,
    deliveryDays: "2-3 días",
  },
  {
    id: "overnight",
    name: "Envío Nocturno",
    description: "Entrega al día siguiente",
    cost: 29.99,
    deliveryDays: "1 día",
  },
];

function ShippingMethodStep({ onMethodChange, selectedMethod }: ShippingMethodStepProps) {
  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center gap-2">
        <Truck className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-medium text-gray-900">Método de Envío</h2>
      </div>

      <div className="space-y-3">
        {SHIPPING_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all ${
              selectedMethod?.id === method.id
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="shippingMethod"
              value={method.id}
              checked={selectedMethod?.id === method.id}
              onChange={() => onMethodChange(method)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{method.name}</p>
                <p className="text-lg font-bold text-blue-600">${method.cost.toFixed(2)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-500">{method.description}</p>
              <p className="mt-1 text-xs text-gray-400">Tiempo estimado: {method.deliveryDays}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Nota:</span> El costo de envío se añadirá al total de tu
          pedido. Verifica los costos finales en el paso de revisión.
        </p>
      </div>
    </div>
  );
}

function PaymentMethodStep() {
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#32325d",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Método de Pago</h2>
      <div className="mt-4">
        <CardElement options={cardElementOptions} />
      </div>
    </div>
  );
}

interface ReviewStepProps {
  address?: CreateAddressInput;
  shippingMethod?: ShippingMethod;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

function ReviewStep({
  address,
  shippingMethod,
  subtotal,
  shippingCost,
  tax,
  total,
}: ReviewStepProps) {
  const { items } = useCart();

  return (
    <div className="space-y-6">
      {/* Order Items Summary */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
          <Check className="h-5 w-5 text-green-600" />
          Resumen de Productos
        </h3>

        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-900">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address Summary */}
      {address && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <MapPin className="h-5 w-5 text-blue-600" />
            Dirección de Envío
          </h3>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="font-medium text-gray-900">{address.name}</p>
            <p className="mt-1 text-sm text-gray-700">{address.street}</p>
            <p className="text-sm text-gray-700">
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Correo: <span className="font-medium">{address.email}</span>
            </p>
            <p className="text-sm text-gray-600">
              Teléfono: <span className="font-medium">{address.phone}</span>
            </p>
          </div>
        </div>
      )}

      {/* Shipping Method Summary */}
      {shippingMethod && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
            <Truck className="h-5 w-5 text-blue-600" />
            Método de Envío
          </h3>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{shippingMethod.name}</p>
                <p className="mt-1 text-sm text-gray-600">{shippingMethod.description}</p>
              </div>
              <p className="text-lg font-bold text-blue-600">${shippingMethod.cost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Total Summary */}
      <div className="border-t pt-4">
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between text-gray-700">
            <p>Subtotal</p>
            <p>${subtotal.toFixed(2)}</p>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <p>Impuestos (16%)</p>
            <p>${tax.toFixed(2)}</p>
          </div>

          <div className="flex items-center justify-between text-gray-700">
            <p>Envío</p>
            <p>${shippingCost.toFixed(2)}</p>
          </div>

          <div className="flex items-center justify-between border-t border-blue-300 pt-3">
            <p className="text-lg font-bold text-gray-900">Total</p>
            <p className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-gray-700">
          ✓ He revisado mi orden y confirmo que los datos son correctos.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Al hacer clic en &quot;Confirmar y Pagar&quot;, aceptas nuestros términos y condiciones.
        </p>
      </div>
    </div>
  );
}

function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<CreateAddressInput | undefined>();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | undefined>();

  const stripe = useStripe();
  const elements = useElements();
  const { items } = useCart();

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.16; // 16% tax
  const shippingCost = shippingMethod?.cost ?? 0;
  const total = subtotal + tax + shippingCost;

  // Validate stock availability
  const validateStock = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/products/validate-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(ERROR_MESSAGES.out_of_stock);
        return false;
      }

      return true;
    } catch (err) {
      setError("No pudimos verificar la disponibilidad de stock. Por favor intenta de nuevo.");
      return false;
    }
  };

  const goToNextStep = async () => {
    setError(null);

    // Validate before moving to next step
    if (currentStep === 0) {
      // Validate shipping address is filled
      if (!shippingAddress) {
        setError("Por favor completa los datos de dirección de envío");
        return;
      }
    } else if (currentStep === 1) {
      // Validate shipping method is selected
      if (!shippingMethod) {
        setError("Por favor selecciona un método de envío");
        return;
      }
    } else if (currentStep === 2) {
      // Validate stock before final review
      const stockValid = await validateStock();
      if (!stockValid) return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goToPreviousStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsProcessing(true);

    if (!stripe || !elements) {
      setError("El sistema de pagos no está disponible. Por favor recarga la página.");
      setIsProcessing(false);
      return;
    }

    // Validate cart is not empty
    if (items.length === 0) {
      setError("Tu carrito está vacío. Agrega productos antes de proceder.");
      setIsProcessing(false);
      return;
    }

    // Final stock validation
    const stockValid = await validateStock();
    if (!stockValid) {
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems: items }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error types
        if (res.status === 400) {
          if (data.error?.includes("stock")) {
            setError(ERROR_MESSAGES.out_of_stock);
          } else if (data.error?.includes("address")) {
            setError(ERROR_MESSAGES.invalid_address);
          } else if (data.error?.includes("shipping")) {
            setError(ERROR_MESSAGES.shipping_unavailable);
          } else {
            setError(
              data.error ||
                "Hubo un error con tu pedido. Por favor verifica los datos e intenta de nuevo.",
            );
          }
        } else if (res.status === 429) {
          setError(ERROR_MESSAGES.rate_limit);
        } else {
          setError("Hubo un error procesando tu pedido. Por favor intenta de nuevo más tarde.");
        }
        setIsProcessing(false);
        return;
      }

      const { sessionId } = data;

      const { error: redirectError } = await (stripe as any).redirectToCheckout({ sessionId });

      if (redirectError) {
        // Map Stripe error codes to friendly messages
        const errorCode = (redirectError as any).code;
        setError(
          ERROR_MESSAGES[errorCode] ||
            redirectError.message ||
            "Hubo un error con el pago. Por favor intenta de nuevo.",
        );
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Hubo un error inesperado. Por favor intenta de nuevo o contacta a soporte.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ShippingAddressStep onAddressChange={setShippingAddress} initialData={shippingAddress} />
        );
      case 1:
        return (
          <ShippingMethodStep onMethodChange={setShippingMethod} selectedMethod={shippingMethod} />
        );
      case 2:
        return <PaymentMethodStep />;
      case 3:
        return (
          <ReviewStep
            address={shippingAddress}
            shippingMethod={shippingMethod}
            subtotal={subtotal}
            shippingCost={shippingCost}
            tax={tax}
            total={total}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-lg">
      <StepIndicator currentStep={currentStep} />

      {/* Error Alert */}
      {error && (
        <div className="mt-6">
          <ErrorAlert error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {renderStepContent()}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={goToPreviousStep}
          disabled={currentStep === 0 || isProcessing}
          className="flex items-center gap-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        {currentStep < steps.length - 1 ? (
          <button
            onClick={goToNextStep}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Validando...
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Procesando...
              </>
            ) : (
              "Confirmar y Pagar"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8">
        <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Checkout
        </h1>
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </main>
    </div>
  );
}
