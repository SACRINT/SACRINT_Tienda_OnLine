import { Suspense } from "react";
import { db } from "@/lib/db";
import { ShopPageClient } from "./shop-client";

// Demo tenant ID - in production would come from subdomain/domain
const DEMO_TENANT_SLUG = "demo-store";

async function getProducts() {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    });

    if (!tenant) return [];

    const products = await db.product.findMany({
      where: {
        tenantId: tenant.id,
        published: true,
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product: (typeof products)[number]) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce(
              (sum: number, r: { rating: number }) => sum + r.rating,
              0,
            ) / product.reviews.length
          : undefined;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.salePrice || product.basePrice),
        salePrice: product.salePrice ? Number(product.salePrice) : undefined,
        originalPrice: Number(product.basePrice),
        image:
          product.images[0]?.url ||
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        rating: avgRating,
        reviewCount: product.reviews.length,
        inStock: product.stock > 0,
        category: product.category?.name || "Sin categoría",
        categorySlug: product.category?.slug,
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
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
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((cat: (typeof categories)[number]) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat._count.products,
    }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ShopPageClient products={products} categories={categories} />
    </Suspense>
  );
}
