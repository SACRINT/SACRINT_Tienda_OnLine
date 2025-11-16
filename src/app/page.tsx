import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-light to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4 text-center">
          Bienvenido a Tienda Online 2025
        </h1>
        <p className="text-xl md:text-2xl text-neutral-dark text-center mb-8 max-w-3xl mx-auto">
          Plataforma e-commerce SaaS multi-tenant con seguridad de nivel bancario
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link href="/login">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="w-full sm:w-auto border-2 border-accent text-primary hover:bg-neutral-light px-8 py-6 text-lg">
              Crear Tienda
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Feature 1 */}
          <div className="p-8 bg-white border-2 border-primary rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-primary mb-3">Seguridad</h2>
            <p className="text-neutral-dark">
              Protección de nivel bancario con PCI DSS compliance y validaciones en dos capas
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 bg-white border-2 border-accent rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-2xl font-bold text-accent mb-3">Escalable</h2>
            <p className="text-neutral-dark">
              Arquitectura multi-tenant completamente aislada para múltiples vendedores
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 bg-white border-2 border-primary rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-primary mb-3">Moderno</h2>
            <p className="text-neutral-dark">
              Construido con Next.js 14, React 18 y TypeScript strict mode
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 p-8 bg-primary text-white rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Stack Tecnológico</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-primary-light rounded-lg">
              <p className="font-bold text-lg mb-2">Frontend</p>
              <p className="text-sm text-gray-300">Next.js 14 + React 18</p>
            </div>
            <div className="p-4 bg-primary-light rounded-lg">
              <p className="font-bold text-lg mb-2">Styling</p>
              <p className="text-sm text-gray-300">Tailwind CSS + shadcn/ui</p>
            </div>
            <div className="p-4 bg-primary-light rounded-lg">
              <p className="font-bold text-lg mb-2">Backend</p>
              <p className="text-sm text-gray-300">Next.js API Routes</p>
            </div>
            <div className="p-4 bg-primary-light rounded-lg">
              <p className="font-bold text-lg mb-2">Database</p>
              <p className="text-sm text-gray-300">PostgreSQL + Prisma</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg">
            <p className="font-semibold">✅ Sprint 0 Completado - Sistema Listo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
