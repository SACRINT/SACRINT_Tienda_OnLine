/**
 * Dynamic Sitemap Generator
 * Semanas 31-32: SEO Avanzado
 *
 * Genera sitemap dinámico con:
 * - Páginas estáticas (Home, Shop, Contact, etc.)
 * - Productos dinámicos de la base de datos
 * - Categorías dinámicas
 *
 * Referencias:
 * - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tienda-online-2025.vercel.app";

  // ============================================================================
  // STATIC PAGES
  // ============================================================================
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // ============================================================================
  // DYNAMIC PRODUCTS
  // ============================================================================
  let productPages: MetadataRoute.Sitemap = [];

  try {
    const products = await db.product.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 10000, // Limit to avoid timeout (adjust based on your needs)
      orderBy: {
        updatedAt: "desc",
      },
    });

    productPages = products.map((product) => ({
      url: `${baseUrl}/shop/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    // Continue with static pages even if products fail
  }

  // ============================================================================
  // DYNAMIC CATEGORIES
  // ============================================================================
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    const categories = await db.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 1000,
      orderBy: {
        updatedAt: "desc",
      },
    });

    categoryPages = categories.map((category) => ({
      url: `${baseUrl}/shop/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
    // Continue even if categories fail
  }

  // ============================================================================
  // COMBINE ALL PAGES
  // ============================================================================
  return [...staticPages, ...productPages, ...categoryPages];
}
