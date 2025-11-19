"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Eye,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStep {
  id: string;
  name: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ConversionFunnelProps {
  className?: string;
}

export function ConversionFunnel({ className }: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    {
      id: "visits",
      name: "Visitas",
      count: 10000,
      icon: Eye,
      color: "bg-primary",
    },
    {
      id: "product",
      name: "Vieron Producto",
      count: 4500,
      icon: Eye,
      color: "bg-primary/80",
    },
    {
      id: "cart",
      name: "Agregaron al Carrito",
      count: 1800,
      icon: ShoppingCart,
      color: "bg-accent",
    },
    {
      id: "checkout",
      name: "Iniciaron Checkout",
      count: 900,
      icon: CreditCard,
      color: "bg-accent/80",
    },
    {
      id: "purchase",
      name: "Compraron",
      count: 540,
      icon: CheckCircle2,
      color: "bg-success",
    },
  ];

  const overallConversion = ((steps[4].count / steps[0].count) * 100).toFixed(
    1,
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Embudo de Conversión
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-success">
              {overallConversion}%
            </p>
            <p className="text-xs text-muted-foreground">Conversión Total</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const prevCount = index > 0 ? steps[index - 1].count : step.count;
            const conversionRate = ((step.count / prevCount) * 100).toFixed(1);
            const widthPercentage = (step.count / steps[0].count) * 100;
            const Icon = step.icon;

            return (
              <div key={step.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{step.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">
                      {step.count.toLocaleString("es-MX")}
                    </span>
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({conversionRate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      step.color,
                    )}
                    style={{ width: `${widthPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversion Insights */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Insights</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>
              • La tasa de abandono del carrito es del{" "}
              {(100 - (900 / 1800) * 100).toFixed(0)}%
            </li>
            <li>• El 60% de los que inician checkout completan la compra</li>
            <li>• Oportunidad: mejorar páginas de producto (+conversión)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
