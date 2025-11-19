"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

interface ColorSelectorProps {
  options: ColorOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-9 w-9",
};

const checkSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const ColorSelector = React.forwardRef<HTMLDivElement, ColorSelectorProps>(
  (
    { options, value, onChange, disabled = false, size = "md", className },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn("flex flex-wrap gap-2", className)}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const isLightColor = isColorLight(option.hex);

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              title={option.name}
              onClick={() => onChange?.(option.value)}
              className={cn(
                sizeClasses[size],
                "relative rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-1"
                  : "border-transparent hover:border-muted-foreground/50",
                disabled && "cursor-not-allowed opacity-50",
              )}
              style={{ backgroundColor: option.hex }}
            >
              {isSelected && (
                <Check
                  className={cn(
                    checkSizeClasses[size],
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                    isLightColor ? "text-gray-800" : "text-white",
                  )}
                />
              )}
              <span className="sr-only">{option.name}</span>
            </button>
          );
        })}
      </div>
    );
  },
);
ColorSelector.displayName = "ColorSelector";

// Helper function to determine if a color is light
function isColorLight(hex: string): boolean {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export { ColorSelector, type ColorOption };
