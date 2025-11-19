import { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ValueProposition } from "@/components/home/ValueProposition";
import { Newsletter } from "@/components/home/Newsletter";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "SACRINT Demo Store - Tu Tienda Online",
  description:
    "Descubre productos de calidad en electrónica, ropa, hogar y deportes. Envío gratis en compras mayores a $1,000 MXN. Ofertas exclusivas disponibles.",
  openGraph: {
    title: "SACRINT Demo Store",
    description: "Tu tienda en línea de confianza",
    type: "website",
  },
};

// Demo tenant ID - in production would come from subdomain/domain
const DEMO_TENANT_SLUG = "demo-store";

async function getFeaturedProducts() {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    });

    if (!tenant) return [];

    const products = await db.product.findMany({
      where: {
        tenantId: tenant.id,
        published: true,
        featured: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : undefined;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.salePrice || product.basePrice),
        originalPrice: product.salePrice
          ? Number(product.basePrice)
          : undefined,
        image: product.images[0]?.url,
        rating: avgRating,
        reviewCount: product.reviews.length,
        isNew:
          new Date().getTime() - new Date(product.createdAt).getTime() <
          7 * 24 * 60 * 60 * 1000,
        isSale: !!product.salePrice,
      };
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

async function getCategories() {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    });

    if (!tenant) return [];

    const categories = await db.category.findMany({
      where: {
        tenantId: tenant.id,
        parentId: null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      take: 6,
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      productCount: cat._count.products,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <main className="min-h-screen">
      {/* Hero Section with Carousel */}
      <HeroSection />

      {/* Value Proposition Bar */}
      <ValueProposition />

      {/* Popular Categories */}
      <CategoriesSection categories={categories} />

      {/* Featured Products */}
      <FeaturedProducts products={featuredProducts} />

      {/* Special Offers Section */}
      <section className="py-16 bg-gradient-to-r from-accent to-accent-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ofertas Especiales de la Semana
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Hasta 50% de descuento en productos seleccionados
          </p>
          <p className="text-lg mb-8">
            Usa el código{" "}
            <span className="font-bold bg-white/20 px-3 py-1 rounded">
              BIENVENIDO10
            </span>{" "}
            para 10% de descuento
          </p>
          <a
            href="/shop"
            className="inline-block bg-white text-accent hover:bg-neutral-100 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Ver Todas las Ofertas
          </a>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <Newsletter />
    </main>
  );
}
