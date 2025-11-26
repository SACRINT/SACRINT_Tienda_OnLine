/**
 * Robots.txt Generator
 * Semanas 31-32: SEO Avanzado
 *
 * Configuración optimizada de robots.txt para:
 * - Control de crawling de bots
 * - Protección de rutas privadas
 * - Optimización de presupuesto de crawl
 * - Referencia a sitemaps
 *
 * Referencias:
 * - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 * - https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tienda-online-2025.vercel.app';

  return {
    rules: [
      // ============================================================================
      // GENERAL CRAWLERS (Google, Bing, etc.)
      // ============================================================================
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',           // API routes - no indexar
          '/dashboard/*',     // Admin dashboard - privado
          '/_next/*',         // Next.js internal - no indexar
          '/admin/*',         // Admin routes - privado
          '/checkout/*',      // Checkout pages - privadas
          '/account/*',       // User account pages - privadas
          '/auth/*',          // Authentication pages - no indexar
          '/search?*',        // Search results - evitar duplicate content
          '/*?sort=*',        // Sorted pages - evitar duplicate content
          '/*?filter=*',      // Filtered pages - evitar duplicate content
          '/*?page=*',        // Paginated URLs - considerar indexación estratégica
        ],
        // Crawl-delay para controlar carga del servidor (opcional)
        // crawlDelay: 1, // 1 segundo entre requests
      },

      // ============================================================================
      // GOOGLEBOT (Reglas específicas)
      // ============================================================================
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/admin/*',
          '/checkout/*',
          '/account/*',
          '/auth/*',
        ],
      },

      // ============================================================================
      // GOOGLEBOT-IMAGE (Para imágenes)
      // ============================================================================
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/images/*',        // Permitir crawling de imágenes
          '/uploads/*',       // Permitir crawling de uploads
          '/*.jpg',
          '/*.jpeg',
          '/*.png',
          '/*.webp',
          '/*.svg',
        ],
        disallow: [
          '/account/*',       // No indexar imágenes de cuentas privadas
        ],
      },

      // ============================================================================
      // BINGBOT
      // ============================================================================
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/admin/*',
          '/checkout/*',
          '/account/*',
          '/auth/*',
        ],
      },

      // ============================================================================
      // BAD BOTS (Bloquear scrapers maliciosos)
      // ============================================================================
      {
        userAgent: [
          'AhrefsBot',        // Scraper agresivo
          'SemrushBot',       // Scraper agresivo
          'MJ12bot',          // Majestic bot
          'DotBot',           // Scraper agresivo
          'BLEXBot',          // Scraper
        ],
        disallow: '/',
      },
    ],

    // ============================================================================
    // SITEMAP REFERENCE
    // ============================================================================
    sitemap: `${baseUrl}/sitemap.xml`,

    // Nota: Para hosts con múltiples dominios, puedes especificar sitemaps adicionales:
    // sitemaps: [
    //   `${baseUrl}/sitemap.xml`,
    //   `${baseUrl}/sitemap-products.xml`,
    //   `${baseUrl}/sitemap-categories.xml`,
    // ],
  };
}

/**
 * IMPORTANT NOTES:
 *
 * 1. Crawl Budget Optimization:
 *    - Block low-value pages (filters, sorts, search results)
 *    - Allow high-value pages (products, categories, static content)
 *    - Use canonical tags for duplicate content
 *
 * 2. Security:
 *    - robots.txt is NOT a security measure
 *    - Always implement proper authentication
 *    - Use X-Robots-Tag header for sensitive pages
 *
 * 3. Testing:
 *    - Test with Google Search Console's robots.txt Tester
 *    - Verify with Bing Webmaster Tools
 *    - Use online validators: https://support.google.com/webmasters/answer/6062598
 *
 * 4. Best Practices:
 *    - Keep it simple and clear
 *    - Don't block CSS/JS (needed for rendering)
 *    - Monitor crawl stats in Search Console
 *    - Update regularly based on analytics
 */