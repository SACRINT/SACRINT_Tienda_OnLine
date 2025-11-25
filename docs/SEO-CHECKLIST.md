# SEO Final Checklist

## Overview

Comprehensive SEO checklist ensuring the e-commerce platform is optimized for search engines.

**Audit Date**: November 25, 2025  
**Target**: Google Search Console, Bing Webmaster Tools  
**Goal**: Lighthouse SEO Score > 90

---

## 1. On-Page SEO

### Title Tags

#### Requirements

- [ ] Every page has unique title
- [ ] Length: 50-60 characters
- [ ] Primary keyword included
- [ ] Brand name at end
- [ ] Format: Primary Keyword - Secondary | Brand

#### Examples

```html
<!-- Good -->
<title>Blue Running Shoes - Men's Athletic Footwear | StoreName</title>
<title>Wireless Headphones - Bluetooth Audio | StoreName</title>

<!-- Bad -->
<title>Product Page</title>
<!-- Not descriptive -->
<title>Buy the Best Blue Running Shoes for Men at Great Prices Online Today</title>
<!-- Too long -->
```

#### Page-Specific Titles

- [ ] Home: "Brand | Tagline/Primary Keywords"
- [ ] Shop: "Product Category | Brand"
- [ ] Product: "Product Name - Key Feature | Brand"
- [ ] Cart: "Shopping Cart | Brand"
- [ ] Checkout: "Secure Checkout | Brand"

### Meta Descriptions

#### Requirements

- [ ] Every page has unique description
- [ ] Length: 150-160 characters
- [ ] Compelling, actionable copy
- [ ] Includes primary keyword
- [ ] Call-to-action included

#### Examples

```html
<!-- Good -->
<meta
  name="description"
  content="Shop premium blue running shoes with superior cushioning. Free shipping on orders over $50. 30-day returns. Order now!"
/>

<!-- Bad -->
<meta name="description" content="Running shoes" />
```

### Headings (H1-H6)

#### Requirements

- [ ] One H1 per page
- [ ] H1 contains primary keyword
- [ ] Proper hierarchy (H1 > H2 > H3)
- [ ] Descriptive, not generic
- [ ] No skipped levels

#### Structure

```html
<h1>Blue Running Shoes for Men</h1>
<h2>Product Features</h2>
<h3>Cushioning Technology</h3>
<h3>Breathable Materials</h3>
<h2>Size Guide</h2>
<h2>Customer Reviews</h2>
```

### URLs

#### Requirements

- [ ] Readable and descriptive
- [ ] Lowercase only
- [ ] Hyphens separate words (not underscores)
- [ ] Short and concise
- [ ] Include keywords
- [ ] No unnecessary parameters

#### Examples

```
✅ /shop/mens-running-shoes
✅ /products/blue-nike-air-max
✅ /category/athletic-wear

❌ /product.php?id=12345
❌ /shop/MENS_RUNNING_SHOES
❌ /p/abc123xyz
```

### Internal Linking

- [ ] Breadcrumb navigation on all pages
- [ ] Related products linked
- [ ] Category pages link to products
- [ ] Products link back to categories
- [ ] Anchor text descriptive (not "click here")
- [ ] No broken links (404s)

#### Breadcrumbs

```html
<nav aria-label="Breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/">
        <span itemprop="name">Home</span>
      </a>
      <meta itemprop="position" content="1" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/shop">
        <span itemprop="name">Shop</span>
      </a>
      <meta itemprop="position" content="2" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name">Blue Running Shoes</span>
      <meta itemprop="position" content="3" />
    </li>
  </ol>
</nav>
```

### Image Optimization

#### Alt Text

- [ ] All images have alt attributes
- [ ] Descriptive, include keywords naturally
- [ ] Decorative images: alt=""
- [ ] No "image of" or "picture of"

```html
<!-- Good -->
<img src="blue-nike-shoes.jpg" alt="Nike Air Max blue running shoes with white swoosh" />

<!-- Bad -->
<img src="img123.jpg" alt="shoes" />
<img src="banner.jpg" alt="Image of our products" />
```

#### File Names

- [ ] Descriptive file names
- [ ] Keywords included
- [ ] Lowercase, hyphens

```
✅ blue-nike-air-max-running-shoes.jpg
❌ IMG_1234.jpg
❌ product image.jpg
```

#### Image Sizes

- [ ] Compressed and optimized
- [ ] WebP format with fallback
- [ ] Lazy loading below fold
- [ ] Responsive srcset

### Content Quality

- [ ] Unique content (not duplicate)
- [ ] Minimum 300 words per page
- [ ] Natural keyword usage (no stuffing)
- [ ] Readability score ≥ 60 (Flesch Reading Ease)
- [ ] Clear, scannable formatting
- [ ] Bullet points and lists used

---

## 2. Technical SEO

### Robots.txt

#### Requirements

- [ ] File exists at /robots.txt
- [ ] Allows crawling of public pages
- [ ] Blocks admin/private pages
- [ ] References sitemap

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /checkout/
Disallow: /cart/

Sitemap: https://yourdomain.com/sitemap.xml
```

### XML Sitemap

#### Requirements

- [ ] Sitemap exists at /sitemap.xml
- [ ] Includes all public pages
- [ ] Priority values set correctly
- [ ] Change frequency accurate
- [ ] Submitted to Google Search Console

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2025-11-25</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/shop</loc>
    <lastmod>2025-11-25</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Products -->
  <url>
    <loc>https://yourdomain.com/products/blue-running-shoes</loc>
    <lastmod>2025-11-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Canonical Tags

- [ ] Every page has canonical URL
- [ ] Self-referencing canonical on unique pages
- [ ] Variants/filters point to main page

```html
<link rel="canonical" href="https://yourdomain.com/products/blue-running-shoes" />
```

### Structured Data (Schema.org)

#### Product Schema

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Blue Running Shoes",
    "image": "https://yourdomain.com/images/blue-shoes.jpg",
    "description": "Premium blue running shoes with superior cushioning",
    "sku": "BLUE-SHOE-001",
    "brand": {
      "@type": "Brand",
      "name": "Nike"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://yourdomain.com/products/blue-running-shoes",
      "priceCurrency": "MXN",
      "price": "1299.00",
      "priceValidUntil": "2025-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "127"
    }
  }
</script>
```

#### Organization Schema

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "StoreName",
    "url": "https://yourdomain.com",
    "logo": "https://yourdomain.com/logo.png",
    "sameAs": [
      "https://www.facebook.com/storename",
      "https://www.instagram.com/storename",
      "https://twitter.com/storename"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+52-555-123-4567",
      "contactType": "Customer Service",
      "email": "support@yourdomain.com"
    }
  }
</script>
```

#### Breadcrumb Schema

(See Breadcrumbs section above)

### Page Speed

- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1
- [ ] Speed Index < 3.4s

### Mobile-Friendliness

- [ ] Responsive design
- [ ] Mobile-friendly test passes
- [ ] No horizontal scrolling
- [ ] Touch targets ≥ 48x48px
- [ ] Readable font sizes

### HTTPS

- [ ] SSL certificate valid
- [ ] All pages served over HTTPS
- [ ] Mixed content warnings resolved
- [ ] HTTP redirects to HTTPS

### Hreflang (if multi-language)

```html
<link
  rel="alternate"
  hreflang="es-MX"
  href="https://yourdomain.com/es-mx/products/zapatos-azules"
/>
<link rel="alternate" hreflang="en-US" href="https://yourdomain.com/en-us/products/blue-shoes" />
<link rel="alternate" hreflang="x-default" href="https://yourdomain.com/products/blue-shoes" />
```

---

## 3. Off-Page SEO

### Social Meta Tags

#### Open Graph (Facebook)

```html
<meta property="og:title" content="Blue Running Shoes - Men's Athletic Footwear" />
<meta
  property="og:description"
  content="Shop premium blue running shoes. Free shipping over $50."
/>
<meta property="og:image" content="https://yourdomain.com/images/blue-shoes-og.jpg" />
<meta property="og:url" content="https://yourdomain.com/products/blue-running-shoes" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="StoreName" />
```

#### Twitter Card

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Blue Running Shoes - Men's Athletic Footwear" />
<meta
  name="twitter:description"
  content="Shop premium blue running shoes. Free shipping over $50."
/>
<meta name="twitter:image" content="https://yourdomain.com/images/blue-shoes-tw.jpg" />
<meta name="twitter:site" content="@storename" />
```

### Backlinks (Future)

- [ ] Quality over quantity
- [ ] Relevant industry sites
- [ ] Avoid spammy directories
- [ ] Guest blogging opportunities
- [ ] Influencer partnerships

---

## 4. Local SEO (if applicable)

### Google Business Profile

- [ ] Claimed and verified
- [ ] Complete business information
- [ ] Operating hours accurate
- [ ] Photos uploaded
- [ ] Reviews responded to

### NAP Consistency

- [ ] Name, Address, Phone consistent
- [ ] Across website, Google, social media
- [ ] Schema.org LocalBusiness markup

---

## 5. Content Strategy

### Blog/Content (Future Enhancement)

- [ ] Regular content publishing
- [ ] Keyword-optimized articles
- [ ] Internal linking to products
- [ ] Long-tail keyword targeting
- [ ] FAQ pages

### Product Descriptions

- [ ] Unique (not manufacturer's description)
- [ ] Keyword-rich but natural
- [ ] Features and benefits listed
- [ ] User intent addressed

---

## 6. Google Search Console

### Setup

- [ ] Property verified
- [ ] Sitemap submitted
- [ ] Coverage issues resolved
- [ ] Mobile usability issues fixed

### Monitoring

- [ ] Index coverage checked weekly
- [ ] Search queries reviewed
- [ ] Click-through rate tracked
- [ ] Position changes monitored

---

## 7. Analytics

### Google Analytics 4

- [ ] Tracking code installed
- [ ] E-commerce tracking enabled
- [ ] Conversion goals set
- [ ] Event tracking configured

### Key Metrics

- [ ] Organic traffic
- [ ] Bounce rate
- [ ] Average session duration
- [ ] Pages per session
- [ ] Conversion rate

---

## 8. Competitor Analysis

- [ ] Identify top competitors
- [ ] Analyze their keywords
- [ ] Review their backlinks
- [ ] Study content strategy
- [ ] Monitor rankings

---

## Testing Tools

### SEO Audits

- [ ] Google Lighthouse (Chrome DevTools)
- [ ] Screaming Frog SEO Spider
- [ ] Ahrefs Site Audit
- [ ] SEMrush Site Audit

### Keyword Research

- [ ] Google Keyword Planner
- [ ] Ahrefs Keywords Explorer
- [ ] Ubersuggest
- [ ] Answer The Public

### Testing

- [ ] Google Mobile-Friendly Test
- [ ] Google Page Speed Insights
- [ ] Google Rich Results Test
- [ ] Schema Markup Validator

---

## Common Issues & Fixes

### Duplicate Content

```html
<!-- Fix: Use canonical tags -->
<link rel="canonical" href="https://yourdomain.com/products/blue-shoes" />
```

### Missing Title/Description

```html
<!-- Fix: Add to every page -->
<title>Unique Page Title | Brand</title>
<meta name="description" content="Unique description" />
```

### Broken Links

```javascript
// Fix: Regular audits and 301 redirects
// Use next.config.js for redirects
module.exports = {
  async redirects() {
    return [
      {
        source: "/old-page",
        destination: "/new-page",
        permanent: true, // 301 redirect
      },
    ];
  },
};
```

### Slow Page Speed

```javascript
// Fix: Image optimization, code splitting
import Image from "next/image";
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  ssr: false,
  loading: () => <Loading />,
});
```

---

## Checklist Summary

### Critical (Must Fix Before Launch)

- [ ] All pages have title and meta description
- [ ] Robots.txt allows crawling
- [ ] Sitemap.xml exists and submitted
- [ ] HTTPS enabled
- [ ] Mobile-friendly
- [ ] Page speed acceptable
- [ ] No broken links
- [ ] Proper heading hierarchy

### Important (Fix Within 1 Week)

- [ ] Structured data implemented
- [ ] Alt text on all images
- [ ] Canonical tags set
- [ ] Social meta tags added
- [ ] Google Search Console configured
- [ ] Analytics installed

### Nice to Have (Ongoing)

- [ ] Content marketing strategy
- [ ] Backlink building
- [ ] Regular content updates
- [ ] Competitor monitoring

---

## Sign-off

- [ ] Lighthouse SEO score > 90
- [ ] All critical items completed
- [ ] Indexed in Google Search Console
- [ ] No major errors in coverage report

**Audited By**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Status**: ✅ Optimized / ⚠️ Needs Work / ❌ Failed

---

**Last Updated**: November 25, 2025  
**Next Audit**: Monthly or after major content changes
