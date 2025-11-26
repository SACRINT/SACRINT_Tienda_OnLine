/**
 * Structured Data (JSON-LD) Helpers
 * Semanas 31-32: SEO Avanzado - Calidad Mundial
 *
 * Generadores exhaustivos de Schema.org markup para:
 * - Product (con ratings, reviews, variantes)
 * - Organization (con contacto y redes sociales)
 * - BreadcrumbList
 * - WebSite (con SearchAction)
 * - LocalBusiness
 * - FAQ
 * - Article
 *
 * Referencias:
 * - https://schema.org/
 * - https://developers.google.com/search/docs/appearance/structured-data
 * - https://validator.schema.org/
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Product {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock" | "PreOrder" | "Discontinued";
  sku?: string;
  brand?: string;
  rating?: { value: number; count: number };
  reviews?: Array<{
    author: string;
    datePublished: string;
    reviewBody: string;
    ratingValue: number;
  }>;
  priceValidUntil?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Article {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  authorUrl?: string;
}

// ============================================================================
// PRODUCT SCHEMA (Enhanced)
// ============================================================================

/**
 * Generate enhanced Product structured data with reviews and ratings
 *
 * @example
 * const productData = generateProductSchema({
 *   name: "Samsung Galaxy A54",
 *   description: "Smartphone de última generación con cámara de 50MP",
 *   image: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
 *   price: 6999,
 *   currency: "MXN",
 *   availability: "InStock",
 *   sku: "SKU-12345",
 *   brand: "Samsung",
 *   rating: { value: 4.8, count: 127 },
 *   reviews: [...]
 * }, "https://example.com/products/samsung-galaxy-a54");
 */
export function generateProductSchema(product: Product, url: string) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: Array.isArray(product.image) ? product.image : [product.image],
    offers: {
      "@type": "Offer",
      price: product.price.toString(),
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
      url,
    },
  };

  // SKU
  if (product.sku) {
    schema.sku = product.sku;
  }

  // Brand
  if (product.brand) {
    schema.brand = {
      "@type": "Brand",
      name: product.brand,
    };
  }

  // Price Valid Until
  if (product.priceValidUntil) {
    schema.offers.priceValidUntil = product.priceValidUntil;
  }

  // Aggregate Rating
  if (product.rating && product.rating.count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating.value.toString(),
      reviewCount: product.rating.count.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Individual Reviews
  if (product.reviews && product.reviews.length > 0) {
    schema.review = product.reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      datePublished: review.datePublished,
      reviewBody: review.reviewBody,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.ratingValue.toString(),
        bestRating: "5",
        worstRating: "1",
      },
    }));
  }

  return schema;
}

// ============================================================================
// ORGANIZATION SCHEMA (Enhanced)
// ============================================================================

/**
 * Generate Organization structured data with social media links
 */
export function generateOrganizationSchema(options?: {
  includeSocialMedia?: boolean;
  customName?: string;
  customUrl?: string;
}) {
  const baseUrl = options?.customUrl || process.env.NEXT_PUBLIC_APP_URL || "https://sacrint-tienda.vercel.app";
  const name = options?.customName || "SACRINT Tienda Online";

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Tu tienda online de confianza. Productos de calidad, envíos rápidos y atención personalizada.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-555-123-4567",
      contactType: "customer service",
      email: "contacto@sacrint.com",
      areaServed: "MX",
      availableLanguage: ["Spanish", "English"],
    },
  };

  // Social Media Links
  if (options?.includeSocialMedia !== false) {
    schema.sameAs = [
      "https://www.facebook.com/sacrint",
      "https://www.twitter.com/sacrint",
      "https://www.instagram.com/sacrint",
      "https://www.linkedin.com/company/sacrint",
      "https://www.youtube.com/@sacrint",
    ];
  }

  return schema;
}

// ============================================================================
// WEBSITE SCHEMA (with SearchAction)
// ============================================================================

/**
 * Generate WebSite structured data with SearchAction
 * Habilita la barra de búsqueda en los resultados de Google
 *
 * @example
 * const websiteData = generateWebSiteSchema();
 */
export function generateWebSiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sacrint-tienda.vercel.app";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SACRINT Tienda Online",
    description: "Descubre productos de calidad en nuestra tienda online. Envíos rápidos, precios competitivos y atención personalizada.",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ============================================================================
// BREADCRUMB SCHEMA
// ============================================================================

/**
 * Generate BreadcrumbList structured data
 *
 * @example
 * const breadcrumbs = generateBreadcrumbSchema([
 *   { name: "Inicio", url: "https://example.com" },
 *   { name: "Productos", url: "https://example.com/products" },
 *   { name: "Samsung Galaxy A54", url: "https://example.com/products/samsung-galaxy-a54" }
 * ]);
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ============================================================================
// LOCAL BUSINESS SCHEMA
// ============================================================================

/**
 * Generate LocalBusiness structured data
 * Útil para tiendas físicas o con ubicación
 */
export function generateLocalBusinessSchema(data: {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  geo?: { latitude: number; longitude: number };
  telephone?: string;
  priceRange?: string;
  openingHours?: string[];
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sacrint-tienda.vercel.app";

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.name,
    image: `${baseUrl}/store-image.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: data.address.street,
      addressLocality: data.address.city,
      addressRegion: data.address.state,
      postalCode: data.address.postalCode,
      addressCountry: data.address.country,
    },
  };

  if (data.geo) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: data.geo.latitude.toString(),
      longitude: data.geo.longitude.toString(),
    };
  }

  if (data.telephone) {
    schema.telephone = data.telephone;
  }

  if (data.priceRange) {
    schema.priceRange = data.priceRange; // e.g., "$$" or "$100-$500"
  }

  if (data.openingHours && data.openingHours.length > 0) {
    schema.openingHoursSpecification = data.openingHours.map((hours) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours, // e.g., "Monday", "Tuesday"
    }));
  }

  return schema;
}

// ============================================================================
// FAQ SCHEMA
// ============================================================================

/**
 * Generate FAQPage structured data
 * Útil para páginas de preguntas frecuentes
 *
 * @example
 * const faqData = generateFAQSchema([
 *   {
 *     question: "¿Cuál es el tiempo de envío?",
 *     answer: "El tiempo de envío es de 3-5 días hábiles a todo México."
 *   },
 *   {
 *     question: "¿Aceptan devoluciones?",
 *     answer: "Sí, aceptamos devoluciones dentro de los primeros 30 días."
 *   }
 * ]);
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ============================================================================
// ARTICLE SCHEMA
// ============================================================================

/**
 * Generate Article structured data
 * Útil para blog posts y contenido editorial
 */
export function generateArticleSchema(article: Article) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sacrint-tienda.vercel.app";

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      "@type": "Person",
      name: article.author,
      url: article.authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "SACRINT Tienda Online",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Combine multiple structured data schemas into @graph
 * Útil cuando necesitas múltiples schemas en una página
 *
 * @example
 * const combined = combineSchemas([
 *   generateOrganizationSchema(),
 *   generateWebSiteSchema(),
 *   generateBreadcrumbSchema(breadcrumbs)
 * ]);
 */
export function combineSchemas(schemas: object[]): object {
  if (schemas.length === 1) {
    return schemas[0];
  }

  return {
    "@context": "https://schema.org",
    "@graph": schemas.map((schema: any) => {
      const { "@context": _, ...rest } = schema;
      return rest;
    }),
  };
}

/**
 * Convert schema object to JSON-LD string for script tag
 */
export function toJSONLD(schema: object): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Validate that a schema has required properties
 * Basic validation helper
 */
export function validateSchema(schema: any, requiredProps: string[]): boolean {
  return requiredProps.every((prop) => {
    const value = schema[prop];
    return value !== undefined && value !== null && value !== "";
  });
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default {
  generateProductSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateLocalBusinessSchema,
  generateFAQSchema,
  generateArticleSchema,
  combineSchemas,
  toJSONLD,
  validateSchema,
};
