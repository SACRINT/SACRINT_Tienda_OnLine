"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  cta: {
    text: string
    href: string
  }
  bgColor?: string
  image?: string
}

const defaultSlides: HeroSlide[] = [
  {
    id: "1",
    title: "Nueva Colección 2025",
    subtitle: "Descubre las últimas tendencias con descuentos exclusivos",
    cta: { text: "Explorar Ahora", href: "/categories" },
    bgColor: "from-primary to-primary-700",
  },
  {
    id: "2",
    title: "Ofertas de Temporada",
    subtitle: "Hasta 50% de descuento en productos seleccionados",
    cta: { text: "Ver Ofertas", href: "/ofertas" },
    bgColor: "from-accent-600 to-accent-700",
  },
  {
    id: "3",
    title: "Envío Gratis",
    subtitle: "En compras mayores a $999 MXN",
    cta: { text: "Comprar Ahora", href: "/shop" },
    bgColor: "from-mint-600 to-mint-700",
  },
]

interface HeroSectionProps {
  slides?: HeroSlide[]
  autoPlayInterval?: number
}

export function HeroSection({
  slides = defaultSlides,
  autoPlayInterval = 5000,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true)

  React.useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length, autoPlayInterval])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrev = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    goToSlide((currentSlide + 1) % slides.length)
  }

  const slide = slides[currentSlide]

  return (
    <section className="relative overflow-hidden">
      <div
        className={cn(
          "min-h-[500px] md:min-h-[600px] flex items-center justify-center bg-gradient-to-r transition-all duration-500",
          slide.bgColor || "from-primary to-primary-700"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            {slide.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            {slide.subtitle}
          </p>
          <Link href={slide.cta.href}>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-neutral-100 px-8 py-6 text-lg font-semibold"
            >
              {slide.cta.text}
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
        aria-label="Siguiente slide"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50"
            )}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
