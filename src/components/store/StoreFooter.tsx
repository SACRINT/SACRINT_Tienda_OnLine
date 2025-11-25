"use client";

import Link from "next/link";
import { Send } from "lucide-react";

export function StoreFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-start lg:gap-8">
          <div className="text-teal-600">
            <Link href="/" className="text-2xl font-bold text-white">
              Tienda Online
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8 lg:mt-0 lg:grid-cols-4 lg:gap-y-16">
            <div className="col-span-2 sm:col-span-1">
              <p className="font-medium">Empresa</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/about" className="text-gray-400 transition hover:text-white">About</Link></li>
                <li><Link href="/blog" className="text-gray-400 transition hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="text-gray-400 transition hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="font-medium">Producto</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/pricing" className="text-gray-400 transition hover:text-white">Pricing</Link></li>
                <li><Link href="/#features" className="text-gray-400 transition hover:text-white">Features</Link></li>
                <li><Link href="/security" className="text-gray-400 transition hover:text-white">Security</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="font-medium">Legal</p>
              <ul className="mt-6 space-y-4 text-sm">
                <li><Link href="/terms" className="text-gray-400 transition hover:text-white">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="text-gray-400 transition hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-gray-400 transition hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="font-medium">Social</p>
              <ul className="mt-6 flex gap-6">
                <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-gray-400 transition hover:text-white">Twitter</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-400 transition hover:text-white">Facebook</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-400 transition hover:text-white">Instagram</a></li>
              </ul>
            </div>

            <div className="col-span-2">
              <p className="font-medium">Suscríbete a nuestro newsletter</p>
              <form className="mt-6">
                <div className="relative max-w-lg">
                  <label className="sr-only" htmlFor="email"> Email </label>
                  <input
                    className="w-full rounded-full border-gray-700 bg-gray-800 p-4 pe-32 text-sm font-medium text-white"
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                  />
                  <button className="absolute end-1 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8">
          <p className="text-center text-xs/relaxed text-gray-400">
            © Tienda Online {currentYear}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
