// JSON-LD Structured Data for SEO
// Rich snippets and schema markup

export interface Product {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
  sku?: string;
  brand?: string;
  rating?: { value: number; count: number };
}

export function generateProductSchema(product: Product, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability}`,
      url,
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

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SACRINT Tienda Online",
    url: "https://sacrint-tienda.vercel.app",
    logo: "https://sacrint-tienda.vercel.app/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-555-1234567",
      contactType: "customer service",
    },
  };
}
