"use client";

import {
  ShieldCheck,
  CreditCard,
  BarChart,
  Settings,
  Mail,
  Rocket,
} from "lucide-react";

const features = [
  {
    name: "Fácil de usar",
    description: "No code required. Nuestra plataforma intuitiva te permite crear y gestionar tu tienda sin necesidad de conocimientos técnicos.",
    icon: Rocket,
  },
  {
    name: "100% Seguro",
    description: "PCI DSS compliant. Tus datos y los de tus clientes están protegidos con los más altos estándares de seguridad.",
    icon: ShieldCheck,
  },
  {
    name: "Pagos integrados",
    description: "Acepta pagos de forma segura con Stripe y Mercado Pago desde el primer día.",
    icon: CreditCard,
  },
  {
    name: "Analytics",
    description: "Visualiza tus ventas y el comportamiento de tus clientes en tiempo real para tomar mejores decisiones.",
    icon: BarChart,
  },
  {
    name: "SEO optimizado",
    description: "Herramientas de SEO integradas para ayudarte a posicionar tu tienda en los primeros resultados de Google.",
    icon: Settings,
  },
  {
    name: "Soporte 24/7",
    description: "Nuestro equipo de soporte está disponible 24/7 por email y chat para ayudarte en lo que necesites.",
    icon: Mail,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white text-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Todo lo que necesitas para vender online</h2>

          <p className="mt-4 text-gray-600">
            Nuestra plataforma está diseñada para darte todas las herramientas que necesitas para tener éxito en el mundo del e-commerce.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="block rounded-xl border border-gray-200 p-8 shadow-sm transition hover:border-blue-500/10 hover:shadow-blue-500/10"
            >
              <feature.icon className="h-8 w-8 text-blue-500" />

              <h2 className="mt-4 text-xl font-bold text-gray-900">{feature.name}</h2>

              <p className="mt-1 text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
