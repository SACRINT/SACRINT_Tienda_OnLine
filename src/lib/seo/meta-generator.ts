/**
 * Meta Tags Generator
 * Generación de meta tags para SEO
 */

import type { Metadata } from "next";

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
  alternateLocales?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Generar metadata para Next.js
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    canonical,
    keywords,
    ogImage,
    ogType = "website",
    twitterCard = "summary_large_image",
    author,
    publishedTime,
    modifiedTime,
    locale = "es_ES",
    alternateLocales = [],
    noindex = false,
    nofollow = false,
  } = config;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com"; // ✅ ENV [P1.8]: Consolidated URL variable
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Tienda Online";

  // Map to valid OpenGraph types (Next.js only supports "website" and "article")
  const validOgType: "website" | "article" = ogType === "article" ? "article" : "website";

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords?.join(", "),
    authors: author ? [{ name: author }] : undefined,
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
      },
    },
    openGraph: {
      type: validOgType,
      title,
      description,
      url: canonical || baseUrl,
      siteName,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
      locale,
      alternateLocale: alternateLocales,
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: canonical || baseUrl,
      languages: alternateLocales.reduce(
        (acc, locale) => {
          acc[locale] = `${baseUrl}/${locale}`;
          return acc;
        },
        {} as Record<string, string>,
      ),
    },
  };

  return metadata;
}

/**
 * Generar metadata para página de producto
 */
export function generateProductMetadata(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  brand?: string;
  sku?: string;
  availability?: "in_stock" | "out_of_stock" | "preorder";
}): Metadata {
  const baseMetadata = generateMetadata({
    title: `${product.name} - Comprar Online`,
    description: product.description,
    ogType: "product",
    ogImage: product.images[0],
  });

  return {
    ...baseMetadata,
    other: {
      "product:price:amount": product.price.toString(),
      "product:price:currency": product.currency,
      "product:availability": product.availability || "in_stock",
      "product:brand": product.brand || "",
      "product:sku": product.sku || "",
    },
  };
}

/**
 * Generar metadata para página de categoría
 */
export function generateCategoryMetadata(category: {
  name: string;
  description?: string;
  image?: string;
  productCount?: number;
}): Metadata {
  const description =
    category.description ||
    `Explora ${category.productCount || "nuestra colección de"} productos en ${category.name}. Envío gratis en pedidos superiores a $50.`;

  return generateMetadata({
    title: `${category.name} - Tienda Online`,
    description,
    ogImage: category.image,
  });
}

/**
 * Generar JSON-LD para producto
 */
export function generateProductJsonLd(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  brand?: string;
  sku?: string;
  availability?: "in_stock" | "out_of_stock" | "preorder";
  rating?: { value: number; count: number };
}) {
  const availabilityMap = {
    in_stock: "https://schema.org/InStock",
    out_of_stock: "https://schema.org/OutOfStock",
    preorder: "https://schema.org/PreOrder",
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: product.brand
      ? {
          "@type": "Brand",
          name: product.brand,
        }
      : undefined,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: availabilityMap[product.availability || "in_stock"],
      url: typeof window !== "undefined" ? window.location.href : "",
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating.value,
          reviewCount: product.rating.count,
        }
      : undefined,
  };
}

/**
 * Generar JSON-LD para breadcrumbs
 */
export function generateBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
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

/**
 * Generar JSON-LD para organización
 */
export function generateOrganizationJsonLd(org: {
  name: string;
  url: string;
  logo: string;
  description?: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
  socialLinks?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    logo: org.logo,
    description: org.description,
    contactPoint: org.contactPoint
      ? {
          "@type": "ContactPoint",
          telephone: org.contactPoint.telephone,
          contactType: org.contactPoint.contactType,
        }
      : undefined,
    sameAs: org.socialLinks,
  };
}

/**
 * Generar JSON-LD para FAQs
 */
export function generateFAQJsonLd(faqs: Array<{ question: string; answer: string }>) {
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

export default {
  generateMetadata,
  generateProductMetadata,
  generateCategoryMetadata,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  generateOrganizationJsonLd,
  generateFAQJsonLd,
};
