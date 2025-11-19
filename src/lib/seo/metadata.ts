// SEO Metadata utilities
import { Metadata } from "next";

// Base site configuration
export const siteConfig = {
  name: "SACRINT Tienda Online",
  description:
    "Tu tienda online de confianza con los mejores productos y precios en México",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://sacrint.com",
  ogImage: "/og-image.jpg",
  locale: "es_MX",
  twitterHandle: "@sacrint",
};

// Base metadata that all pages inherit
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "tienda online",
    "e-commerce",
    "compras en línea",
    "México",
    "productos",
    "envío gratis",
  ],
  authors: [{ name: "SACRINT" }],
  creator: "SACRINT",
  publisher: "SACRINT",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    // yandex: process.env.YANDEX_VERIFICATION,
  },
};

// Generate metadata for product pages
export function generateProductMetadata(product: {
  name: string;
  description: string;
  price: number;
  images: string[];
  category?: string;
  brand?: string;
  sku?: string;
}): Metadata {
  const title = product.name;
  const description = product.description.slice(0, 160);
  const image = product.images[0] || siteConfig.ogImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// Generate metadata for category pages
export function generateCategoryMetadata(category: {
  name: string;
  description?: string;
  productCount?: number;
}): Metadata {
  const title = `${category.name} - Productos`;
  const description =
    category.description ||
    `Explora nuestra colección de ${category.name}. ${category.productCount || ""} productos disponibles.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

// Generate metadata for search results
export function generateSearchMetadata(
  query: string,
  resultCount: number,
): Metadata {
  return {
    title: `"${query}" - Resultados de búsqueda`,
    description: `${resultCount} resultados encontrados para "${query}"`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

// Canonical URL generator
export function getCanonicalUrl(path: string): string {
  return `${siteConfig.url}${path}`;
}

// Alternate language URLs
export function getAlternateUrls(path: string) {
  return {
    "es-MX": `${siteConfig.url}${path}`,
    // Add more languages as needed
    // "en-US": `${siteConfig.url}/en${path}`,
  };
}
