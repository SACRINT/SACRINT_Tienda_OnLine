// Checkout Steps Component
// Multi-step checkout wizard

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckoutStep {
  id: string;
  label: string;
  description?: string;
}

export interface CheckoutStepsProps {
  steps: CheckoutStep[];
  currentStep: string;
  completedSteps: Set<string>;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function CheckoutSteps({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: CheckoutStepsProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Checkout progress" className={className}>
      {/* Desktop view */}
      <ol className="hidden sm:flex items-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isClickable = isCompleted || index <= currentIndex;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", index !== 0 && "flex-1")}
            >
              {index !== 0 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    index <= currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}

              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable || !onStepClick}
                className={cn(
                  "flex items-center gap-2 group",
                  isClickable && onStepClick && "cursor-pointer"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border-2 border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile view */}
      <div className="sm:hidden">
        <p className="text-sm text-muted-foreground">
          Step {currentIndex + 1} of {steps.length}
        </p>
        <p className="font-medium">{steps[currentIndex]?.label}</p>
      </div>
    </nav>
  );
}

// Checkout step container
export interface CheckoutStepContentProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function CheckoutStepContent({
  children,
  title,
  description,
  className,
}: CheckoutStepContentProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default CheckoutSteps;
