"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SizeOption {
  label: string
  value: string
  available?: boolean
}

interface SizeSelectorProps {
  options: SizeOption[]
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

const SizeSelector = React.forwardRef<HTMLDivElement, SizeSelectorProps>(
  ({
    options,
    value,
    onChange,
    disabled = false,
    className
  }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-wrap gap-2", className)}>
        {options.map((option) => {
          const isSelected = value === option.value
          const isAvailable = option.available !== false

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled || !isAvailable}
              onClick={() => isAvailable && onChange?.(option.value)}
              className={cn(
                "relative min-w-[40px] rounded-md border px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : isAvailable
                    ? "border-input bg-background text-foreground hover:border-primary hover:bg-primary/5"
                    : "border-muted bg-muted/50 text-muted-foreground line-through cursor-not-allowed",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }
)
SizeSelector.displayName = "SizeSelector"

export { SizeSelector, type SizeOption }
