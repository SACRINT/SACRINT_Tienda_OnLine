"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStep {
  id: string;
  label: string;
  description?: string;
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
  currentStep: number;
  className?: string;
}

const CheckoutProgress = React.forwardRef<
  HTMLDivElement,
  CheckoutProgressProps
>(({ steps, currentStep, className }, ref) => {
  return (
    <div ref={ref} className={cn("w-full", className)}>
      <nav aria-label="Checkout progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <li key={step.id} className="relative flex-1">
                <div className="flex flex-col items-center">
                  {/* Connector line */}
                  {index !== 0 && (
                    <div
                      className={cn(
                        "absolute left-0 top-4 h-0.5 w-full -translate-x-1/2",
                        isCompleted || isCurrent ? "bg-primary" : "bg-muted",
                      )}
                      style={{
                        width: "calc(100% - 2rem)",
                        left: "calc(-50% + 1rem)",
                      }}
                    />
                  )}

                  {/* Step circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                      isCompleted &&
                        "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary bg-background text-primary",
                      isUpcoming &&
                        "border-muted bg-background text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                  </div>

                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent && "text-primary",
                        isUpcoming && "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                    {step.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
});
CheckoutProgress.displayName = "CheckoutProgress";

export { CheckoutProgress, type CheckoutStep };
