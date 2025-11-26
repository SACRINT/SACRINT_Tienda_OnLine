/**
 * SEO Optimization - Semana 26
 * Optimización SEO y meta tags
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export function generateProductSEO(product: any): SEOMetadata {
  return {
    title: `${product.name} - Tienda Online`,
    description: product.description.substring(0, 160),
    keywords: product.tags || [],
    ogImage: product.images?.[0]?.url,
    canonicalUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/products/${product.slug}`,
  };
}

export function generateCategorySEO(category: any): SEOMetadata {
  return {
    title: `${category.name} - Compra Online`,
    description: `Encuentra los mejores ${category.name} con envío gratis.`,
    canonicalUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/categories/${category.slug}`,
  };
}

export function generateStructuredData(type: 'product' | 'organization', data: any) {
  if (type === 'product') {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": data.name,
      "description": data.description,
      "image": data.images,
      "offers": {
        "@type": "Offer",
        "price": data.price,
        "priceCurrency": "USD",
      },
    };
  }

  return {};
}
