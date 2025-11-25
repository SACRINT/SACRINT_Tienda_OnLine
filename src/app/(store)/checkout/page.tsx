"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, AlertCircle, XCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/store/useCart";
import { env } from "@/lib/config/env";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

function ShippingAddressStep() {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Información de Contacto</h2>
      {/* Form fields for contact info */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Dirección de Envío</h2>
      {/* Form fields for shipping address */}
    </div>
  );
}

function ShippingMethodStep() {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Método de Envío</h2>
      {/* Shipping options */}
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

function ReviewStep() {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Revisar Pedido</h2>
      {/* Order summary */}
    </div>
  );
}

function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { items } = useCart();

  // Validate stock availability
  const validateStock = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/products/validate-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
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
      // TODO: Validate shipping address when form is implemented
      // For now, just proceed
    } else if (currentStep === 1) {
      // TODO: Validate shipping method when implemented
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
        return <ShippingAddressStep />;
      case 1:
        return <ShippingMethodStep />;
      case 2:
        return <PaymentMethodStep />;
      case 3:
        return <ReviewStep />;
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
