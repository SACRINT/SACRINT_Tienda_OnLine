/**
 * Dynamic Sitemap Generation
 * Generates sitemap.xml for SEO optimization
 */

import { MetadataRoute } from "next";
import { db } from "@/lib/db/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

// Demo tenant for the public store
const DEMO_TENANT_SLUG = "demo-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    // Get tenant
    const tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    });

    if (!tenant) {
      return staticPages;
    }

    // Get all published products
    const products = await db.product.findMany({
      where: {
        tenantId: tenant.id,
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get all categories with products
    const categories = await db.category.findMany({
      where: {
        tenantId: tenant.id,
        products: {
          some: {
            published: true,
          },
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // Product pages
    const productPages: MetadataRoute.Sitemap = products.map(
      (product: { slug: string; updatedAt: Date }) => ({
        url: `${BASE_URL}/shop/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );

    // Category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map(
      (category: { slug: string; updatedAt: Date }) => ({
        url: `${BASE_URL}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }),
    );

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticPages;
  }
}
