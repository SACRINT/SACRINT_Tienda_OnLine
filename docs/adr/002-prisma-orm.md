# ADR 002: Use Prisma as ORM for Database Access

**Status**: Accepted
**Date**: 2025-11-01
**Decision Makers**: Technical Lead, Database Team
**Tags**: #database #orm #architecture

---

## Context

We need to choose an ORM/database toolkit for our PostgreSQL database with these requirements:

- Type-safe database queries
- TypeScript support
- Schema migrations
- Connection pooling
- Multi-tenant data isolation
- Good performance
- Easy to maintain and test
- Strong ecosystem

## Decision

We will use **Prisma** as our ORM for database access and schema management.

## Rationale

### Pros

1. **Type Safety**: Prisma Client is fully type-safe, catching errors at compile time rather than runtime

2. **Schema-First Approach**: Declarative schema.prisma file serves as single source of truth for database structure

3. **Automatic Type Generation**: TypeScript types are automatically generated from schema

4. **Migration System**: Built-in migration tool (`prisma migrate`) with version control

5. **Query Performance**: Optimized query generation with connection pooling

6. **Developer Experience**: Excellent autocomplete and IntelliSense support

7. **Database Introspection**: Can generate schema from existing database

8. **Prisma Studio**: Visual database browser for development

9. **Active Development**: Regular updates and strong community support

10. **Next.js Integration**: Official Next.js integration and examples

### Cons

1. **Learning Curve**: Different from traditional ORMs (e.g., Sequelize, TypeORM)

2. **Query Limitations**: Some complex queries require raw SQL

3. **Bundle Size**: Larger than some alternatives

4. **Vendor Lock-in**: Switching to another ORM would require significant refactoring

### Alternatives Considered

1. **TypeORM**
   - ✅ More traditional ORM approach
   - ❌ Less type-safe than Prisma
   - ❌ More boilerplate code
   - ❌ Weaker TypeScript support

2. **Sequelize**
   - ✅ Mature and widely used
   - ❌ Poor TypeScript support
   - ❌ More verbose API
   - ❌ Weaker type safety

3. **Drizzle ORM**
   - ✅ Lightweight and fast
   - ❌ Newer, less proven in production
   - ❌ Smaller community and ecosystem

4. **Raw SQL (pg library)**
   - ✅ Maximum control and performance
   - ❌ No type safety
   - ❌ Manual migration management
   - ❌ More prone to SQL injection

## Consequences

### Positive

- Type-safe database access reduces runtime errors
- Faster development with autocomplete
- Automatic migrations reduce manual database management
- Easy to maintain database schema
- Good performance out of the box
- Excellent documentation and community

### Negative

- Team must learn Prisma-specific concepts
- Complex queries may require raw SQL escape hatch
- Committed to Prisma ecosystem (switching costly)
- Larger bundle size than minimal alternatives

### Neutral

- Need to design schema carefully (schema-first approach)
- Requires running `prisma generate` after schema changes

## Implementation

### Schema Design

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### Database Access Pattern

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Tenant Isolation

```typescript
// All queries must filter by tenantId
export async function getProducts(tenantId: string) {
  return prisma.product.findMany({
    where: { tenantId }, // CRITICAL: Always include tenant filter
  });
}
```

### Migration Workflow

```bash
# Development
npm run db:migrate:dev  # Creates and applies migration

# Production
npm run db:migrate:deploy  # Applies pending migrations
```

## Security Considerations

1. **SQL Injection Prevention**: Prisma uses parameterized queries by default
2. **Tenant Isolation**: Enforced at DAL layer, all functions require `tenantId`
3. **Connection Pooling**: Configured via connection string
4. **SSL Connections**: Enforced for production database

## Performance Optimizations

1. **Connection Pooling**: Configure optimal pool size
2. **Indexes**: Add indexes to frequently queried columns
3. **Select Fields**: Use `select` to fetch only needed fields
4. **Pagination**: Use cursor-based pagination for large datasets
5. **N+1 Prevention**: Use `include` to fetch related data in single query

## Success Metrics

- Zero SQL injection vulnerabilities
- Type errors caught at compile time
- Migration success rate > 99%
- Query performance acceptable (< 100ms for most queries)
- Developer satisfaction with DX

## Migration Path

If migration away from Prisma becomes necessary:

1. Extract all database access to DAL layer (already done)
2. Replace Prisma Client calls with new ORM
3. Migrate schema to new format
4. Update types and interfaces
5. Test thoroughly before deployment

Estimated effort: 2-3 weeks

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js + Prisma Example](https://github.com/prisma/prisma-examples/tree/latest/typescript/rest-nextjs-api-routes)

## Review Schedule

**Review Date**: 2025-05-01 (6 months after implementation)
**Review Criteria**: Performance, developer productivity, maintenance cost

---

**Last Updated**: November 1, 2025
**Supersedes**: None
**Superseded By**: None
