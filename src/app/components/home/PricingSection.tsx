"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: 9,
    features: ["100 productos", "1 usuario", "Email support"],
    popular: false,
  },
  {
    name: "Professional",
    price: 29,
    features: [
      "Productos ilimitados",
      "5 usuarios",
      "Priority support",
      "Análisis avanzado",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["Todo incluido", "API access", "Onboarding dedicado"],
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-900 text-white">
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Planes para todos los tamaños</h2>
          <p className="mt-4 text-gray-400">
            Elige el plan que mejor se adapte a tus necesidades y comienza a vender hoy mismo.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border ${
                plan.popular ? "border-blue-600" : "border-gray-700"
              } p-8 shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute top-0 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">
                  Most Popular
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-xl font-semibold">{plan.name}</h3>

                <div className="mt-4 flex items-baseline text-gray-100">
                  {typeof plan.price === "number" ? (
                    <>
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="ml-1 text-gray-400">/mes</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">{plan.price}</span>
                  )}
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/signup"
                className={`mt-8 block rounded-lg px-6 py-3 text-center text-sm font-medium ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                {plan.name === "Enterprise" ? "Contactar Ventas" : "Comenzar"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
