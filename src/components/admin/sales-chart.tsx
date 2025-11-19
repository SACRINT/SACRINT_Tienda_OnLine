// Sales Chart Component
// Revenue/sales chart for dashboard

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

export interface SalesChartProps {
  data: ChartDataPoint[];
  title?: string;
  type?: "bar" | "line" | "area";
  currency?: string;
  showComparison?: boolean;
  loading?: boolean;
  className?: string;
}

export function SalesChart({
  data,
  title = "Sales Overview",
  type = "bar",
  currency = "USD",
  showComparison = false,
  loading,
  className,
}: SalesChartProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
    }).format(value);
  };

  const maxValue = Math.max(
    ...data.map((d) => d.value),
    ...data.map((d) => d.previousValue || 0),
  );
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const previousTotal = data.reduce(
    (sum, d) => sum + (d.previousValue || 0),
    0,
  );
  const changePercent =
    previousTotal > 0
      ? ((totalValue - previousTotal) / previousTotal) * 100
      : 0;

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">
              {formatValue(totalValue)}
            </span>
            {showComparison && (
              <span
                className={cn(
                  "text-sm",
                  changePercent >= 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        {showComparison && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span>Previous</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : type === "bar" ? (
        <div className="h-64 flex items-end gap-2">
          {data.map((point, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="w-full flex items-end justify-center gap-1 h-48">
                {showComparison && point.previousValue && (
                  <div
                    className="w-3 bg-muted-foreground/30 rounded-t"
                    style={{
                      height: `${(point.previousValue / maxValue) * 100}%`,
                    }}
                  />
                )}
                <div
                  className="w-full max-w-8 bg-primary rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(point.value / maxValue) * 100}%`,
                  }}
                  title={formatValue(point.value)}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      ) : type === "line" || type === "area" ? (
        <div className="h-64 relative">
          <svg
            viewBox={`0 0 ${data.length * 50} 200`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={200 - y * 2}
                x2={data.length * 50}
                y2={200 - y * 2}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
            ))}

            {/* Area fill */}
            {type === "area" && (
              <path
                d={`
                  M 0 200
                  ${data
                    .map(
                      (point, i) =>
                        `L ${i * 50 + 25} ${200 - (point.value / maxValue) * 180}`,
                    )
                    .join(" ")}
                  L ${(data.length - 1) * 50 + 25} 200
                  Z
                `}
                fill="currentColor"
                className="text-primary/20"
              />
            )}

            {/* Previous period line */}
            {showComparison && (
              <polyline
                points={data
                  .map(
                    (point, i) =>
                      `${i * 50 + 25},${
                        200 - ((point.previousValue || 0) / maxValue) * 180
                      }`,
                  )
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="text-muted-foreground/50"
              />
            )}

            {/* Current period line */}
            <polyline
              points={data
                .map(
                  (point, i) =>
                    `${i * 50 + 25},${200 - (point.value / maxValue) * 180}`,
                )
                .join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            />

            {/* Data points */}
            {data.map((point, i) => (
              <circle
                key={i}
                cx={i * 50 + 25}
                cy={200 - (point.value / maxValue) * 180}
                r="4"
                fill="currentColor"
                className="text-primary"
              />
            ))}
          </svg>

          {/* Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
            {data.map((point, index) => (
              <span key={index} className="text-xs text-muted-foreground">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SalesChart;
