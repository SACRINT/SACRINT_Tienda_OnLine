// SEO Utilities - Structured Data & Meta Tags

export interface ProductStructuredData {
  id: string;
  name: string;
  description: string;
  image: string[];
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string;
  rating?: number;
  reviewCount?: number;
}

export function generateProductJsonLd(product: ProductStructuredData): object {
  const availability = product.availability || "InStock";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency || "MXN",
      availability: "https://schema.org/" + availability,
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 0,
        }
      : undefined,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
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

export function generateWebsiteJsonLd(name: string, url: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  };
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

export function generateMetaTags(meta: PageMetadata): Record<string, string> {
  const tags: Record<string, string> = {
    title: meta.title,
    description: meta.description,
  };

  if (meta.keywords && meta.keywords.length) {
    tags.keywords = meta.keywords.join(", ");
  }

  tags["og:title"] = meta.title;
  tags["og:description"] = meta.description;
  tags["og:type"] = "website";
  tags["og:locale"] = "es_MX";
  if (meta.image) tags["og:image"] = meta.image;
  if (meta.url) tags["og:url"] = meta.url;

  tags["twitter:card"] = "summary_large_image";
  tags["twitter:title"] = meta.title;
  tags["twitter:description"] = meta.description;
  if (meta.image) tags["twitter:image"] = meta.image;

  return tags;
}

export function formatPageTitle(title: string, siteName: string = "SACRINT Tienda"): string {
  return title + " | " + siteName;
}

export function truncateDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description;
  const truncated = description.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace) + "...";
}
