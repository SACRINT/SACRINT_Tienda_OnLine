"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  productCount?: number
}

const defaultCategories: Category[] = [
  { id: "1", name: "Electrónicos", slug: "electronicos", productCount: 150 },
  { id: "2", name: "Ropa", slug: "ropa", productCount: 320 },
  { id: "3", name: "Hogar", slug: "hogar", productCount: 85 },
  { id: "4", name: "Deportes", slug: "deportes", productCount: 120 },
]

interface CategoriesSectionProps {
  title?: string
  subtitle?: string
  categories?: Category[]
}

export function CategoriesSection({
  title = "Categorías Populares",
  subtitle = "Explora nuestras categorías más buscadas",
  categories = defaultCategories,
}: CategoriesSectionProps) {
  return (
    <section className="py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group"
            >
              <div className="relative overflow-hidden rounded-lg bg-white shadow-soft hover:shadow-medium transition-all duration-300">
                <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl">
                      {getCategoryEmoji(category.slug)}
                    </span>
                  )}
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                  {category.productCount && (
                    <p className="text-sm text-muted-foreground">
                      {category.productCount} productos
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center text-primary hover:text-accent font-medium transition-colors"
          >
            Ver todas las categorías
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function getCategoryEmoji(slug: string): string {
  const emojis: Record<string, string> = {
    electronicos: "📱",
    ropa: "👕",
    hogar: "🏠",
    deportes: "⚽",
    belleza: "💄",
    juguetes: "🎮",
    libros: "📚",
    alimentos: "🍎",
  }
  return emojis[slug] || "📦"
}
