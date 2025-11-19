"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, ShoppingCart, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealTimeStat {
  id: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: "up" | "down" | "stable";
}

interface RealTimeStatsProps {
  className?: string;
}

export function RealTimeStats({ className }: RealTimeStatsProps) {
  const [stats, setStats] = React.useState<RealTimeStat[]>([
    {
      id: "visitors",
      label: "Visitantes Activos",
      value: 127,
      icon: Users,
      color: "text-primary",
      trend: "up",
    },
    {
      id: "viewing",
      label: "Viendo Productos",
      value: 43,
      icon: Eye,
      color: "text-accent",
      trend: "stable",
    },
    {
      id: "carts",
      label: "Carritos Activos",
      value: 18,
      icon: ShoppingCart,
      color: "text-success",
      trend: "up",
    },
    {
      id: "activity",
      label: "Acciones/min",
      value: 234,
      icon: Activity,
      color: "text-mint",
      trend: "down",
    },
  ]);

  // Simulate real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) =>
        prev.map((stat) => ({
          ...stat,
          value: Math.max(0, stat.value + Math.floor(Math.random() * 11) - 5),
          trend:
            Math.random() > 0.5
              ? "up"
              : Math.random() > 0.5
                ? "down"
                : "stable",
        })),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          En Tiempo Real
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn("h-5 w-5", stat.color)} />
                  {stat.trend === "up" && (
                    <span className="text-xs text-success">↑</span>
                  )}
                  {stat.trend === "down" && (
                    <span className="text-xs text-error">↓</span>
                  )}
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
