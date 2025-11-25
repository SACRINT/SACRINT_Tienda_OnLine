"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/store/useCart";
import { env } from "@/lib/config/env";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const steps = [
  { id: "01", name: "Dirección de Envío", status: "current" },
  { id: "02", name: "Método de Envío", status: "upcoming" },
  { id: "03", name: "Método de Pago", status: "upcoming" },
  { id: "04", name: "Revisar y Confirmar", status: "upcoming" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
    return (
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              {stepIdx < currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-blue-600" />
                  </div>
                  <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-900">
                    <span className="text-white">{step.id}</span>
                  </a>
                </>
              ) : stepIdx === currentStep ? (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <a href="#" className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white" aria-current="step">
                    <span className="text-blue-600">{step.id}</span>
                  </a>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                  <a href="#" className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
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
    )
}

function ShippingMethodStep() {
    return <div><h2 className="text-lg font-medium text-gray-900">Método de Envío</h2>{/* Shipping options */}</div>
}

function PaymentMethodStep() {
    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#32325d',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a',
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
    )
}

function ReviewStep() {
    return <div><h2 className="text-lg font-medium text-gray-900">Revisar Pedido</h2>{/* Order summary */}</div>
}

function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const { items } = useCart();

  const goToNextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const goToPreviousStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setError(null);
    if (!stripe || !elements) {
      setError("Stripe.js has not loaded yet.");
      return;
    }

    try {
        const res = await fetch('/api/checkout/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cartItems: items,
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Something went wrong");
        }

        const { sessionId } = await res.json();

        const { error } = await (stripe as any).redirectToCheckout({
            sessionId,
        });

        if (error) {
            setError(error.message || "An unknown error occurred.");
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
  }

  const renderStepContent = () => {
    switch(currentStep) {
        case 0: return <ShippingAddressStep />;
        case 1: return <ShippingMethodStep />;
        case 2: return <PaymentMethodStep />;
        case 3: return <ReviewStep />;
        default: return null;
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-lg">
        <StepIndicator currentStep={currentStep} />
        <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {renderStepContent()}
        </div>

        <div className="mt-6 flex justify-between">
            <button
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className="flex items-center gap-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
                <ChevronLeft className="h-4 w-4" />
                Anterior
            </button>
            {currentStep < steps.length - 1 ? (
                <button
                    onClick={goToNextStep}
                    className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    className="flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                    Confirmar y Pagar
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