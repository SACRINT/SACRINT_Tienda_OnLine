"use client";

import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  Metric,
} from "@/lib/analytics/types";

interface StatCardProps {
  title: string;
  metric: Metric;
  icon?: LucideIcon;
  formatType?: "currency" | "number" | "percentage";
  description?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  metric,
  icon: Icon,
  formatType = "number",
  description,
  loading = false,
}: StatCardProps) {
  const formatValue = (value: number) => {
    switch (formatType) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return `${value.toFixed(2)}%`;
      default:
        return formatNumber(value);
    }
  };

  const TrendIcon =
    metric.trend === "up"
      ? TrendingUp
      : metric.trend === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    metric.trend === "up"
      ? "text-green-600 bg-green-50"
      : metric.trend === "down"
        ? "text-red-600 bg-red-50"
        : "text-gray-600 bg-gray-50";

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {Icon && (
          <div className="rounded-lg bg-blue-50 p-2">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-gray-900">
          {formatValue(metric.value)}
        </p>
      </div>

      {/* Trend and Comparison */}
      <div className="flex items-center gap-2">
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${trendColor}`}
        >
          <TrendIcon className="h-3 w-3" />
          <span className="text-xs font-semibold">
            {formatPercentage(Math.abs(metric.change))}
          </span>
        </div>
        <p className="text-xs text-gray-600">
          vs {formatValue(metric.previousValue)}
        </p>
      </div>

      {/* Optional Description */}
      {description && (
        <p className="mt-3 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Skeleton loader para stat cards
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
