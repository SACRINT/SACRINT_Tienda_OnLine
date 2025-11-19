import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CategoryPageClient } from "./category-client";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

// Demo tenant ID - in production would come from subdomain/domain
const DEMO_TENANT_SLUG = "demo-store";

async function getCategory(slug: string) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    });

    if (!tenant) return null;

    const category = await db.category.findFirst({
      where: {
        tenantId: tenant.id,
        slug,
      },
    });

    return category;
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
}

async function getCategoryProducts(categoryId: string) {
  try {
    const products = await db.product.findMany({
      where: {
        categoryId,
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
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : undefined;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.salePrice || product.basePrice),
        originalPrice: product.salePrice ? Number(product.basePrice) : undefined,
        rating: avgRating,
        reviewCount: product.reviews.length,
        isNew: new Date().getTime() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
        isSale: !!product.salePrice,
        image: product.images[0]?.url,
        stock: product.stock,
      };
    });
  } catch (error) {
    console.error("Error fetching category products:", error);
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategory(params.slug);

  if (!category) {
    notFound();
  }

  const products = await getCategoryProducts(category.id);

  return (
    <CategoryPageClient
      categoryName={category.name}
      categorySlug={category.slug}
      products={products}
    />
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = await getCategory(params.slug);

  if (!category) {
    return {
      title: "Categoría no encontrada",
    };
  }

  return {
    title: `${category.name} - SACRINT Tienda`,
    description: `Explora nuestra colección de ${category.name}`,
  };
}
