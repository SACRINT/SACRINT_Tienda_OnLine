import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tienda Online 2025 - E-commerce SaaS Platform',
  description: 'Multi-tenant e-commerce platform with banking-level security',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
