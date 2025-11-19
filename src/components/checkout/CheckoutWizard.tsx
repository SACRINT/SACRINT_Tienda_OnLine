// Checkout Wizard Component
// Multi-step checkout flow with 4 steps

"use client";

import { useState, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";

export interface CheckoutWizardProps {
  initialStep?: number;
  onComplete?: (data: CheckoutData) => Promise<void>;
  children: React.ReactNode[];
}

export interface CheckoutData {
  shippingAddress?: any;
  shippingMethod?: any;
  paymentMethod?: any;
  orderReview?: any;
}

export interface StepConfig {
  id: string;
  title: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: "shipping",
    title: "Shipping Address",
    description: "Where should we deliver your order?",
  },
  {
    id: "method",
    title: "Shipping Method",
    description: "How fast do you need it?",
  },
  {
    id: "payment",
    title: "Payment",
    description: "How would you like to pay?",
  },
  {
    id: "review",
    title: "Review Order",
    description: "Confirm your order details",
  },
];

export function CheckoutWizard({
  initialStep = 0,
  onComplete,
  children,
}: CheckoutWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Save to localStorage on data change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
    }
  }, [checkoutData]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("checkoutData");
      if (saved) {
        try {
          setCheckoutData(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved checkout data:", e);
        }
      }
    }
  }, []);

  const updateCheckoutData = (stepData: Partial<CheckoutData>) => {
    setCheckoutData((prev) => ({ ...prev, ...stepData }));
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (stepIndex: number) => {
    if (
      stepIndex >= 0 &&
      stepIndex < STEPS.length &&
      stepIndex <= currentStep
    ) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await onComplete?.(checkoutData);
      // Clear saved data on successful completion
      if (typeof window !== "undefined") {
        localStorage.removeItem("checkoutData");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 md:mb-8 text-center">
          <div className="mb-2 md:mb-4 flex items-center justify-center gap-2 md:gap-3">
            <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Checkout
            </h1>
          </div>
          <p className="text-sm md:text-base text-gray-600">
            Complete your purchase in {STEPS.length} easy steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                {/* Step Circle */}
                <button
                  onClick={() => goToStep(index)}
                  disabled={index > currentStep}
                  className={`group relative flex items-center justify-center touch-manipulation ${
                    index <= currentStep
                      ? "cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
                      index < currentStep
                        ? "border-green-500 bg-green-500 text-white"
                        : index === currentStep
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4 md:h-6 md:w-6" />
                    ) : (
                      <span className="text-sm md:text-base font-semibold">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Step Label (visible on desktop) */}
                  <div className="absolute top-12 md:top-14 hidden w-32 flex-col items-center md:flex">
                    <p
                      className={`text-sm font-medium ${
                        index <= currentStep ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </button>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 md:h-1 flex-1 transition-all ${
                      index < currentStep ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Label (mobile) */}
        <div className="mb-6 text-center md:hidden">
          <h2 className="text-xl font-semibold text-gray-900">
            {STEPS[currentStep].title}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {STEPS[currentStep].description}
          </p>
        </div>

        {/* Step Content */}
        <div className="mb-20 md:mb-8 rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          {children[currentStep]}
        </div>

        {/* Navigation Buttons - Sticky on Mobile */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:relative bg-white md:bg-transparent border-t md:border-t-0 border-gray-200 p-4 md:p-0 shadow-lg md:shadow-none z-30">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-2">
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1 md:gap-2 rounded-lg border border-gray-300 bg-white px-3 md:px-6 py-2.5 md:py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 touch-manipulation min-h-[44px]"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm md:text-base">Back</span>
            </button>

            <div className="text-xs md:text-sm text-gray-600 font-medium">
              {currentStep + 1}/{STEPS.length}
            </div>

            {isLastStep ? (
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 md:gap-2 rounded-lg bg-green-600 px-4 md:px-8 py-2.5 md:py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 active:scale-95 touch-manipulation min-h-[44px]"
              >
                {isProcessing ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="text-sm md:text-base">Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span className="text-sm md:text-base">Place Order</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goToNextStep}
                className="inline-flex items-center gap-1 md:gap-2 rounded-lg bg-blue-600 px-4 md:px-6 py-2.5 md:py-3 font-medium text-white transition-colors hover:bg-blue-700 active:scale-95 touch-manipulation min-h-[44px]"
              >
                <span className="text-sm md:text-base">Continue</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-600">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Secure checkout · SSL encrypted</span>
        </div>
      </div>
    </div>
  );
}

// Export step configuration for use in other components
export { STEPS };
