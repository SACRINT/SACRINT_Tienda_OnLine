"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface QuantitySelectorProps {
  value: number
  min?: number
  max?: number
  onChange?: (value: number) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: {
    button: "h-6 w-6",
    icon: "h-3 w-3",
    input: "h-6 w-8 text-xs",
  },
  md: {
    button: "h-8 w-8",
    icon: "h-4 w-4",
    input: "h-8 w-12 text-sm",
  },
  lg: {
    button: "h-10 w-10",
    icon: "h-5 w-5",
    input: "h-10 w-14 text-base",
  },
}

const QuantitySelector = React.forwardRef<HTMLDivElement, QuantitySelectorProps>(
  ({
    value,
    min = 1,
    max = 99,
    onChange,
    disabled = false,
    size = "md",
    className
  }, ref) => {
    const handleDecrement = () => {
      if (value > min && !disabled) {
        onChange?.(value - 1)
      }
    }

    const handleIncrement = () => {
      if (value < max && !disabled) {
        onChange?.(value + 1)
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value, 10)
      if (!isNaN(newValue) && newValue >= min && newValue <= max) {
        onChange?.(newValue)
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1 rounded-md border", className)}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(sizeClasses[size].button, "rounded-r-none")}
          onClick={handleDecrement}
          disabled={disabled || value <= min}
        >
          <Minus className={sizeClasses[size].icon} />
          <span className="sr-only">Decrease quantity</span>
        </Button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            sizeClasses[size].input,
            "border-0 bg-transparent text-center font-medium focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(sizeClasses[size].button, "rounded-l-none")}
          onClick={handleIncrement}
          disabled={disabled || value >= max}
        >
          <Plus className={sizeClasses[size].icon} />
          <span className="sr-only">Increase quantity</span>
        </Button>
      </div>
    )
  }
)
QuantitySelector.displayName = "QuantitySelector"

export { QuantitySelector }
