# Performance Optimization Guide

## Database Indexes Strategy

### Current Status
The application has basic indexes on:
- `tenantId` across all tenant-scoped tables
- Primary keys and unique constraints
- Foreign key relationships

### Recommended Additional Indexes

#### 1. Product Search Optimization
```prisma
model Product {
  // Existing indexes:
  @@index([tenantId])
  @@index([categoryId])
  @@index([published])
  @@index([featured])

  // Add these for search performance:
  @@index([tenantId, published, featured]) // Composite for homepage queries
  @@index([tenantId, categoryId, published]) // Category browsing
  @@index([tenantId, basePrice]) // Price sorting
  @@index([tenantId, createdAt]) // Latest products
  @@index([stock]) // Low stock alerts
}
```

#### 2. Order Query Optimization
```prisma
model Order {
  // Existing indexes:
  @@index([tenantId])
  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])

  // Add these for analytics:
  @@index([tenantId, status, createdAt]) // Orders dashboard
  @@index([tenantId, paymentStatus, total]) // Revenue reports
  @@index([userId, status]) // User order history
  @@index([couponCode]) // Coupon usage tracking
}
```

#### 3. Coupon Performance
```prisma
model Coupon {
  // Existing indexes:
  @@index([tenantId])
  @@index([expiresAt])

  // Add these:
  @@index([tenantId, code]) // Fast coupon lookups (already unique)
  @@index([tenantId, expiresAt, isActive]) // Active coupon lists
}
```

#### 4. Search Facets Optimization
```prisma
model Category {
  @@index([tenantId, parentId]) // Subcategory queries
}

model Review {
  @@index([productId, status, rating]) // Rating aggregations
  @@index([userId, productId]) // User reviews check
}
```

## Query Optimization Techniques

### 1. N+1 Query Prevention
**Problem**: Loading products with categories in a loop
```typescript
// Bad
const products = await db.product.findMany()
for (const product of products) {
  product.category = await db.category.findUnique({ where: { id: product.categoryId }})
}

// Good
const products = await db.product.findMany({
  include: {
    category: true,
  }
})
```

### 2. Selective Field Loading
**Problem**: Loading entire models when only few fields needed
```typescript
// Bad
const orders = await db.order.findMany({
  include: {
    items: {
      include: {
        product: true, // Loads all product fields
      }
    }
  }
})

// Good
const orders = await db.order.findMany({
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    }
  }
})
```

### 3. Pagination Best Practices
**Problem**: Loading all results at once
```typescript
// Bad
const products = await db.product.findMany({
  where: { tenantId }
})

// Good
const products = await db.product.findMany({
  where: { tenantId },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})
```

### 4. Connection Pooling
PostgreSQL connection pool size should be configured based on concurrent users:
```
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20"
```

Recommended pool sizes:
- Development: 5-10
- Staging: 10-20
- Production: 20-50 (based on traffic)

## Caching Strategy

### 1. API Response Caching
Use Next.js built-in caching for static or slowly-changing data:

```typescript
// Category list (changes rarely)
export const revalidate = 3600 // 1 hour

export async function GET() {
  const categories = await getCategories()
  return NextResponse.json(categories)
}
```

### 2. Product Listing Cache
```typescript
// Products page
export const revalidate = 300 // 5 minutes

// Featured products
export const revalidate = 600 // 10 minutes
```

### 3. Database Query Cache
For frequently accessed data:
- Featured products
- Active categories
- Store settings

Consider Redis for production:
```typescript
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

async function getCachedProducts(tenantId: string) {
  const cacheKey = `products:featured:${tenantId}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const products = await db.product.findMany({
    where: { tenantId, featured: true, published: true }
  })

  await redis.set(cacheKey, JSON.stringify(products), 'EX', 300)
  return products
}
```

## Image Optimization

### 1. Use Next.js Image Component
```tsx
import Image from 'next/image'

<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  loading="lazy"
  quality={85}
/>
```

### 2. Serve Multiple Sizes
Generate thumbnails during upload:
- Thumbnail: 200x200
- Medium: 600x600
- Large: 1200x1200
- Original: As uploaded (max 2000x2000)

### 3. Use CDN
Vercel Blob Storage automatically provides CDN, but you can also use:
- Cloudflare Images
- AWS CloudFront
- Cloudinary

## Search Performance

### 1. Full-Text Search with PostgreSQL
For production, implement PostgreSQL full-text search:
```sql
-- Add tsvector column
ALTER TABLE products ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX products_search_idx ON products USING gin(search_vector);

-- Auto-update trigger
CREATE TRIGGER products_search_update
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description);
```

Prisma query:
```typescript
const products = await db.$queryRaw`
  SELECT * FROM products
  WHERE search_vector @@ plainto_tsquery('english', ${query})
  AND tenant_id = ${tenantId}
  ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC
  LIMIT ${limit}
`
```

### 2. Search Index Services
For advanced features:
- Algolia (managed, expensive)
- Meilisearch (self-hosted, fast)
- Elasticsearch (powerful, complex)

## Monitoring

### 1. Query Performance Monitoring
```typescript
// Log slow queries
const startTime = Date.now()
const result = await db.product.findMany()
const duration = Date.now() - startTime

if (duration > 1000) {
  console.warn(`Slow query detected: ${duration}ms`)
}
```

### 2. Prisma Query Logging
```typescript
// In production
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
})

prisma.$on('warn', (e) => {
  console.warn(e)
})
```

### 3. APM Tools
- Vercel Analytics (free tier available)
- New Relic
- DataDog
- Sentry for error tracking

## Load Testing Results

### Expected Performance (with optimizations)

#### Product Listing
- 100 products: < 50ms
- 1,000 products: < 100ms (paginated)
- 10,000 products: < 150ms (paginated)

#### Search
- Simple search: < 100ms
- Faceted search: < 200ms
- Full-text search: < 50ms (with PostgreSQL FTS)

#### Checkout
- Cart validation: < 100ms
- Order creation: < 200ms
- Payment intent: < 500ms (includes Stripe API)

## Action Items

### Priority 1 (Immediate)
- [ ] Add composite indexes for product search
- [ ] Implement selective field loading in all queries
- [ ] Add connection pooling configuration
- [ ] Enable Next.js caching on product routes

### Priority 2 (This Sprint)
- [ ] Implement query performance monitoring
- [ ] Add Redis for session and cache storage
- [ ] Optimize image loading with Next/Image

### Priority 3 (Future)
- [ ] Migrate to PostgreSQL full-text search
- [ ] Implement CDN for all static assets
- [ ] Add APM monitoring
- [ ] Load testing with 1000+ concurrent users

## Testing Performance

### Local Testing
```bash
# Install autocannon for load testing
npm install -g autocannon

# Test product listing endpoint
autocannon -c 10 -d 30 http://localhost:3000/api/products

# Test search endpoint
autocannon -c 10 -d 30 "http://localhost:3000/api/search?q=test"
```

### Metrics to Track
- P50 latency (median)
- P95 latency (95th percentile)
- P99 latency (99th percentile)
- Error rate
- Throughput (requests/second)

### Targets
- P95 < 200ms for API endpoints
- P99 < 500ms for API endpoints
- Error rate < 0.1%
- Can handle 100 concurrent users

---

**Last Updated**: Week 4
**Status**: Recommendations documented, implementation pending
