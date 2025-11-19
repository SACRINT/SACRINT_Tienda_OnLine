// Number Input Component
// Custom number input with increment/decrement buttons

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { Button } from "./button";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: boolean;
  showButtons?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value = 0,
      onChange,
      min,
      max,
      step = 1,
      error,
      showButtons = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const clampValue = (val: number): number => {
      if (min !== undefined && val < min) return min;
      if (max !== undefined && val > max) return max;
      return val;
    };

    const handleIncrement = () => {
      const newValue = clampValue(value + step);
      onChange?.(newValue);
    };

    const handleDecrement = () => {
      const newValue = clampValue(value - step);
      onChange?.(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value) || 0;
      onChange?.(clampValue(newValue));
    };

    const isMinDisabled = min !== undefined && value <= min;
    const isMaxDisabled = max !== undefined && value >= max;

    return (
      <div className={cn("flex items-center", className)}>
        {showButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={disabled || isMinDisabled}
            className="rounded-r-none"
            aria-label="Decrement"
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={ref}
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            "flex h-10 w-20 border border-input bg-background px-3 py-2 text-sm text-center",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            showButtons && "border-x-0 rounded-none",
            !showButtons && "rounded-md",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          {...props}
        />
        {showButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={disabled || isMaxDisabled}
            className="rounded-l-none"
            aria-label="Increment"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
