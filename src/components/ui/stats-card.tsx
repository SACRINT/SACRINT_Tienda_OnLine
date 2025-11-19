"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  className?: string;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, description, icon, trend, className }, ref) => {
    const TrendIcon = trend
      ? trend.value > 0
        ? TrendingUp
        : trend.value < 0
          ? TrendingDown
          : Minus
      : null;

    return (
      <Card ref={ref} className={cn("", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {icon && (
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                {icon}
              </div>
            )}
          </div>
          {trend && TrendIcon && (
            <div className="mt-4 flex items-center gap-1">
              <TrendIcon
                className={cn(
                  "h-4 w-4",
                  (trend.isPositive ?? trend.value > 0)
                    ? "text-success"
                    : trend.value < 0
                      ? "text-error"
                      : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  (trend.isPositive ?? trend.value > 0)
                    ? "text-success"
                    : trend.value < 0
                      ? "text-error"
                      : "text-muted-foreground",
                )}
              >
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs mes anterior
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);
StatsCard.displayName = "StatsCard";

export { StatsCard };
