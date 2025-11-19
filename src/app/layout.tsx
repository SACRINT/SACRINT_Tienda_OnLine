import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";
import { MobileBottomNav } from "@/components/shared/MobileNav";
import { SkipToContent } from "@/components/shared/SkipToContent";
import { ToastContainer } from "@/components/ui/toast-container";
import { StoreHeader, StoreFooter } from "@/components/store";

export const metadata: Metadata = {
  title: "Tienda Online 2025 - E-commerce SaaS",
  description:
    "Plataforma multi-tenant de e-commerce con seguridad de nivel bancario",
  keywords: "ecommerce, tienda online, shopping, productos, multi-tenant, SaaS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tienda Online",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SkipToContent />
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />

        <div className="min-h-screen flex flex-col bg-white">
          {/* Header */}
          <StoreHeader />

          {/* Main Content */}
          <main id="main-content" className="flex-grow pb-16 md:pb-0" tabIndex={-1}>
            {children}
          </main>

          {/* Footer */}
          <StoreFooter />

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>

        {/* Toast Notifications */}
        <ToastContainer />
      </body>
    </html>
  );
}
