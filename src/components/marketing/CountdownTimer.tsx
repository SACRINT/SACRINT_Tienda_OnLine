"use client"

import * as React from "react"
import { Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  endDate: Date
  title?: string
  variant?: "default" | "compact" | "card" | "inline"
  showLabels?: boolean
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({
  endDate,
  title,
  variant = "default",
  showLabels = true,
  onComplete,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isExpired, setIsExpired] = React.useState(false)

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsExpired(true)
        onComplete?.()
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate, onComplete])

  if (isExpired) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground",
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Oferta finalizada</span>
      </div>
    )
  }

  const timeUnits = [
    { label: "Días", shortLabel: "D", value: timeLeft.days },
    { label: "Horas", shortLabel: "H", value: timeLeft.hours },
    { label: "Minutos", shortLabel: "M", value: timeLeft.minutes },
    { label: "Segundos", shortLabel: "S", value: timeLeft.seconds },
  ]

  // Compact inline variant
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1 text-sm", className)}>
        <Clock className="h-3.5 w-3.5 text-error" />
        <span className="font-mono">
          {String(timeLeft.hours).padStart(2, "0")}:
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
    )
  }

  // Inline variant for product cards
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 bg-error/10 text-error px-2 py-1 rounded text-sm",
          className
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        <span className="font-medium">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {String(timeLeft.hours).padStart(2, "0")}:
          {String(timeLeft.minutes).padStart(2, "0")}:
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
      </div>
    )
  }

  // Card variant
  if (variant === "card") {
    return (
      <div
        className={cn(
          "bg-card border rounded-lg p-4 text-center",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-error" />
            <h3 className="font-semibold">{title}</h3>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {timeUnits.map((unit) => (
            <div key={unit.label} className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">
                {String(unit.value).padStart(2, "0")}
              </div>
              {showLabels && (
                <div className="text-xs text-muted-foreground mt-1">
                  {unit.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-error" />
          <span className="text-sm font-medium">{title}</span>
        </div>
      )}
      <div className="flex gap-2">
        {timeUnits.map((unit) => (
          <div
            key={unit.label}
            className="bg-primary text-primary-foreground rounded px-3 py-2 text-center min-w-[60px]"
          >
            <div className="text-xl font-bold">
              {String(unit.value).padStart(2, "0")}
            </div>
            {showLabels && (
              <div className="text-xs opacity-80">{unit.label}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility hook for countdown logic
export function useCountdown(endDate: Date) {
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSeconds: 0,
  })

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalSeconds: 0,
        })
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
        totalSeconds: Math.floor(difference / 1000),
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return timeLeft
}
