import { HeroSection } from "@/components/home/HeroSection"
import { CategoriesSection } from "@/components/home/CategoriesSection"
import { FeaturedProducts } from "@/components/home/FeaturedProducts"
import { ValueProposition } from "@/components/home/ValueProposition"
import { Newsletter } from "@/components/home/Newsletter"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section with Carousel */}
      <HeroSection />

      {/* Value Proposition Bar */}
      <ValueProposition />

      {/* Popular Categories */}
      <CategoriesSection />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Special Offers Section */}
      <section className="py-16 bg-gradient-to-r from-accent to-accent-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ofertas Especiales de la Semana
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Hasta 50% de descuento en productos seleccionados
          </p>
          <p className="text-4xl font-bold mb-8">
            Termina en: <span className="tabular-nums">23:59:59</span>
          </p>
          <a
            href="/ofertas"
            className="inline-block bg-white text-accent hover:bg-neutral-100 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Ver Todas las Ofertas
          </a>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <Newsletter />
    </main>
  )
}
