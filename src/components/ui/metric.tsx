// Metric Component
// Display single metric with optional comparison

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface MetricProps {
  label: string;
  value: string | number;
  previousValue?: string | number;
  format?: "number" | "currency" | "percent";
  currency?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: {
    label: "text-xs",
    value: "text-lg",
    trend: "text-xs",
  },
  md: {
    label: "text-sm",
    value: "text-2xl",
    trend: "text-sm",
  },
  lg: {
    label: "text-base",
    value: "text-4xl",
    trend: "text-base",
  },
};

export function Metric({
  label,
  value,
  previousValue,
  format = "number",
  currency = "USD",
  trend,
  trendValue,
  size = "md",
  className,
}: MetricProps) {
  const styles = sizeStyles[size];

  const formatValue = (val: string | number): string => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
        }).format(val);
      case "percent":
        return `${val}%`;
      default:
        return new Intl.NumberFormat().format(val);
    }
  };

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-green-600 dark:text-green-400"
      : trend === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <div className={cn("space-y-1", className)}>
      <p className={cn("text-muted-foreground", styles.label)}>{label}</p>
      <p className={cn("font-bold tracking-tight", styles.value)}>
        {formatValue(value)}
      </p>
      {(trend || previousValue !== undefined) && (
        <div className={cn("flex items-center gap-2", styles.trend)}>
          {trend && (
            <span className={cn("flex items-center", trendColor)}>
              <TrendIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              {trendValue !== undefined && (
                <span>
                  {trendValue > 0 ? "+" : ""}
                  {trendValue}%
                </span>
              )}
            </span>
          )}
          {previousValue !== undefined && (
            <span className="text-muted-foreground">
              vs {formatValue(previousValue)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Metric Row for horizontal layout
export interface MetricRowProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricRow({ children, className }: MetricRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-8 flex-wrap",
        className
      )}
    >
      {children}
    </div>
  );
}

export default Metric;
