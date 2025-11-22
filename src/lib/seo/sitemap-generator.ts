/**
 * Sitemap Generator
 * Generación dinámica de sitemaps
 */

import { logger } from "../monitoring/logger";

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export interface SitemapOptions {
  baseUrl: string;
  defaultChangeFrequency?: SitemapEntry["changeFrequency"];
  defaultPriority?: number;
}

/**
 * Generar XML de sitemap
 */
export function generateSitemapXML(entries: SitemapEntry[], options: SitemapOptions): string {
  const { baseUrl, defaultChangeFrequency = "weekly", defaultPriority = 0.5 } = options;

  const entriesXML = entries
    .map((entry) => {
      const url = entry.url.startsWith("http") ? entry.url : `${baseUrl}${entry.url}`;
      const lastmod = entry.lastModified
        ? `    <lastmod>${entry.lastModified.toISOString()}</lastmod>`
        : "";
      const changefreq = `    <changefreq>${entry.changeFrequency || defaultChangeFrequency}</changefreq>`;
      const priority = `    <priority>${entry.priority ?? defaultPriority}</priority>`;

      return `  <url>
    <loc>${url}</loc>
${lastmod}
${changefreq}
${priority}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entriesXML}
</urlset>`;
}

/**
 * Generar sitemap index
 */
export function generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: Date }>): string {
  const sitemapsXML = sitemaps
    .map((sitemap) => {
      const lastmod = sitemap.lastmod
        ? `    <lastmod>${sitemap.lastmod.toISOString()}</lastmod>`
        : "";

      return `  <sitemap>
    <loc>${sitemap.loc}</loc>
${lastmod}
  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapsXML}
</sitemapindex>`;
}

/**
 * Generar entradas de sitemap para productos
 */
export async function generateProductSitemapEntries(
  products: Array<{
    id: string;
    slug: string;
    updatedAt: Date;
  }>,
): Promise<SitemapEntry[]> {
  return products.map((product) => ({
    url: `/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
}

/**
 * Generar entradas de sitemap para categorías
 */
export async function generateCategorySitemapEntries(
  categories: Array<{
    id: string;
    slug: string;
    updatedAt?: Date;
  }>,
): Promise<SitemapEntry[]> {
  return categories.map((category) => ({
    url: `/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
}

/**
 * Generar entradas estáticas
 */
export function generateStaticSitemapEntries(): SitemapEntry[] {
  return [
    {
      url: "/",
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: "/shop",
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: "/about",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: "/contact",
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: "/faq",
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
  ];
}

/**
 * Chunk sitemap entries (max 50,000 URLs per sitemap)
 */
export function chunkSitemapEntries(entries: SitemapEntry[], chunkSize = 50000): SitemapEntry[][] {
  const chunks: SitemapEntry[][] = [];

  for (let i = 0; i < entries.length; i += chunkSize) {
    chunks.push(entries.slice(i, i + chunkSize));
  }

  return chunks;
}

/**
 * Logging de generación de sitemap
 */
export function logSitemapGeneration(data: {
  type: string;
  entriesCount: number;
  duration: number;
}): void {
  logger.info(
    {
      type: "sitemap_generated",
      sitemapType: data.type,
      entriesCount: data.entriesCount,
      duration: data.duration,
    },
    `Sitemap generated: ${data.type} with ${data.entriesCount} entries`,
  );
}

export default {
  generateSitemapXML,
  generateSitemapIndex,
  generateProductSitemapEntries,
  generateCategorySitemapEntries,
  generateStaticSitemapEntries,
  chunkSitemapEntries,
  logSitemapGeneration,
};
