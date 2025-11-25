# Architecture Overview

## System Architecture

SACRINT Tienda Online is a multi-tenant e-commerce SaaS platform built with modern web technologies.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router │ React 18 │ TypeScript │ Tailwind CSS  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│  API Routes │ Server Components │ Server Actions │ Middleware│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Auth │ Products │ Orders │ Payments │ Search │ Analytics   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
├─────────────────────────────────────────────────────────────┤
│     PostgreSQL │ Redis │ Cloudinary │ Stripe │ Algolia      │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Next.js 14**: React framework with App Router
- **React 18**: UI library with Server Components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Zustand**: Client state management
- **React Query**: Server state management

### Backend

- **Next.js API Routes**: REST API endpoints
- **Prisma**: Database ORM
- **NextAuth.js v5**: Authentication
- **Zod**: Schema validation

### Database

- **PostgreSQL 15**: Primary database (Neon)
- **Redis**: Caching and sessions

### External Services

- **Stripe**: Payment processing
- **Resend**: Transactional email
- **Cloudinary**: Image storage
- **Algolia**: Product search
- **Sentry**: Error tracking

## Multi-Tenancy

The platform supports multiple stores (tenants) with complete data isolation.

### Tenant Isolation

Every database query includes tenant filtering:

```typescript
const products = await db.product.findMany({
  where: {
    tenantId: currentTenant, // Always required
    ...filters,
  },
});
```

### Tenant Resolution

1. Subdomain: `store-name.example.com`
2. Custom domain: `custom-domain.com`
3. Path-based: `example.com/stores/store-name`

## Authentication

### Auth Flow

```
User → NextAuth → Provider (Google) → Session → Database
```

### Session Management

- HTTP-only cookies
- Session renewal on activity
- Multi-device support

### RBAC

Three roles with granular permissions:

- **SUPER_ADMIN**: Platform administration
- **STORE_OWNER**: Store management
- **CUSTOMER**: Shopping

## Data Models

### Core Entities

```
Tenant
├── Users
├── Products
│   ├── Variants
│   └── Images
├── Categories
├── Orders
│   └── OrderItems
├── Customers
└── Reviews
```

### Key Relationships

- Tenant has many Users, Products, Orders
- Product belongs to Category
- Product has many Variants, Images, Reviews
- Order has many OrderItems
- Customer has many Orders, Addresses

## API Design

### RESTful Endpoints

```
GET    /api/products          # List products
POST   /api/products          # Create product
GET    /api/products/:id      # Get product
PUT    /api/products/:id      # Update product
DELETE /api/products/:id      # Delete product
```

### Response Format

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

## Caching Strategy

### Cache Layers

1. **Browser Cache**: Static assets
2. **CDN Cache**: Images, CSS, JS
3. **Application Cache**: Redis/In-memory
4. **Database Cache**: Query cache

### Cache Invalidation

- Event-driven invalidation
- TTL-based expiration
- Pattern-based clearing

## Security

### Layers

1. **Input Validation**: Zod schemas
2. **Authentication**: NextAuth.js
3. **Authorization**: RBAC
4. **Rate Limiting**: Per-endpoint limits
5. **CSRF Protection**: Tokens
6. **XSS Prevention**: Sanitization
7. **SQL Injection**: Prisma ORM

### Headers

```
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
X-Frame-Options
```

## Performance

### Optimizations

- Server Components (reduced JS)
- Image optimization (next/image)
- Code splitting (dynamic imports)
- Database indexing
- Query batching (DataLoader)
- Caching (Redis)

### Targets

- FCP < 1.5s
- LCP < 2.5s
- TBT < 200ms
- CLS < 0.1

## Scalability

### Horizontal Scaling

- Stateless application servers
- Shared database (connection pooling)
- Shared cache (Redis)
- CDN for static assets

### Vertical Scaling

- Database optimization
- Query optimization
- Cache sizing

## Monitoring

### Observability

- **Metrics**: Prometheus/Grafana
- **Logs**: Structured logging
- **Traces**: Request tracing
- **Errors**: Sentry

### Alerts

- Error rate thresholds
- Response time thresholds
- Resource usage
- Business metrics

## Deployment

### Pipeline

```
Code → Lint → Test → Build → Deploy → Verify
```

### Environments

- **Development**: Local
- **Staging**: Preview deployments
- **Production**: Vercel

## Directory Structure

```
src/
├── app/                 # Next.js app router
│   ├── (auth)/         # Auth pages
│   ├── (store)/        # Store pages
│   ├── (dashboard)/    # Admin pages
│   └── api/            # API routes
├── components/
│   ├── ui/             # Base components
│   ├── store/          # Store components
│   └── admin/          # Admin components
├── lib/
│   ├── db/             # Database
│   ├── auth/           # Authentication
│   ├── security/       # Security
│   ├── integrations/   # External services
│   ├── monitoring/     # Observability
│   └── i18n/           # Internationalization
├── hooks/              # React hooks
├── types/              # TypeScript types
└── locales/            # Translations
```

## Design Principles

1. **Type Safety**: TypeScript everywhere
2. **Validation**: Zod schemas
3. **Tenant Isolation**: Always filter by tenant
4. **Security First**: Defense in depth
5. **Performance**: Optimize by default
6. **Maintainability**: Clear structure
7. **Testability**: Modular design
