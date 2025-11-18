import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/shared/ServiceWorkerRegistration'
import { PWAInstallPrompt } from '@/components/shared/PWAInstallPrompt'
import { MobileBottomNav, MobileHamburgerMenu } from '@/components/shared/MobileNav'

export const metadata: Metadata = {
  title: 'Tienda Online 2025 - E-commerce SaaS',
  description: 'Plataforma multi-tenant de e-commerce con seguridad de nivel bancario',
  keywords: 'ecommerce, tienda online, shopping, productos, multi-tenant, SaaS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tienda Online',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />

        <div className="min-h-screen flex flex-col bg-white">
          {/* Header */}
          <header className="bg-primary text-white py-4 px-4 md:px-6 shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MobileHamburgerMenu />
                <h1 className="text-xl md:text-2xl font-bold">Tienda Online 2025</h1>
              </div>
              <nav className="hidden md:flex gap-6">
                <a href="/" className="text-white hover:text-accent transition-colors">
                  Inicio
                </a>
                <a href="/shop" className="text-white hover:text-accent transition-colors">
                  Tienda
                </a>
                <a href="/login" className="text-white hover:text-accent transition-colors">
                  Ingresar
                </a>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow pb-16 md:pb-0">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-primary text-white py-8 px-6 mt-12 mb-16 md:mb-0">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div>
                  <h3 className="text-lg font-bold mb-3 text-accent">Tienda Online 2025</h3>
                  <p className="text-sm text-gray-300">
                    Plataforma e-commerce SaaS multi-tenant con seguridad de nivel bancario
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-3 text-accent">Enlaces</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/shop" className="text-gray-300 hover:text-accent transition-colors">Tienda</a></li>
                    <li><a href="/login" className="text-gray-300 hover:text-accent transition-colors">Iniciar Sesión</a></li>
                    <li><a href="/signup" className="text-gray-300 hover:text-accent transition-colors">Crear Tienda</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-3 text-accent">Tecnología</h3>
                  <p className="text-sm text-gray-300">
                    Next.js 14 • React 18 • TypeScript • PostgreSQL • Prisma
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-6 text-center">
                <p className="text-sm text-gray-400">
                  &copy; 2025 Tienda Online. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </footer>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>
      </body>
    </html>
  )
}
