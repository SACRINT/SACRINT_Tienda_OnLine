// SEO Metadata Utilities
// Next.js 14 Metadata API helpers

import { Metadata } from "next";

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product" | "profile";
  locale?: string;
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const DEFAULT_SITE_NAME = "SACRINT Tienda Online";
const DEFAULT_LOCALE = "es_MX";
const DEFAULT_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sacrint-tienda.vercel.app";

/**
 * Generate complete metadata for Next.js pages
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = "website",
    locale = DEFAULT_LOCALE,
    siteName = DEFAULT_SITE_NAME,
    author,
    publishedTime,
    modifiedTime,
  } = config;

  const fullUrl = url ? `${DEFAULT_URL}${url}` : DEFAULT_URL;
  const imageUrl = image ? (image.startsWith("http") ? image : `${DEFAULT_URL}${image}`) : `${DEFAULT_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: keywords.join(", "),
    authors: author ? [{ name: author }] : undefined,
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(DEFAULT_URL),
    alternates: {
      canonical: fullUrl,
      languages: {
        "es-MX": fullUrl,
        "es-ES": fullUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type,
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@sacrint",
      site: "@sacrint",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function getDefaultMetadata(): Metadata {
  return generateMetadata({
    title: `${DEFAULT_SITE_NAME} - Tu Tienda Online de Confianza`,
    description:
      "Descubre productos de calidad en nuestra tienda online. Envíos rápidos, precios competitivos y atención personalizada. ¡Compra ahora!",
    keywords: [
      "tienda online",
      "ecommerce",
      "compras online",
      "productos",
      "México",
      "envío gratis",
    ],
    type: "website",
  });
}
