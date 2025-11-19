// Dashboard Stats Component
// Overview statistics for admin dashboard

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from "lucide-react";
import { StatCard, StatGrid } from "@/components/ui/stat-card";

export interface DashboardStat {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  format?: "currency" | "number" | "percent";
}

export interface DashboardStatsProps {
  stats?: DashboardStat[];
  loading?: boolean;
  currency?: string;
  className?: string;
}

const defaultStats: DashboardStat[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: 45231.89,
    change: 12.5,
    changeLabel: "from last month",
    icon: DollarSign,
    format: "currency",
  },
  {
    id: "orders",
    label: "Orders",
    value: 356,
    change: 8.2,
    changeLabel: "from last month",
    icon: ShoppingCart,
    format: "number",
  },
  {
    id: "products",
    label: "Products Sold",
    value: 1205,
    change: -3.1,
    changeLabel: "from last month",
    icon: Package,
    format: "number",
  },
  {
    id: "customers",
    label: "Active Customers",
    value: 2847,
    change: 15.3,
    changeLabel: "from last month",
    icon: Users,
    format: "number",
  },
];

export function DashboardStats({
  stats = defaultStats,
  loading,
  currency = "USD",
  className,
}: DashboardStatsProps) {
  const formatValue = (value: string | number, format?: string): string => {
    if (typeof value === "string") return value;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
        }).format(value);
      case "percent":
        return `${value}%`;
      default:
        return new Intl.NumberFormat().format(value);
    }
  };

  return (
    <StatGrid columns={4} className={className}>
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          title={stat.label}
          value={formatValue(stat.value, stat.format)}
          icon={stat.icon}
          trend={
            stat.change !== undefined
              ? {
                  value: Math.abs(stat.change),
                  direction:
                    stat.change > 0
                      ? "up"
                      : stat.change < 0
                        ? "down"
                        : "neutral",
                  label: stat.changeLabel,
                }
              : undefined
          }
          loading={loading}
        />
      ))}
    </StatGrid>
  );
}

// Mini stat for inline display
export interface MiniStatProps {
  label: string;
  value: string | number;
  change?: number;
  className?: string;
}

export function MiniStat({ label, value, change, className }: MiniStatProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {change !== undefined && (
          <span
            className={cn(
              "flex items-center text-xs",
              change > 0
                ? "text-green-600"
                : change < 0
                  ? "text-red-600"
                  : "text-muted-foreground",
            )}
          >
            {change > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : change < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default DashboardStats;
