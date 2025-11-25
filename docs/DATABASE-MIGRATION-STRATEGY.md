# Database Migration Strategy

## Overview

Comprehensive database migration strategy for production deployment and ongoing schema changes using Prisma Migrate.

**Database**: PostgreSQL 15+ (Neon)
**ORM**: Prisma
**Migration Tool**: Prisma Migrate
**Last Updated**: November 25, 2025

---

## 1. Migration Process Overview

```
Development → Staging → Production

1. Schema changes in dev → Create migration
2. Test migration in dev → Verify data integrity
3. Deploy to staging → Test with staging data
4. Backup production → Create full backup
5. Deploy to production → Run migration
6. Verify production → Check data integrity
7. Monitor → Watch for issues
```

---

## 2. Development Workflow

### Creating a New Migration

```bash
# 1. Update schema.prisma with your changes
vim prisma/schema.prisma

# 2. Create migration (development)
npm run db:migrate:dev

# This runs: prisma migrate dev --name descriptive-migration-name
# Example names:
# - add-user-profile-table
# - add-product-stock-field
# - create-coupon-indexes

# 3. Review generated migration file
cat prisma/migrations/YYYYMMDDHHMMSS_migration-name/migration.sql

# 4. Test the migration works
npm run db:reset  # Resets and reapplies all migrations

# 5. Test application with new schema
npm run dev
```

### Migration Naming Convention

```
add-*        → Adding new tables/columns
remove-*     → Removing tables/columns
update-*     → Modifying existing structures
create-*     → Creating indexes/constraints
fix-*        → Fixing data issues
migrate-*    → Data migrations
```

---

## 3. Staging Deployment

### Before Staging Deployment

```bash
# 1. Ensure all migrations are committed
git status

# 2. Check for pending migrations
npm run db:migrate:status

# 3. Create staging backup (if data exists)
pg_dump $STAGING_DATABASE_URL > staging-backup-$(date +%Y%m%d-%H%M%S).sql
```

### Deploy to Staging

```bash
# 1. Deploy code to staging (Vercel)
git push origin staging

# 2. Run migrations on staging database
# Method A: Via Vercel build command (automatic)
# Method B: Manual (if needed)
npx prisma migrate deploy --schema=./prisma/schema.prisma

# 3. Verify staging deployment
curl https://staging.yourdomain.com/api/health
```

### Staging Testing Checklist

```
Manual Testing:
□ Application starts without errors
□ Database connection successful
□ All API endpoints working
□ Data integrity maintained
□ New features work as expected
□ Existing features not broken
□ Performance acceptable

Automated Testing:
□ Run integration tests
□ Run E2E tests
□ Check database query performance
```

---

## 4. Production Deployment

### Pre-Production Checklist

```
Critical Checks:
□ All tests passing in staging
□ Migration tested in staging
□ Rollback procedure documented
□ Backup strategy confirmed
□ Downtime window scheduled (if needed)
□ Team notified of deployment
□ Database backup completed
□ Monitoring dashboards ready

Risk Assessment:
□ Migration is reversible?
□ Data loss risk: LOW/MEDIUM/HIGH
□ Downtime required: YES/NO (estimated: __ minutes)
□ Rollback time: __ minutes
```

### Production Backup

```bash
# 1. Create full database backup
pg_dump $DATABASE_URL > production-backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Verify backup file
ls -lh production-backup-*.sql

# 3. Upload backup to S3 (recommended)
aws s3 cp production-backup-*.sql s3://your-backup-bucket/$(date +%Y/%m/%d)/

# 4. Test backup can be restored (in isolated environment)
createdb test_restore
psql test_restore < production-backup-YYYYMMDD-HHMMSS.sql
dropdb test_restore
```

### Production Migration

```bash
# Option 1: Automatic via Vercel deployment
git push origin main
# Vercel runs: prisma generate && prisma migrate deploy && next build

# Option 2: Manual migration (more control)
# 2a. Deploy code first (without running migrations)
git push origin main

# 2b. Run migration manually after deployment succeeds
npx prisma migrate deploy

# 2c. Verify migration success
npx prisma migrate status
```

### Post-Migration Verification

```bash
# 1. Check application health
curl https://yourdomain.com/api/health

# 2. Verify database schema
npx prisma db pull
# Compare with schema.prisma - should match

# 3. Check for errors in logs
# (Check Vercel/Sentry dashboards)

# 4. Verify data integrity
# Run custom data verification queries

# 5. Monitor performance
# Check Neon dashboard for slow queries
```

---

## 5. Rollback Procedures

### When to Rollback

```
Critical Issues:
- Data corruption detected
- Migration failed partially
- Application crashes post-migration
- Performance degradation > 50%
- Data loss occurred

Minor Issues (Fix Forward):
- Minor bugs in new features
- Performance degradation < 20%
- Non-critical functionality broken
```

### Rollback Options

#### Option 1: Code Rollback (No Schema Changes)

```bash
# 1. Revert to previous Vercel deployment
# (Use Vercel dashboard: Deployments → Previous → Promote to Production)

# 2. Verify rollback
curl https://yourdomain.com/api/health

# Estimated time: < 5 minutes
```

#### Option 2: Database Rollback (Schema Changed)

```bash
# 1. Stop application (prevent writes)
# (Set maintenance mode or disable Vercel deployment)

# 2. Restore database from backup
psql $DATABASE_URL < production-backup-YYYYMMDD-HHMMSS.sql

# 3. Reset Prisma migrations table
psql $DATABASE_URL -c "DELETE FROM _prisma_migrations WHERE finished_at > 'TIMESTAMP_BEFORE_BAD_MIGRATION';"

# 4. Deploy previous code version
# (Use Vercel dashboard to revert)

# 5. Verify application
curl https://yourdomain.com/api/health

# Estimated time: 15-30 minutes
```

#### Option 3: Manual Revert Migration

```bash
# 1. Create revert migration SQL
# Example: If added column, create migration to remove it
cat > prisma/migrations/YYYYMMDD_revert_migration/migration.sql << EOF
ALTER TABLE "Product" DROP COLUMN "newField";
EOF

# 2. Apply revert migration
npx prisma migrate resolve --applied YYYYMMDD_revert_migration
npx prisma migrate deploy

# 3. Update schema.prisma to match reverted state
vim prisma/schema.prisma

# 4. Verify
npx prisma db pull
```

---

## 6. Complex Migrations

### Adding a Non-Nullable Column

```sql
-- Problem: Can't add non-nullable column to table with data

-- Solution: Multi-step migration

-- Step 1: Add nullable column
ALTER TABLE "Product" ADD COLUMN "newField" TEXT;

-- Step 2: Populate with default values (separate script)
UPDATE "Product" SET "newField" = 'default-value' WHERE "newField" IS NULL;

-- Step 3: Make column non-nullable
ALTER TABLE "Product" ALTER COLUMN "newField" SET NOT NULL;
```

### Renaming a Column with Data

```sql
-- Step 1: Add new column
ALTER TABLE "Product" ADD COLUMN "newName" TEXT;

-- Step 2: Copy data
UPDATE "Product" SET "newName" = "oldName";

-- Step 3: Drop old column (after verifying data)
ALTER TABLE "Product" DROP COLUMN "oldName";
```

### Large Data Migration

```sql
-- Problem: Migration takes too long, times out

-- Solution: Batch processing

DO $$
DECLARE
    batch_size INT := 1000;
    offset_val INT := 0;
    rows_affected INT;
BEGIN
    LOOP
        UPDATE "Product"
        SET "newField" = calculate_value("oldField")
        WHERE "id" IN (
            SELECT "id" FROM "Product"
            WHERE "newField" IS NULL
            LIMIT batch_size
            OFFSET offset_val
        );

        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        EXIT WHEN rows_affected = 0;

        offset_val := offset_val + batch_size;
        COMMIT;

        -- Add delay to avoid overwhelming database
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;
```

---

## 7. Migration Scripts

### Custom Migration Script Template

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration...");

  // Get count
  const total = await prisma.product.count();
  console.log(`Total products to migrate: ${total}`);

  // Batch process
  const batchSize = 100;
  let processed = 0;

  while (processed < total) {
    const products = await prisma.product.findMany({
      skip: processed,
      take: batchSize,
      where: {
        // Add condition for rows that need migration
        newField: null,
      },
    });

    for (const product of products) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          newField: calculateNewValue(product),
        },
      });
    }

    processed += products.length;
    console.log(`Processed ${processed}/${total} products`);
  }

  console.log("Migration complete!");
}

function calculateNewValue(product: any): string {
  // Custom logic here
  return "calculated-value";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Data Migration Script

```bash
# 1. Test in development first
npm run db:reset
npx tsx scripts/migrate-data.ts

# 2. Test in staging
npx tsx scripts/migrate-data.ts

# 3. Run in production (with monitoring)
npx tsx scripts/migrate-data.ts > migration-log-$(date +%Y%m%d).log 2>&1
```

---

## 8. Zero-Downtime Migrations

### Strategy for Large Tables

```
Phase 1: Prepare
- Add new column/table
- Keep old structure
- Deploy code that writes to both

Phase 2: Migrate
- Copy existing data (background job)
- Verify data integrity

Phase 3: Switch
- Deploy code that reads from new structure
- Monitor for issues

Phase 4: Cleanup
- Remove old column/table
- Remove dual-write code
```

### Example: Renaming a Table

```typescript
// Phase 1: Create new table (no downtime)
model NewProduct {
  id String @id
  // ... all fields
}

// Code writes to both tables
await prisma.product.create(data);
await prisma.newProduct.create(data);

// Phase 2: Background migration script copies existing data
// (Can take hours/days for large tables)

// Phase 3: Switch reads to new table
// Code now reads from NewProduct only

// Phase 4: Drop old table
// Remove Product model from schema
```

---

## 9. Monitoring & Validation

### Post-Migration Checks

```sql
-- 1. Count records in key tables
SELECT
  'products' as table_name,
  COUNT(*) as count
FROM "Product"
UNION ALL
SELECT 'orders', COUNT(*) FROM "Order"
UNION ALL
SELECT 'users', COUNT(*) FROM "User";

-- 2. Check for NULL values in non-nullable columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Product'
  AND is_nullable = 'NO'
  AND column_default IS NULL;

-- 3. Verify foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- 4. Check for orphaned records
SELECT p.*
FROM "Product" p
LEFT JOIN "Category" c ON p."categoryId" = c.id
WHERE c.id IS NULL;
```

### Automated Validation Script

```typescript
// scripts/validate-migration.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function validateMigration() {
  console.log("Running post-migration validation...");

  const checks = {
    productCount: await prisma.product.count(),
    orderCount: await prisma.order.count(),
    userCount: await prisma.user.count(),
    orphanedProducts: await prisma.product.count({
      where: { category: null },
    }),
  };

  console.log("Validation Results:", checks);

  if (checks.orphanedProducts > 0) {
    console.error("❌ Found orphaned products!");
    process.exit(1);
  }

  console.log("✅ All validations passed");
}

validateMigration();
```

---

## 10. Emergency Procedures

### Database is Down

```bash
# 1. Check Neon dashboard status
# 2. Check connection string is correct
# 3. Check database isn't suspended (free tier)
# 4. Contact Neon support

# If critical, restore from backup to new instance
neon projects create --name emergency-restore
neon databases create --project-id PROJECT_ID
psql $NEW_DATABASE_URL < production-backup.sql
# Update DATABASE_URL in Vercel
```

### Migration Stuck/Running Too Long

```bash
# 1. Check active queries
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# 2. Kill long-running migration (if safe)
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE '%ALTER TABLE%' AND state = 'active';"

# 3. Rollback to previous state
# (Follow rollback procedures above)
```

---

## 11. Best Practices

### DO

- ✅ Always backup before migrations
- ✅ Test migrations in staging first
- ✅ Use descriptive migration names
- ✅ Keep migrations small and focused
- ✅ Document complex migrations
- ✅ Verify data integrity after migration
- ✅ Monitor performance post-migration
- ✅ Have rollback plan ready

### DON'T

- ❌ Run migrations directly on production without testing
- ❌ Skip backups "because it's a small change"
- ❌ Delete data without backup
- ❌ Mix schema and data migrations
- ❌ Run migrations during peak hours
- ❌ Ignore migration warnings
- ❌ Deploy large migrations without downtime plan
- ❌ Forget to communicate with team

---

## 12. Useful Commands Reference

```bash
# Prisma Migrate Commands
npm run db:migrate:dev         # Create and apply migration (dev)
npm run db:migrate:deploy      # Apply migrations (prod)
npm run db:migrate:status      # Check migration status
npm run db:migrate:resolve     # Resolve migration issues
npm run db:reset               # Reset database (dev only!)
npm run db:push                # Push schema without migration (dev prototyping)
npm run db:pull                # Pull schema from database
npm run db:seed                # Run seed data

# PostgreSQL Commands
pg_dump $DATABASE_URL > backup.sql                    # Backup
psql $DATABASE_URL < backup.sql                       # Restore
psql $DATABASE_URL -c "SELECT version();"             # Check version
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations;"  # Check migrations
```

---

## 13. Migration History Template

```markdown
## Migration Log

### 2025-11-25: Add User Profile Fields

**Migration**: 20251125120000_add_user_profile_fields
**Applied**: 2025-11-25 12:00:00 UTC
**Duration**: 2.3 seconds
**Downtime**: None
**Rollback**: Not needed

**Changes**:

- Added `phone` field to User table
- Added `bio` field to User table
- Created index on `phone` field

**Issues**: None
**Status**: ✅ Successful
```

---

## Sign-off

Migration strategy reviewed and approved by:

**Technical Lead**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Database Admin**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**DevOps Lead**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Last Updated**: November 25, 2025
**Next Review**: Before next major migration

---

**Emergency Contacts**:

- Neon Support: https://neon.tech/docs/introduction/support
- Database Expert: [Name] - [Contact]
- On-call Engineer: [Phone]
