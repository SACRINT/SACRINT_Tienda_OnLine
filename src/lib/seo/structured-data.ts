// Schema.org Structured Data generators
import { siteConfig } from "./metadata"

// Organization schema
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [
      "https://facebook.com/sacrint",
      "https://twitter.com/sacrint",
      "https://instagram.com/sacrint",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-55-1234-5678",
      contactType: "customer service",
      availableLanguage: ["Spanish"],
    },
  }
}

// Website schema
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

// Product schema
export function generateProductSchema(product: {
  name: string
  description: string
  sku: string
  price: number
  compareAtPrice?: number
  images: string[]
  brand?: string
  category?: string
  inStock: boolean
  rating?: number
  reviewCount?: number
  url: string
}) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images,
    url: product.url,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "MXN",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    },
  }

  if (product.brand) {
    schema.brand = {
      "@type": "Brand",
      name: product.brand,
    }
  }

  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    schema.offers.priceValidUntil = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString().split("T")[0]
  }

  if (product.rating && product.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    }
  }

  return schema
}

// Breadcrumb schema
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// FAQ schema
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
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
  }
}

// Local business schema (for physical stores)
export function generateLocalBusinessSchema(store: {
  name: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  phone: string
  hours: string[]
  geo?: { lat: number; lng: number }
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address.street,
      addressLocality: store.address.city,
      addressRegion: store.address.state,
      postalCode: store.address.postalCode,
      addressCountry: store.address.country,
    },
    telephone: store.phone,
    openingHours: store.hours,
    ...(store.geo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: store.geo.lat,
        longitude: store.geo.lng,
      },
    }),
  }
}

// Article/Blog schema
export function generateArticleSchema(article: {
  title: string
  description: string
  author: string
  publishedAt: Date
  modifiedAt?: Date
  image: string
  url: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
    datePublished: article.publishedAt.toISOString(),
    dateModified: (article.modifiedAt || article.publishedAt).toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
  }
}

// Review schema
export function generateReviewSchema(review: {
  author: string
  rating: number
  reviewBody: string
  datePublished: Date
  productName: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.author,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished.toISOString(),
    itemReviewed: {
      "@type": "Product",
      name: review.productName,
    },
  }
}
