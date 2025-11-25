/**
 * KPI Cards Component
 * Semana 9.2: Dashboard Home Page
 *
 * Tarjetas de KPIs principales para el dashboard
 */

"use client";

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  metrics: {
    revenue: {
      total: number;
      growth: number;
    };
    orders: {
      total: number;
      pending: number;
      growth: number;
    };
    customers: {
      new: number;
      growth: number;
    };
    conversion: {
      rate: number;
    };
  };
}

export function KPICards({ metrics }: KPICardsProps) {
  const cards = [
    {
      title: "Ventas Totales",
      value: `$${metrics.revenue.total.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: metrics.revenue.growth,
      icon: DollarSign,
      color: "blue",
    },
    {
      title: "Órdenes",
      value: metrics.orders.total.toString(),
      subtitle: `${metrics.orders.pending} pendientes`,
      change: metrics.orders.growth,
      icon: ShoppingCart,
      color: "green",
    },
    {
      title: "Nuevos Clientes",
      value: metrics.customers.new.toString(),
      change: metrics.customers.growth,
      icon: Users,
      color: "purple",
    },
    {
      title: "Tasa de Conversión",
      value: `${metrics.conversion.rate.toFixed(1)}%`,
      icon: Percent,
      color: "orange",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <KPICard key={index} {...card} />
      ))}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange";
}

function KPICard({ title, value, subtitle, change, icon: Icon, color }: KPICardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  const hasChange = change !== undefined;
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      {/* Change indicator */}
      {hasChange && (
        <div className="flex items-center gap-1">
          {isPositive && (
            <>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">+{change.toFixed(1)}%</span>
            </>
          )}
          {isNegative && (
            <>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">{change.toFixed(1)}%</span>
            </>
          )}
          {!isPositive && !isNegative && (
            <span className="text-sm font-medium text-gray-500">Sin cambios</span>
          )}
          <span className="text-xs text-gray-500 ml-1">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
