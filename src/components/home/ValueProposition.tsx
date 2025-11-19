"use client";

import * as React from "react";
import { Truck, Shield, CreditCard, HeadphonesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValueItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const defaultValues: ValueItem[] = [
  {
    icon: <Truck className="h-8 w-8" />,
    title: "Envío Gratis",
    description: "En compras mayores a $999",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Compra Segura",
    description: "Protección de datos 100%",
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Pago Flexible",
    description: "Múltiples métodos de pago",
  },
  {
    icon: <HeadphonesIcon className="h-8 w-8" />,
    title: "Soporte 24/7",
    description: "Siempre disponibles para ti",
  },
];

interface ValuePropositionProps {
  values?: ValueItem[];
  className?: string;
}

export function ValueProposition({
  values = defaultValues,
  className,
}: ValuePropositionProps) {
  return (
    <section className={cn("py-12 bg-primary text-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {values.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-4 p-3 bg-white/10 rounded-full">
                {item.icon}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-white/80">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
