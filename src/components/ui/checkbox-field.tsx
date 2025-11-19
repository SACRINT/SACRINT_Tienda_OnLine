// Checkbox Field Component
// Custom checkbox with label support

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: boolean;
}

export const CheckboxField = React.forwardRef<
  HTMLInputElement,
  CheckboxFieldProps
>(({ className, label, description, error, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="flex items-start space-x-3">
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-5 w-5 rounded border border-input bg-background",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            error && "border-destructive",
            className,
          )}
        >
          <Check
            className="h-4 w-4 text-primary-foreground hidden peer-checked:block absolute top-0.5 left-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
      {(label || description) && (
        <div className="space-y-1">
          {label && (
            <label
              htmlFor={inputId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  );
});

CheckboxField.displayName = "CheckboxField";

export default CheckboxField;
