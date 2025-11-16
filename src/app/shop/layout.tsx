'use client'

// Shop Layout - Layout principal de la tienda pública
// Incluye Header, Sidebar con filtros, y Footer

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/lib/store/useCart'

interface ShopLayoutProps {
  children: ReactNode
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const itemCount = useCart((state) => state.itemCount)

  // Hidratar Zustand store en cliente (evitar mismatch SSR)
  useEffect(() => {
    useCart.persist.rehydrate()
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('q') as string
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/shop" className="flex items-center gap-2">
              <span className="text-2xl font-bold">🛒</span>
              <span className="text-xl font-bold hidden sm:inline">Tienda Online</span>
            </Link>

            {/* Buscador (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <input
                type="search"
                name="q"
                placeholder="Buscar productos..."
                className="flex-1 px-4 py-2 text-neutral-dark rounded-l-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="bg-accent hover:bg-accent-dark px-6 py-2 rounded-r-md transition-colors"
              >
                🔍
              </button>
            </form>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/shop" className="hover:text-accent transition-colors">
                Productos
              </Link>

              {/* Carrito */}
              <Link
                href="/shop/cart"
                className="relative hover:text-accent transition-colors"
              >
                🛒 Carrito
                {mounted && itemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount()}
                  </span>
                )}
              </Link>

              {/* Auth Links */}
              {session ? (
                <Link href="/dashboard" className="hover:text-accent transition-colors">
                  Mi Cuenta
                </Link>
              ) : (
                <Link href="/login" className="hover:text-accent transition-colors">
                  Ingresar
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-primary-light rounded-md transition-colors"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="md:hidden pb-4 flex">
            <input
              type="search"
              name="q"
              placeholder="Buscar..."
              className="flex-1 px-4 py-2 text-neutral-dark rounded-l-md focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              className="bg-accent hover:bg-accent-dark px-4 py-2 rounded-r-md transition-colors"
            >
              🔍
            </button>
          </form>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-primary-light border-t border-primary-dark">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-accent transition-colors"
              >
                Productos
              </Link>
              <Link
                href="/shop/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-accent transition-colors"
              >
                🛒 Carrito {mounted && itemCount() > 0 && `(${itemCount()})`}
              </Link>
              {session ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-accent transition-colors"
                >
                  Mi Cuenta
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-accent transition-colors"
                >
                  Ingresar
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Content - Sin sidebar por ahora (se puede agregar después) */}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-light border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Productos */}
            <div>
              <h3 className="font-bold text-primary mb-4">Productos</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/shop" className="hover:text-accent transition-colors">
                    Ver todos
                  </Link>
                </li>
                <li>
                  <Link href="/shop?featured=true" className="hover:text-accent transition-colors">
                    Destacados
                  </Link>
                </li>
                <li>
                  <Link href="/shop?sort=newest" className="hover:text-accent transition-colors">
                    Nuevos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Ayuda */}
            <div>
              <h3 className="font-bold text-primary mb-4">Ayuda</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/help/faq" className="hover:text-accent transition-colors">
                    Preguntas frecuentes
                  </Link>
                </li>
                <li>
                  <Link href="/help/shipping" className="hover:text-accent transition-colors">
                    Envíos
                  </Link>
                </li>
                <li>
                  <Link href="/help/returns" className="hover:text-accent transition-colors">
                    Devoluciones
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-primary mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/legal/terms" className="hover:text-accent transition-colors">
                    Términos de servicio
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="hover:text-accent transition-colors">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/legal/cookies" className="hover:text-accent transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} Tienda Online 2025. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
