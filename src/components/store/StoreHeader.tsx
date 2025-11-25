"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image"; // Import Image for cart items
import { useCart } from "@/lib/store/useCart"; // Assuming this exists

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function StoreHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const pathname = usePathname();
  const { items, removeItem, itemCount, subtotal } = useCart(); // Updated destructuring

  // Hydrate Zustand store on client side
  useEffect(() => {
    useCart.persist.rehydrate();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-1 md:flex md:items-center md:gap-12">
            <Link className="block text-xl font-bold text-gray-900" href="/">
              Tienda Online
            </Link>
          </div>

          <div className="md:flex md:items-center md:gap-12">
            <nav aria-label="Global" className="hidden md:block">
              <ul className="flex items-center gap-6 text-sm">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className={`text-gray-500 transition hover:text-gray-700/75 ${
                        pathname === link.href ? "text-blue-600 font-semibold" : ""
                      }`}
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              {/* Login/Signup Buttons for Desktop */}
              <div className="hidden sm:flex sm:gap-4">
                <Link
                  className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow"
                  href="/signup"
                >
                  Sign Up
                </Link>
              </div>

              {/* Cart Icon */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <button className="relative p-2 rounded-md hover:bg-gray-100 transition-colors">
                    <ShoppingCart className="h-5 w-5 text-gray-600" />
                    {itemCount() > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {itemCount() > 99 ? "99+" : itemCount()}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle>Tu Carrito ({itemCount()})</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto py-6">
                    {itemCount() === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        Tu carrito está vacío.
                      </div>
                    ) : (
                      <ul className="-my-6 divide-y divide-gray-200">
                        {items.map((item) => (
                          <li key={item.productId + (item.variantId || '')} className="flex py-6">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={96}
                                height={96}
                                className="h-full w-full object-cover object-center"
                              />
                            </div>
                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>
                                    <Link href={`/producto/${item.slug}`} onClick={() => setIsCartOpen(false)}>
                                      {item.name}
                                    </Link>
                                  </h3>
                                  <p className="ml-4">${item.price.toFixed(2)}</p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <div className="flex flex-1 items-end justify-between text-sm">
                                <div className="flex">
                                  <button
                                    type="button"
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                    onClick={() => removeItem(item.productId, item.variantId)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {itemCount() > 0 && (
                    <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Subtotal:</p>
                        <p>${subtotal().toFixed(2)}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Impuestos y envío calculados al finalizar la compra.
                      </p>
                      <div className="mt-6">
                        <Link
                          href="/cart"
                          className="flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700"
                          onClick={() => setIsCartOpen(false)}
                        >
                          Ver Carrito Completo
                        </Link>
                      </div>
                      <div className="mt-4 flex justify-center text-center text-sm text-gray-500">
                        o <Link href="/checkout" className="font-medium text-blue-600 hover:text-blue-500" onClick={() => setIsCartOpen(false)}>
                          Proceder al Pago
                        </Link>
                      </div>
                    </div>
                  )}
                </SheetContent>
              </Sheet>

              {/* Mobile Menu Trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="md:hidden rounded bg-gray-100 p-2 text-gray-600 transition hover:text-gray-600/75">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xs">
                  <SheetHeader>
                    <SheetTitle>Menú</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {/* Mobile Navigation */}
                    <nav aria-label="Global">
                      <ul className="flex flex-col items-start gap-6 py-8 text-sm">
                        {navLinks.map((link) => (
                          <li key={link.href}>
                            <Link
                              className={`text-gray-500 transition hover:text-gray-700/75 ${
                                pathname === link.href ? "text-blue-600 font-semibold" : ""
                              }`}
                              href={link.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600"
                            href="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Login
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow"
                            href="/signup"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Sign Up
                          </Link>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
