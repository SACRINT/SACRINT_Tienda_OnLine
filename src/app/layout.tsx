import type { Metadata, Viewport } from "next";
import "./globals.css";

// ✅ SECURITY [P0.5]: Validate environment variables at startup
import "@/lib/config/env";

import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";
import { MobileBottomNav } from "@/components/shared/MobileNav";
import { SkipToContent } from "@/components/shared/SkipToContent";
import { ToastContainer } from "@/components/ui/toast-container";
import { StoreHeader, StoreFooter } from "@/components/store";
import { AnalyticsTracker } from "@/lib/analytics/AnalyticsTracker";
import { Suspense } from "react";


export const metadata: Metadata = {
  title: "Tienda Online - Tu plataforma e-commerce SaaS",
  description: "Crea tu tienda online profesional sin conocimiento técnico. Vende tus productos, gestiona tus pedidos y haz crecer tu negocio.",
  keywords: "ecommerce, tienda online, venta online, saas, crear tienda, negocio online",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tienda Online",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Tienda Online - Tu plataforma e-commerce SaaS",
    description: "Crea tu tienda online profesional sin conocimiento técnico.",
    url: "https://tienda-online-2025.vercel.app",
    siteName: "Tienda Online",
    images: [
      {
        url: "/og-image.png", // Replace with your actual OG image
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda Online - Tu plataforma e-commerce SaaS",
    description: "Crea tu tienda online profesional sin conocimiento técnico.",
    creator: "@TiendaOnlineApp", // Replace with your Twitter handle
    images: ["/og-image.png"], // Replace with your actual OG image
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <Suspense>
          <AnalyticsTracker />
        </Suspense>
        <SkipToContent />
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />

        <div className="flex min-h-screen flex-col bg-white">
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
