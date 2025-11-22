// Dynamic Sitemap Generation
// SEO: Auto-generated sitemap.xml

import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sacrint-tienda.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: \`\${baseUrl}/shop\`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, updatedAt: true },
      take: 5000,
    });

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: \`\${baseUrl}/shop/\${product.slug || product.id}\`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch (error) {
    return staticPages;
  }
}
