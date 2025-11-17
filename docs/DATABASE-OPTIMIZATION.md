# Database Optimization Guide

## Index Strategy

### Composite Indexes for Performance

```sql
-- Products table indexes
CREATE INDEX idx_products_tenant_active ON "Product"("tenantId", "isActive");
CREATE INDEX idx_products_tenant_category ON "Product"("tenantId", "categoryId");
CREATE INDEX idx_products_tenant_created ON "Product"("tenantId", "createdAt" DESC);
CREATE INDEX idx_products_sku ON "Product"("sku") WHERE "sku" IS NOT NULL;
CREATE INDEX idx_products_search ON "Product" USING gin(to_tsvector('english', "name" || ' ' || COALESCE("description", '')));

-- Orders table indexes
CREATE INDEX idx_orders_tenant_status ON "Order"("tenantId", "status");
CREATE INDEX idx_orders_tenant_created ON "Order"("tenantId", "createdAt" DESC);
CREATE INDEX idx_orders_user ON "Order"("userId");
CREATE INDEX idx_orders_number ON "Order"("orderNumber");

-- OrderItems table indexes
CREATE INDEX idx_order_items_order ON "OrderItem"("orderId");
CREATE INDEX idx_order_items_product ON "OrderItem"("productId");

-- Cart table indexes
CREATE INDEX idx_cart_user_tenant ON "Cart"("userId", "tenantId");
CREATE INDEX idx_cart_session ON "Cart"("sessionId") WHERE "sessionId" IS NOT NULL;

-- Reviews table indexes
CREATE INDEX idx_reviews_product ON "Review"("productId");
CREATE INDEX idx_reviews_user ON "Review"("userId");
CREATE INDEX idx_reviews_tenant ON "Review"("tenantId");

-- Categories table indexes
CREATE INDEX idx_categories_tenant_parent ON "Category"("tenantId", "parentId");
CREATE INDEX idx_categories_slug ON "Category"("slug");

-- Users table indexes
CREATE INDEX idx_users_email ON "User"("email");
CREATE INDEX idx_users_tenant ON "User"("tenantId");

-- Coupons table indexes
CREATE INDEX idx_coupons_tenant_active ON "Coupon"("tenantId", "isActive");
CREATE INDEX idx_coupons_code ON "Coupon"("code");
CREATE INDEX idx_coupons_expires ON "Coupon"("expiresAt") WHERE "expiresAt" IS NOT NULL;
```

## Query Optimization

### Batch Operations

Always use `findMany` with limits instead of loading all records:

```typescript
// Bad
const products = await db.product.findMany({ where: { tenantId } })

// Good
const products = await db.product.findMany({
  where: { tenantId },
  take: 100,
  skip: page * 100,
  orderBy: { createdAt: 'desc' },
})
```

### Select Only Needed Fields

```typescript
// Bad - loads all fields including large text
const products = await db.product.findMany({ where: { tenantId } })

// Good - only load needed fields
const products = await db.product.findMany({
  where: { tenantId },
  select: {
    id: true,
    name: true,
    price: true,
    stock: true,
    images: { take: 1, select: { url: true } },
  },
})
```

### Use Database Functions for Aggregations

```typescript
// Aggregate in database, not in application
const stats = await db.order.aggregate({
  where: { tenantId },
  _sum: { total: true },
  _count: true,
  _avg: { total: true },
})
```

## Backup Strategy

### Automated Backups (Neon/Vercel Postgres)

- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Location**: Neon built-in backup system
- **Restoration**: Point-in-time recovery available

### Manual Backup Script

```bash
#!/bin/bash
# backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Export database
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp "$BACKUP_FILE.gz" "s3://your-bucket/backups/"

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Restore Procedure

```bash
# 1. Download backup from S3
aws s3 cp s3://your-bucket/backups/backup_YYYYMMDD_HHMMSS.sql.gz ./

# 2. Decompress
gunzip backup_YYYYMMDD_HHMMSS.sql.gz

# 3. Restore
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 4. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Product\";"
```

## Connection Pooling

### Prisma Configuration

```typescript
// lib/db/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### Connection Limits

- **Max connections**: 20 (Neon Pro)
- **Connection timeout**: 10 seconds
- **Pool size**: 10 connections per instance

## Performance Monitoring

### Slow Query Logging

Enable in production to identify bottlenecks:

```typescript
// Enable in Prisma
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
})

prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    // Query took more than 1 second
    console.warn('Slow query detected:', {
      query: e.query,
      duration: e.duration,
      params: e.params,
    })
  }
})
```

### Database Metrics to Monitor

- Connection pool usage
- Average query time
- Slow queries (> 1s)
- Database size growth
- Index usage statistics

## Maintenance Tasks

### Weekly

- Analyze query performance
- Review slow query logs
- Check index usage

### Monthly

- Vacuum database (automatic in Neon)
- Analyze table statistics
- Review backup integrity
- Archive old data if needed

### Quarterly

- Review and optimize indexes
- Analyze data growth patterns
- Plan capacity upgrades if needed
