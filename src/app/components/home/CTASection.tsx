"use client";

import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="mx-auto max-w-screen-xl px-4 py-12 lg:flex lg:items-center lg:justify-between lg:py-16">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            ¿Listo para crecer?
          </h2>

          <p className="mt-4 text-gray-200">
            Miles de vendedores ya usan Tienda Online para llevar sus negocios al siguiente nivel.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 lg:mt-0 lg:flex-shrink-0">
          <Link
            href="/signup"
            className="block w-full rounded-lg bg-white px-12 py-3 text-sm font-medium text-blue-600 shadow hover:bg-gray-100 focus:outline-none focus:ring active:bg-gray-50 sm:w-auto"
          >
            Crear Tienda Gratis
          </Link>

          <Link
            href="/demo"
            className="block w-full rounded-lg bg-transparent px-12 py-3 text-sm font-medium text-white shadow ring-1 ring-white hover:bg-white/10 focus:outline-none focus:ring active:bg-white/20 sm:w-auto"
          >
            Ver Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
