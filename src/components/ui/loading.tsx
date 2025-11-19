"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = "md", className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-center", className)}>
        <div
          className={cn(
            spinnerSizes[size],
            "animate-spin rounded-full border-2 border-current border-t-transparent text-primary"
          )}
        />
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

interface LoadingDotsProps {
  className?: string
}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    )
  }
)
LoadingDots.displayName = "LoadingDots"

interface LoadingOverlayProps {
  message?: string
  className?: string
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ message = "Cargando...", className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
          className
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          {message && (
            <p className="text-sm font-medium text-muted-foreground">{message}</p>
          )}
        </div>
      </div>
    )
  }
)
LoadingOverlay.displayName = "LoadingOverlay"

export { LoadingSpinner, LoadingDots, LoadingOverlay }
