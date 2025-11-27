import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog | Tienda Online",
  description: "Recursos y consejos para emprendedores digitales",
};

const blogPosts = [
  {
    id: 1,
    title: "Cómo lanzar tu tienda online en 2025",
    excerpt: "Descubre los pasos esenciales para poner tu negocio online exitosamente",
    date: "23 de Noviembre, 2025",
    category: "Negocios",
    slug: "como-lanzar-tienda-online",
  },
  {
    id: 2,
    title: "5 estrategias de marketing que funcionan en e-commerce",
    excerpt: "Aumenta tus ventas con estas estrategias probadas de marketing digital",
    date: "20 de Noviembre, 2025",
    category: "Marketing",
    slug: "estrategias-marketing-ecommerce",
  },
  {
    id: 3,
    title: "Optimiza tu checkout para aumentar conversiones",
    excerpt: "Mejora tu tasa de conversión simplificando el proceso de compra",
    date: "15 de Noviembre, 2025",
    category: "Optimización",
    slug: "optimizar-checkout",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Blog de Tienda Online
          </h1>
          <p className="max-w-2xl text-xl text-gray-600">
            Artículos, consejos y estrategias para ayudarte a crecer tu negocio online
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">
                      {post.category}
                    </span>
                  </div>
                  <h2 className="mb-2 line-clamp-2 text-xl font-bold text-gray-900">
                    {post.title}
                  </h2>
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{post.date}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Leer más <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
