# 🏗️ ARQUITECTURA E-COMMERCE SAAS - GUÍA TÉCNICA COMPLETA PARA ARQUITECTOS

**Versión:** 2.0 - COMPLETA Y CORREGIDA
**Fecha:** 15 de Noviembre, 2025
**Propósito:** Documento maestro con instrucciones EXACTAS para construcción sin ambigüedad
**Nivel:** ARQUITECTOS (Requiere experiencia con Node.js, React, PostgreSQL)

---

## 📑 TABLA DE CONTENIDOS

1. [Stack Tecnológico - Justificado](#1-stack-tecnológico)
2. [Principios Fundamentales](#2-principios-fundamentales)
3. [Database Schema Completo](#3-database-schema)
4. [Arquitectura de Carpetas](#4-arquitectura-de-carpetas)
5. [Sprint 0: Configuración Exacta](#5-sprint-0-configuración)
6. [Sprint 1: Autenticación + Tenants](#6-sprint-1-autenticación)
7. [Sprint 2: Productos + Categorías](#7-sprint-2-productos)
8. [Sprint 3: Carrito + Pago](#8-sprint-3-carrito-pago)
9. [Sprint 4: Post-Venta](#9-sprint-4-post-venta)
10. [Patrones de Seguridad Reutilizables](#10-patrones-seguridad)
11. [Google OAuth: Guía Completa](#11-google-oauth)
12. [Testing Strategy](#12-testing)
13. [DevOps + Deployment](#13-devops)

---

# 1. STACK TECNOLÓGICO

## Selecciones Justificadas

```
FRONTEND:
├─ Next.js 14+ (App Router)
│  ├─ SSR/SSG para SEO
│  ├─ API Routes integradas
│  ├─ Automatic code splitting
│  └─ Vercel deployment optimizado
├─ TypeScript (100% coverage)
│  ├─ Type safety en todo
│  ├─ Mejor DX
│  └─ Fewer runtime errors
├─ React 18+
│  ├─ Server components
│  ├─ Suspense boundaries
│  └─ Concurrent rendering
├─ Tailwind CSS + Shadcn/ui
│  ├─ Utility-first approach
│  ├─ Pre-built accesibles
│  └─ Fácil customización
├─ React Query (TanStack Query v4+)
│  ├─ Server state management
│  ├─ Automatic caching
│  ├─ Background sync
│  └─ Optimistic updates
├─ Zustand
│  ├─ Client state (carrito, sesión)
│  ├─ Minimal boilerplate
│  └─ DevTools integration
└─ Zod
   ├─ Schema validation
   ├─ Type inference
   └─ Runtime safety

BACKEND:
├─ Node.js 20+ LTS
├─ Next.js API Routes
│  ├─ Serverless functions
│  ├─ Automatic scaling
│  └─ CORS built-in
├─ TypeScript 5+
├─ Prisma ORM 5+
│  ├─ Type-safe queries
│  ├─ Auto migrations
│  ├─ Built-in pagination
│  └─ Relation loading
└─ NextAuth.js v5 (auth-js)
   ├─ OAuth integrations
   ├─ JWT sessions
   ├─ Refresh token flow
   └─ Middleware support

DATABASE:
├─ PostgreSQL 15+
│  ├─ ACID transactions
│  ├─ JSON support
│  ├─ Full-text search
│  └─ Row-level security
└─ Neon (managed PostgreSQL)
   ├─ Autoscaling
   ├─ Branching
   ├─ Serverless compute
   └─ Vercel integration

PAGOS:
├─ Stripe (Tarjetas)
│  ├─ PCI Level 1
│  ├─ Webhooks
│  └─ Testing mode
└─ Mercado Pago (OXXO/Transferencia)
   ├─ México focus
   ├─ QR codes
   └─ Webhooks

ENVÍOS:
├─ Skydropx
│  ├─ API de cotización
│  ├─ Generación de guías
│  └─ Tracking real-time
└─ Fallback: Mienvío

EMAIL:
├─ Resend (Transaccional)
│  ├─ React templates
│  ├─ Webhooks
│  └─ Vercel integration
└─ Mailchimp (Marketing)

INFRAESTRUCTURA:
├─ Vercel
│  ├─ Next.js deployment
│  ├─ Serverless functions
│  ├─ Edge middleware
│  └─ Analytics built-in
├─ Neon Database
├─ Stripe + Mercado Pago APIs
├─ Skydropx API
├─ Resend Email Service
└─ Cloudinary (Image optimization)

MONITOREO:
├─ Sentry (Error tracking)
├─ Vercel Analytics (Core Web Vitals)
└─ Google Analytics 4
```

---

# 2. PRINCIPIOS FUNDAMENTALES

## 2.1 SEGURIDAD-FIRST

### Validación en Todas Partes

```typescript
// SIEMPRE usar Zod en API routes
// ❌ NUNCA confiar en input del cliente

// /app/api/products/[id]/route.ts
import { z } from 'zod'

const ProductIdSchema = z.object({
  id: z.string().uuid('Invalid product ID')
})

const CreateProductSchema = z.object({
  name: z.string().min(3, 'Name required').max(255),
  description: z.string().min(10).max(5000),
  price: z.number().positive('Price must be positive'),
  sku: z.string().regex(/^[A-Z0-9-]+$/, 'Invalid SKU format'),
  stock: z.number().int().min(0),
  tenantId: z.string().uuid('Invalid tenant'),
  categoryId: z.string().uuid('Invalid category'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // VALIDAR ENTRADA
    const validation = CreateProductSchema.safeParse(body)
    if (!validation.success) {
      return Response.json(
        { error: 'Invalid data', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data
    // ... rest
  } catch (error) {
    // NUNCA exponer detalles internos
    console.error('[PRODUCT] Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### RBAC (Role-Based Access Control)

```typescript
// /lib/auth/roles.ts

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STORE_OWNER = 'STORE_OWNER',
  CUSTOMER = 'CUSTOMER',
}

export const PERMISSIONS = {
  [UserRole.SUPER_ADMIN]: [
    'admin:read-all',
    'admin:write-all',
    'tenants:manage',
    'users:manage',
  ],
  [UserRole.STORE_OWNER]: [
    'products:read',
    'products:write',
    'products:delete',
    'orders:read',
    'orders:update',
    'analytics:read',
  ],
  [UserRole.CUSTOMER]: [
    'products:read',
    'orders:read:own',
  ],
}

// Middleware de autorización reusable
export async function requirePermission(
  requiredPermission: string,
  session: any
) {
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const userPermissions = PERMISSIONS[session.user.role]

  // Permitir wildcard patterns
  const hasPermission = userPermissions.some(
    p => p === requiredPermission ||
         p.endsWith(':*') && requiredPermission.startsWith(p.replace(':*', ':'))
  )

  if (!hasPermission) {
    throw new Error('Forbidden')
  }
}
```

### Tenant Isolation (Multi-Tenant Security)

```typescript
// /lib/db/tenant.ts

/**
 * CRÍTICO: Asegurar que usuarios solo vean datos de su tenant
 * Implementar en CADA query
 */

import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

export async function getCurrentUserTenant() {
  const session = await getServerSession()

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Obtener el tenant del usuario actual
  const userTenant = await db.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true }
  })

  if (!userTenant?.tenantId) {
    throw new Error('User has no tenant')
  }

  return userTenant.tenantId
}

// Uso en queries
export async function getProductsForCurrentTenant(filters?: any) {
  const tenantId = await getCurrentUserTenant()

  return db.product.findMany({
    where: {
      tenantId, // ← SIEMPRE filtrar por tenant actual
      ...filters,
    },
  })
}
```

### CSP Headers Desde Sprint 0

```typescript
// /lib/security/csp.ts

export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.stripe.com https://api.mercadopago.com https://api.skydropx.com https://api.resend.com;
  frame-src https://js.stripe.com https://mercadopago.com;
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.trim().replace(/\n\s*/g, ' ')

// /middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request: Request) {
  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', CSP_HEADER)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Rate Limiting en Endpoints Críticos

```typescript
// /lib/security/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limit por IP para login
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
})

// Rate limit por user para checkout
export const checkoutLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 checkouts per hour per user
  analytics: true,
})

// Uso en API routes
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  const { success } = await loginLimiter.limit(ip)
  if (!success) {
    return Response.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 }
    )
  }

  // ... rest of handler
}
```

---

# 3. DATABASE SCHEMA - COMPLETO

## Prisma Schema Definitivo

```prisma
// /prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============ MULTI-TENANCY ============

model Tenant {
  id                    String   @id @default(cuid())
  name                  String
  slug                  String   @unique
  logo                  String?
  primaryColor          String   @default("#0A1128") // Azul Marino
  accentColor           String   @default("#D4AF37")  // Dorado
  domain                String?  @unique

  // Configuración de negocio
  featureFlags          Json     @default("{}")

  // Relaciones
  users                 User[]
  products              Product[]
  categories            Category[]
  orders                Order[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([slug])
  @@index([domain])
}

// ============ AUTENTICACIÓN ============

model User {
  id                    String   @id @default(cuid())
  email                 String
  emailVerified         DateTime?
  password              String?  // null si usa OAuth
  name                  String?
  image                 String?

  // Tenant & Role
  tenantId              String?  // null para SUPER_ADMIN
  role                  UserRole @default(CUSTOMER)

  // OAuth
  googleId              String?  @unique
  googleAccessToken     String?
  googleRefreshToken    String?

  // Profile
  phone                 String?
  birthDate             DateTime?
  addresses             Address[]

  // Relations
  tenant                Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  accounts              Account[]
  sessions              Session[]
  orders                Order[]
  reviews               Review[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([email, tenantId]) // Email único por tenant
  @@index([tenantId])
  @@index([role])
}

// Auth.js models
model Account {
  id                    String   @id @default(cuid())
  userId                String
  type                  String
  provider              String
  providerAccountId     String
  refresh_token         String?  @db.Text
  access_token          String?  @db.Text
  expires_at            Int?
  token_type            String?
  scope                 String?
  id_token              String?  @db.Text
  session_state         String?

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id                    String   @id @default(cuid())
  sessionToken          String   @unique
  userId                String
  expires               DateTime

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier            String
  token                 String   @unique
  expires               DateTime

  @@unique([identifier, token])
  @@index([token])
}

enum UserRole {
  SUPER_ADMIN
  STORE_OWNER
  CUSTOMER
}

// ============ PRODUCTOS ============

model Category {
  id                    String   @id @default(cuid())
  tenantId              String
  name                  String
  slug                  String
  description           String?  @db.Text
  image                 String?
  parentId              String?

  // Relations
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  parent                Category? @relation("SubCategories", fields: [parentId], references: [id], onDelete: SetNull)
  subcategories         Category[] @relation("SubCategories")
  products              Product[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([parentId])
}

model Product {
  id                    String   @id @default(cuid())
  tenantId              String
  categoryId            String

  // Info básica
  name                  String
  slug                  String
  description           String   @db.Text
  shortDescription      String?
  sku                   String

  // Precios
  basePrice             Decimal  @db.Decimal(10, 2)
  salePrice             Decimal? @db.Decimal(10, 2)
  salePriceExpiresAt    DateTime?

  // Inventario
  stock                 Int      @default(0)
  reserved              Int      @default(0) // Para órdenes pendientes de pago
  lowStockThreshold     Int      @default(5)

  // Logística
  weight                Decimal  @db.Decimal(8, 2) // kg
  length                Decimal  @db.Decimal(8, 2) // cm
  width                 Decimal  @db.Decimal(8, 2)
  height                Decimal  @db.Decimal(8, 2)

  // Metadata
  tags                  String[] @default([])
  seo                   Json     @default("{}")

  // Estados
  published             Boolean  @default(false)
  featured              Boolean  @default(false)

  // Relations
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category              Category @relation(fields: [categoryId], references: [id])
  variants              ProductVariant[]
  images                ProductImage[]
  orderItems            OrderItem[]
  reviews               Review[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([tenantId, sku])
  @@index([tenantId])
  @@index([categoryId])
  @@index([published])
  @@index([featured])
}

model ProductVariant {
  id                    String   @id @default(cuid())
  productId             String

  // Atributos
  size                  String?
  color                 String?
  model                 String?

  // Stock & Precio específico
  sku                   String
  price                 Decimal? @db.Decimal(10, 2) // null = usar price del producto
  stock                 Int

  // Media
  imageId               String?

  // Relations
  product               Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  image                 ProductImage? @relation(fields: [imageId], references: [id])
  orderItems            OrderItem[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([productId, sku])
  @@index([productId])
}

model ProductImage {
  id                    String   @id @default(cuid())
  productId             String

  url                   String
  alt                   String?
  order                 Int      @default(0)
  isVideo               Boolean  @default(false)

  // Relations
  product               Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variants              ProductVariant[]

  @@index([productId])
}

// ============ CARRITO & ÓRDENES ============

model Order {
  id                    String   @id @default(cuid())
  tenantId              String
  userId                String

  // Números únicos
  orderNumber           String   @unique // ej: ORD-2025-001234

  // Subtotales
  subtotal              Decimal  @db.Decimal(12, 2)
  shippingCost          Decimal  @db.Decimal(10, 2) @default(0)
  tax                   Decimal  @db.Decimal(10, 2)
  discount              Decimal  @db.Decimal(10, 2) @default(0)
  total                 Decimal  @db.Decimal(12, 2)

  // Dirección & Envío
  shippingAddressId     String
  billingAddressId      String?
  shippingMethod        String   @default("standard")
  trackingNumber        String?

  // Pago
  paymentMethod         PaymentMethod
  paymentStatus         PaymentStatus @default(PENDING)
  paymentId             String?  // Stripe/Mercado Pago ID

  // Estado general
  status                OrderStatus @default(PENDING)
  notes                 String?  @db.Text
  adminNotes            String?  @db.Text

  // Cupones
  couponCode            String?

  // Relations
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user                  User     @relation(fields: [userId], references: [id])
  items                 OrderItem[]
  shippingAddress       Address  @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  billingAddress        Address? @relation("BillingAddress", fields: [billingAddressId], references: [id])

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([tenantId])
  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
}

model OrderItem {
  id                    String   @id @default(cuid())
  orderId               String
  productId             String
  variantId             String?

  quantity              Int
  priceAtPurchase       Decimal  @db.Decimal(10, 2)

  // Relations
  order                 Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product               Product  @relation(fields: [productId], references: [id])
  variant               ProductVariant? @relation(fields: [variantId], references: [id])

  @@index([orderId])
  @@index([productId])
}

model Address {
  id                    String   @id @default(cuid())
  userId                String

  name                  String
  email                 String
  phone                 String

  street                String
  city                  String
  state                 String
  postalCode            String
  country               String   @default("MX")

  isDefault             Boolean  @default(false)

  // Relations
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ordersAsShipping      Order[]  @relation("ShippingAddress")
  ordersAsBilling       Order[]  @relation("BillingAddress")

  @@index([userId])
}

enum PaymentMethod {
  CREDIT_CARD
  STRIPE
  MERCADO_PAGO
  PAYPAL
  OXXO
  BANK_TRANSFER
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

enum OrderStatus {
  PENDING        // Aguardando pago
  PROCESSING     // Pagado, preparando envío
  SHIPPED        // En tránsito
  DELIVERED      // Entregado
  CANCELLED      // Cancelado
  REFUNDED       // Reembolsado
}

// ============ RESEÑAS ============

model Review {
  id                    String   @id @default(cuid())
  productId             String
  userId                String
  orderId               String?  // Compra verificada

  rating                Int      // 1-5
  title                 String
  content               String   @db.Text

  status                ReviewStatus @default(PENDING)

  // Relations
  product               Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([productId, userId]) // Un review por producto por usuario
  @@index([productId])
  @@index([userId])
  @@index([status])
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

// ============ CUPONES ============

model Coupon {
  id                    String   @id @default(cuid())
  tenantId              String

  code                  String
  description           String?

  // Tipo de descuento
  type                  CouponType // PERCENTAGE | FIXED
  value                 Decimal  @db.Decimal(10, 2)

  // Condiciones
  minPurchase           Decimal? @db.Decimal(12, 2)
  maxDiscount           Decimal? @db.Decimal(10, 2)

  // Aplicabilidad
  applicableToAll       Boolean  @default(true)
  applicableProducts    String[] @default([]) // Product IDs
  applicableCategories  String[] @default([]) // Category IDs

  // Uso
  maxUses               Int?
  usedCount             Int      @default(0)
  maxUsesPerUser        Int      @default(1)

  // Validez
  startDate             DateTime
  expiresAt             DateTime

  // Relations
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([expiresAt])
}

enum CouponType {
  PERCENTAGE
  FIXED
}
```

---

# 4. ARQUITECTURA DE CARPETAS

```
tienda-online/
├── .env.local                    # Local vars (NUNCA commitar)
├── .env.example                  # Template
├── .gitignore
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── prisma.config.ts
├── package.json
├── pnpm-lock.yaml
│
├── /app                          # Next.js App Router
│   ├── layout.tsx                # Root layout con AuthProvider
│   ├── page.tsx                  # Home page
│   ├── error.tsx                 # Error boundary
│   │
│   ├── /(auth)                   # Rutas de autenticación (no protegidas)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify-email/page.tsx
│   │
│   ├── /(store)                  # Rutas públicas de tienda
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home redirect a /shop
│   │   ├── /shop
│   │   │   ├── page.tsx          # Listado con filtros
│   │   │   ├── /[category]
│   │   │   │   ├── page.tsx      # Productos por categoría
│   │   │   │   └── /[product]
│   │   │   │       ├── page.tsx  # Detalle producto + reviews
│   │   │   │       └── loading.tsx
│   │   │   └── loading.tsx
│   │   ├── /cart
│   │   │   ├── page.tsx          # Carrito
│   │   │   └── layout.tsx
│   │   └── /checkout
│   │       ├── page.tsx          # Wizard de pago
│   │       ├── layout.tsx
│   │       └── loading.tsx
│   │
│   ├── /(dashboard)              # Rutas protegidas (STORE_OWNER + CUSTOMER)
│   │   ├── middleware.ts         # Verificar autenticación
│   │   ├── layout.tsx            # Sidebar navigation
│   │   │
│   │   ├── /account
│   │   │   ├── page.tsx          # Perfil
│   │   │   ├── orders/page.tsx   # Mis pedidos
│   │   │   ├── addresses/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── /[storeId]            # Admin solo para STORE_OWNER
│   │       ├── layout.tsx
│   │       ├── page.tsx          # Dashboard stats
│   │       ├── /products
│   │       │   ├── page.tsx      # Tabla de productos
│   │       │   ├── /[id]
│   │       │   │   ├── page.tsx  # Editar producto
│   │       │   │   └── loading.tsx
│   │       │   └── /new
│   │       │       └── page.tsx  # Crear producto
│   │       ├── /orders
│   │       │   ├── page.tsx      # Tabla de pedidos
│   │       │   └── /[id]/page.tsx # Detalle pedido
│   │       ├── /reviews
│   │       │   └── page.tsx      # Moderar reseñas
│   │       ├── /coupons
│   │       │   ├── page.tsx
│   │       │   └── /new/page.tsx
│   │       ├── /analytics
│   │       │   └── page.tsx
│   │       ├── /settings
│   │       │   ├── page.tsx      # Tenant settings
│   │       │   └── billing/page.tsx
│   │       └── /team
│   │           └── page.tsx      # Manage users
│   │
│   └── /api                      # API Routes
│       ├── auth/[...nextauth]/route.ts
│       ├── webhooks/
│       │   ├── stripe/route.ts
│       │   └── mercado-pago/route.ts
│       ├── products/
│       │   ├── route.ts          # GET /api/products, POST (admin)
│       │   └── /[id]/
│       │       ├── route.ts      # GET/PUT/DELETE
│       │       └── reviews/
│       │           ├── route.ts  # GET /api/products/:id/reviews
│       │           └── /[reviewId]/route.ts
│       ├── categories/
│       │   └── route.ts
│       ├── cart/
│       │   ├── route.ts          # GET/POST/PUT
│       │   └── /validate/route.ts
│       ├── checkout/
│       │   ├── route.ts          # POST /api/checkout → Stripe
│       │   └── /confirm/route.ts
│       ├── orders/
│       │   ├── route.ts
│       │   └── /[id]/
│       │       ├── route.ts
│       │       └── /shipping/route.ts
│       ├── coupons/
│       │   ├── /validate/route.ts
│       │   └── route.ts
│       ├── users/
│       │   ├── /[id]/
│       │   │   ├── route.ts
│       │   │   └── /addresses/route.ts
│       │   └── /me/route.ts
│       └── admin/
│           ├── products/route.ts
│           ├── orders/route.ts
│           └── /[tenantId]/
│               ├── /analytics/route.ts
│               └── /settings/route.ts
│
├── /components
│   ├── /ui                       # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── select.tsx
│   │   ├── form.tsx
│   │   └── ... (más)
│   │
│   ├── /shared                   # Componentes reutilizables
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Navigation.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── AuthGuard.tsx
│   │
│   └── /features
│       ├── /products
│       │   ├── ProductCard.tsx
│       │   ├── ProductGallery.tsx
│       │   ├── ProductFilters.tsx
│       │   ├── VariantSelector.tsx
│       │   └── ReviewSection.tsx
│       ├── /cart
│       │   ├── CartDropdown.tsx
│       │   ├── CartSummary.tsx
│       │   ├── CartItems.tsx
│       │   └── CartActions.tsx
│       ├── /checkout
│       │   ├── CheckoutForm.tsx
│       │   ├── ShippingForm.tsx
│       │   ├── PaymentForm.tsx
│       │   ├── OrderSummary.tsx
│       │   └── CheckoutStepper.tsx
│       └── /admin
│           ├── ProductForm.tsx
│           ├── OrdersTable.tsx
│           ├── ProductsTable.tsx
│           ├── ReviewsPanel.tsx
│           └── DashboardStats.tsx
│
├── /lib
│   ├── auth/
│   │   ├── auth.config.ts        # NextAuth config
│   │   ├── roles.ts              # RBAC
│   │   ├── middleware.ts         # Auth middleware
│   │   └── session.ts            # Session helpers
│   │
│   ├── db/
│   │   ├── client.ts             # Prisma client
│   │   ├── tenant.ts             # Tenant queries
│   │   ├── products.ts           # Product queries
│   │   ├── orders.ts             # Order queries
│   │   └── seed.ts               # Database seeding
│   │
│   ├── security/
│   │   ├── csp.ts                # CSP headers
│   │   ├── rate-limit.ts         # Rate limiting
│   │   ├── validation.ts         # Zod schemas
│   │   ├── encryption.ts         # Para datos sensibles
│   │   └── sanitize.ts           # Input sanitization
│   │
│   ├── payments/
│   │   ├── stripe.ts
│   │   └── mercado-pago.ts
│   │
│   ├── shipping/
│   │   ├── skydropx.ts
│   │   └── carriers.ts
│   │
│   ├── email/
│   │   ├── client.ts             # Resend client
│   │   ├── templates/
│   │   │   ├── OrderConfirmation.tsx
│   │   │   ├── OrderShipped.tsx
│   │   │   ├── PasswordReset.tsx
│   │   │   └── WelcomeEmail.tsx
│   │   └── send.ts
│   │
│   ├── utils/
│   │   ├── format.ts             # Formatting helpers
│   │   ├── currency.ts
│   │   ├── dates.ts
│   │   ├── validation.ts
│   │   ├── error.ts
│   │   └── constants.ts
│   │
│   └── hooks/
│       ├── useAuth.ts
│       ├── useTenant.ts
│       ├── useCart.ts
│       ├── useProducts.ts
│       ├── useOrders.ts
│       └── useAsync.ts
│
├── /styles
│   ├── globals.css               # Tailwind + custom
│   └── variables.css             # CSS custom properties
│
├── /public
│   ├── /images
│   │   ├── logo.svg
│   │   └── ... (assets)
│   └── /icons
│
└── /tests                        # Testing
    ├── /unit
    │   ├── lib/
    │   │   └── validation.test.ts
    │   └── utils/
    │       └── currency.test.ts
    ├── /integration
    │   ├── api/
    │   │   └── products.test.ts
    │   └── auth.test.ts
    └── /e2e
        ├── checkout.spec.ts
        └── login.spec.ts
```

---

# 5. SPRINT 0 - CONFIGURACIÓN EXACTA

## 5.1 Crear Repositorio y Proyecto

```bash
# 1. Crear repo en GitHub
# Settings:
# - Branch protection en main
# - Require PR reviews
# - Dismiss stale PR approvals OFF

# 2. Clonar y crear proyecto Next.js
git clone https://github.com/tu-usuario/tienda-online.git
cd tienda-online

# 3. Inicializar Next.js 14 con TypeScript
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias '@/*'

# 4. Instalar dependencias críticas
pnpm add \
  next@14.0.0 \
  react@18.2.0 \
  react-dom@18.2.0 \
  typescript@5.3.0 \
  @types/node@20 \
  @types/react@18 \
  @types/react-dom@18

# Validación
pnpm add next-auth@5.0.0-beta.1 \
  @auth/prisma-adapter \
  prisma@5.6.0 \
  @prisma/client@5.6.0 \
  zod@3.22.0

# UI & State
pnpm add \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-dialog \
  @radix-ui/react-form \
  class-variance-authority \
  clsx \
  tailwind-merge \
  zustand@4.4.0 \
  @tanstack/react-query@5.0.0

# Pagos
pnpm add stripe@13.0.0 @stripe/react-stripe-js

# Email
pnpm add resend@2.0.0

# Utilidades
pnpm add date-fns nanoid

# Dev
pnpm add -D \
  @types/node@20 \
  typescript@5.3.0 \
  prettier@3.1.0 \
  eslint-config-prettier \
  tailwindcss@3.3.0 \
  postcss@8.4.31 \
  autoprefixer@10.4.16

# Testing
pnpm add -D \
  vitest@0.34.0 \
  @testing-library/react@14.0.0 \
  @testing-library/jest-dom@6.1.4 \
  playwright@1.40.0 \
  @playwright/test@1.40.0
```

## 5.2 Configurar Variables de Entorno

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tienda_online"

# Auth.js
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_ID="xxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-XXXXXXXX..."

# Skydropx
SKYDROPX_API_KEY="..."

# Resend Email
RESEND_API_KEY="re_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 5.3 Configurar Prisma

```bash
# Inicializar Prisma
pnpm prisma init

# Crear en prisma/schema.prisma (ver sección 3)
# Luego:

# Crear migración inicial
pnpm prisma migrate dev --name init

# Generar Prisma Client
pnpm prisma generate

# Seed la base de datos (opcional)
pnpm prisma db seed
```

## 5.4 Configurar TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "isolatedModules": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "typeRoots": ["./node_modules/@types"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

## 5.5 Git Setup

```bash
# .gitignore (CRÍTICO)
node_modules/
.env
.env.local
.env.*.local
dist/
build/
.next/
.vercel/
.DS_Store
*.pem
.idea/
.vscode/

# Configurar pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "pnpm lint && pnpm type-check"
npx husky add .husky/commit-msg 'pnpm exec commitlint --edit "$1"'

# Primer commit
git add .
git commit -m "feat: Initialize Next.js 14 project with TypeScript and Tailwind"
git branch -M main
git push -u origin main
```

---

# 6. SPRINT 1 - AUTENTICACIÓN + TENANTS

## 6.1 Configurar NextAuth.js

```typescript
// /lib/auth/auth.config.ts

import { type NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db/client"
import { z } from "zod"
import bcrypt from "bcrypt"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: false,
      profile: async (profile) => {
        // CRÍTICO: Crear o vincular tenant automáticamente
        let tenant = await db.tenant.findFirst({
          where: { users: { some: { email: profile.email } } },
        })

        if (!tenant) {
          // Crear tenant para nuevo usuario
          tenant = await db.tenant.create({
            data: {
              name: profile.name || "Mi Tienda",
              slug: profile.email.split("@")[0],
            },
          })
        }

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          tenantId: tenant.id,
        }
      },
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const validation = LoginSchema.safeParse(credentials)

        if (!validation.success) {
          return null
        }

        const { email, password } = validation.data

        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          tenantId: user.tenantId,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // CRÍTICO: Pasar roles y tenantId al token y sesión
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, tenantId: true },
        })
        token.role = dbUser?.role || "CUSTOMER"
        token.tenantId = dbUser?.tenantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
    async authorized({ request, auth }) {
      // Middleware protection
      const isLoggedIn = !!auth?.user

      const { pathname } = request.nextUrl

      // Rutas públicas
      if (["/login", "/signup", "/shop"].some(p => pathname.startsWith(p))) {
        return true
      }

      // Rutas protegidas requieren autenticación
      if (pathname.startsWith("/dashboard")) {
        return isLoggedIn
      }

      if (pathname.startsWith("/api")) {
        return isLoggedIn
      }

      return true
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`[AUTH] User signed in: ${user.email}`)

      if (isNewUser) {
        // Enviar email de bienvenida
        // await sendWelcomeEmail(user.email)
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },
} satisfies NextAuthConfig
```

## 6.2 Crear Auth Routes

```typescript
// /app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export const GET = handlers.GET
export const POST = handlers.POST
```

## 6.3 Crear Tenant API

```typescript
// /app/api/tenants/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { db } from "@/lib/db/client"
import { z } from "zod"

const CreateTenantSchema = z.object({
  name: z.string().min(3).max(255),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Invalid slug format"),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenant = await db.tenant.findUnique({
    where: { id: session.user.tenantId! },
  })

  return NextResponse.json(tenant)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // SOLO STORE_OWNER puede crear tenant
  if (session.user.role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validation = CreateTenantSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, slug } = validation.data

    // Verificar que el slug sea único
    const existing = await db.tenant.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Slug already taken" },
        { status: 409 }
      )
    }

    // Crear tenant
    const tenant = await db.tenant.create({
      data: {
        name,
        slug,
        users: {
          connect: {
            id: session.user.id,
          },
        },
      },
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error("[TENANT] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## 6.4 Auth Middleware

```typescript
// /middleware.ts

import { auth } from "@/lib/auth/auth.config"
import { CSP_HEADER } from "@/lib/security/csp"
import { NextResponse } from "next/server"

export const middleware = auth((req) => {
  const response = NextResponse.next()

  // Agregar CSP headers
  response.headers.set("Content-Security-Policy", CSP_HEADER)
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")

  // CRÍTICO: Verificar tenant para rutas protegidas
  const { pathname } = req.nextUrl
  const user = req.auth?.user

  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/admin") && user?.role !== "STORE_OWNER") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return response
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
```

---

# 7. SPRINT 2 - PRODUCTOS + CATEGORÍAS

## 7.1 API de Productos

```typescript
// /app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { db } from "@/lib/db/client"
import { z } from "zod"

const CreateProductSchema = z.object({
  name: z.string().min(3).max(255),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(20).max(5000),
  shortDescription: z.string().min(10).max(200).optional(),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
  basePrice: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0),
  weight: z.coerce.number().positive(),
  length: z.coerce.number().positive(),
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  categoryId: z.string().uuid(),
  published: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const tenantId = searchParams.get("tenantId")

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId required" },
        { status: 400 }
      )
    }

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      db.product.findMany({
        where: { tenantId, published: true },
        skip,
        take: limit,
        include: {
          category: true,
          images: { take: 1 },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.product.count({ where: { tenantId, published: true } }),
    ])

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("[PRODUCTS] GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.id || session.user.role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const validation = CreateProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data
    const tenantId = session.user.tenantId!

    // Verificar que el SKU sea único por tenant
    const existingSku = await db.product.findUnique({
      where: { tenantId_sku: { tenantId, sku: data.sku } },
    })

    if (existingSku) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      )
    }

    // Verificar que la categoría pertenezca al tenant
    const category = await db.category.findFirst({
      where: { id: data.categoryId, tenantId },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    const product = await db.product.create({
      data: {
        ...data,
        tenantId,
      },
      include: { category: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("[PRODUCTS] POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

---

# 8. SPRINT 3 - CARRITO + PAGO

## 8.1 Stripe Integration Completa

```typescript
// /lib/payments/stripe.ts

import Stripe from "stripe"
import { db } from "@/lib/db/client"
import { OrderStatus, PaymentStatus } from "@prisma/client"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function createCheckoutSession({
  orderId,
  userId,
  tenantId,
}: {
  orderId: string
  userId: string
  tenantId: string
}) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
      user: true,
      shippingAddress: true,
    },
  })

  if (!order) {
    throw new Error("Order not found")
  }

  // Verificar que el usuario es dueño de la orden
  if (order.userId !== userId) {
    throw new Error("Forbidden")
  }

  // Crear line items
  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: "mxn",
      product_data: {
        name: item.product.name,
        images: [], // Agregar imágenes
      },
      unit_amount: Math.round(item.priceAtPurchase.toNumber() * 100),
    },
    quantity: item.quantity,
  }))

  // Agregar envío
  lineItems.push({
    price_data: {
      currency: "mxn",
      product_data: {
        name: "Shipping",
      },
      unit_amount: Math.round(order.shippingCost.toNumber() * 100),
    },
    quantity: 1,
  })

  // Crear sesión de Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
    customer_email: order.user.email,
    metadata: {
      orderId,
      tenantId,
    },
  })

  // Guardar payment ID
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentId: session.id,
    },
  })

  return session
}

// Webhook handler
export async function handleCheckoutComplete(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== "paid") {
    return
  }

  const orderId = session.metadata?.orderId
  const tenantId = session.metadata?.tenantId

  if (!orderId || !tenantId) {
    throw new Error("Invalid session metadata")
  }

  // Actualizar orden
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.COMPLETED,
      status: OrderStatus.PROCESSING,
    },
  })

  // Descontar inventario
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  for (const item of order!.items) {
    await db.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity },
      },
    })
  }

  // Enviar email de confirmación
  // await sendOrderConfirmationEmail(...)
}
```

## 8.2 Webhook de Stripe

```typescript
// /app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/payments/stripe"
import { handleCheckoutComplete } from "@/lib/payments/stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any
      await handleCheckoutComplete(session.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Error:", error)
    return NextResponse.json(
      { error: "Webhook error" },
      { status: 400 }
    )
  }
}
```

---

# 9. SPRINT 4 - POST-VENTA

## 9.1 Email Transaccional

```typescript
// /lib/email/send.ts

import { Resend } from "resend"
import { OrderConfirmationEmail } from "./templates/OrderConfirmation"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmationEmail({
  email,
  orderId,
  orderNumber,
  total,
}: {
  email: string
  orderId: string
  orderNumber: string
  total: number
}) {
  try {
    await resend.emails.send({
      from: `orders@${process.env.NEXT_PUBLIC_APP_URL}`,
      to: email,
      subject: `Pedido Confirmado #${orderNumber}`,
      react: OrderConfirmationEmail({
        orderNumber,
        orderLink: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderId}`,
        total,
      }),
    })
  } catch (error) {
    console.error("[EMAIL] Error sending order confirmation:", error)
  }
}
```

---

# 10. PATRONES DE SEGURIDAD REUTILIZABLES

## 10.1 Validación Zod Reutilizable

```typescript
// /lib/security/validation.ts

import { z } from "zod"

export const Schemas = {
  // Identifiers
  UUID: z.string().uuid("Invalid ID"),
  SKU: z.string().regex(/^[A-Z0-9-]+$/, "Invalid SKU"),
  SLUG: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug"),

  // Números
  PRICE: z.coerce.number().positive("Price must be positive"),
  STOCK: z.coerce.number().int().min(0),
  QUANTITY: z.coerce.number().int().min(1).max(999),

  // Strings
  EMAIL: z.string().email("Invalid email"),
  PASSWORD: z.string().min(8).max(255),
  NAME: z.string().min(2).max(255),
  PHONE: z.string().regex(/^\+?[0-9]{10,}$/),

  // Dates
  FUTURE_DATE: z.date().refine(d => d > new Date(), "Date must be in future"),
}

// Usar así:
// const validation = Schemas.PRICE.safeParse(req.body.price)
```

## 10.2 Middleware de Autorización

```typescript
// /lib/auth/middleware.ts

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { PERMISSIONS, UserRole } from "@/lib/auth/roles"

export async function requireAuth() {
  const session = await getServerSession(authConfig)

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  return session
}

export async function requireRole(role: UserRole) {
  const session = await requireAuth()

  if (session.user.role !== role) {
    throw new Error("Forbidden")
  }

  return session
}

export async function requirePermission(permission: string) {
  const session = await requireAuth()
  const userPermissions = PERMISSIONS[session.user.role as UserRole]

  const hasPermission = userPermissions.some(
    p => p === permission || p.endsWith(":*") && permission.startsWith(p.replace(":*", ":"))
  )

  if (!hasPermission) {
    throw new Error("Forbidden")
  }

  return session
}

export async function requireTenant(requiredTenantId?: string) {
  const session = await requireAuth()

  if (!session.user.tenantId) {
    throw new Error("No tenant assigned")
  }

  if (requiredTenantId && session.user.tenantId !== requiredTenantId) {
    throw new Error("Forbidden")
  }

  return session
}

// Uso en API routes:
// export async function POST(req: NextRequest) {
//   const session = await requirePermission("products:write")
//   const tenantId = session.user.tenantId!
//   ...
// }
```

---

# 11. GOOGLE OAUTH - GUÍA COMPLETA

## 11.1 Setup en Google Cloud Console

```
1. Ir a https://console.cloud.google.com
2. Crear nuevo proyecto: "Tienda Online"
3. Habilitar API: Google+ API
4. Crear OAuth 2.0 Credential (Web application)
   - Authorized redirect URIs:
     * http://localhost:3000/api/auth/callback/google
     * https://tudominio.com/api/auth/callback/google
5. Copiar Client ID y Client Secret
6. Guardar en .env.local
```

## 11.2 Configuración Auth.js (ya hecha arriba)

---

# 12. TESTING STRATEGY

## 12.1 Unit Tests

```typescript
// /tests/unit/lib/validation.test.ts

import { describe, it, expect } from "vitest"
import { Schemas } from "@/lib/security/validation"

describe("Validation Schemas", () => {
  it("should validate email", () => {
    expect(Schemas.EMAIL.safeParse("test@example.com").success).toBe(true)
    expect(Schemas.EMAIL.safeParse("invalid").success).toBe(false)
  })

  it("should validate price", () => {
    expect(Schemas.PRICE.safeParse(99.99).success).toBe(true)
    expect(Schemas.PRICE.safeParse(-10).success).toBe(false)
    expect(Schemas.PRICE.safeParse(0).success).toBe(false)
  })
})
```

## 12.2 E2E Tests con Playwright

```typescript
// /tests/e2e/checkout.spec.ts

import { test, expect } from "@playwright/test"

test.describe("Checkout Flow", () => {
  test("should complete purchase successfully", async ({ page }) => {
    // Navegar a producto
    await page.goto("/shop")
    await page.click('button:has-text("Ver Detalles")')

    // Añadir al carrito
    await page.fill('input[aria-label="Quantity"]', "2")
    await page.click('button:has-text("Añadir al Carrito")')

    // Verificar carrito
    await expect(page.locator("text=2 productos")).toBeVisible()

    // Ir a checkout
    await page.click('button:has-text("Finalizar Compra")')

    // Llenar formulario
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="name"]', "Test User")
    await page.fill('input[name="street"]', "Calle 123")
    // ... más campos

    // Pagar con tarjeta de prueba
    await page.fill('input[name="cardNumber"]', "4242 4242 4242 4242")
    await page.click('button:has-text("Pagar Ahora")')

    // Verificar éxito
    await expect(page.locator("text=¡Gracias por tu compra!")).toBeVisible()
  })
})
```

---

# 13. DEVOPS + DEPLOYMENT

## 13.1 Vercel Setup

```bash
# Instalar Vercel CLI
npm i -g vercel

# Link proyecto
vercel link

# Deploy
vercel deploy

# Production
vercel deploy --prod
```

## 13.2 Environment Variables en Vercel

```
Settings > Environment Variables

DATABASE_URL = postgresql://...
NEXTAUTH_SECRET = xxxxxxxx
NEXTAUTH_URL = https://tudominio.com
GOOGLE_ID = xxxx
GOOGLE_SECRET = xxxx
STRIPE_SECRET_KEY = sk_live_...
STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
RESEND_API_KEY = re_...
```

## 13.3 Database Migration en Producción

```bash
# Antes de deployar
pnpm prisma migrate deploy

# En Vercel (post-deploy hook)
# .vercel/deployments/post.sh
#!/bin/bash
npm run prisma migrate deploy
```

## 13.4 Monitoring y Alertas

```typescript
// /lib/monitoring/sentry.ts

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})

// Uso
export function captureException(error: Error) {
  Sentry.captureException(error)
}
```

---

## CHECKLIST FINAL ARQUITECTO 1 (BACKEND)

- [ ] Repositorio GitHub creado y protegido
- [ ] Next.js 14 + TypeScript inicializado
- [ ] Prisma schema completamente definido
- [ ] Database PostgreSQL/Neon configurada
- [ ] NextAuth.js configurado con Google OAuth
- [ ] RBAC implementado (SUPER_ADMIN, STORE_OWNER, CUSTOMER)
- [ ] CSP headers configurados desde middleware
- [ ] Todos los schemas Zod creados
- [ ] Sprint 0 APIs completadas (auth, tenants)
- [ ] Sprint 1 APIs completadas (products, categories)
- [ ] Sprint 2 APIs completadas (cart, orders)
- [ ] Sprint 3 Stripe integration completada
- [ ] Webhooks de Stripe configurados
- [ ] Email templates creadas con Resend
- [ ] Rate limiting configurado
- [ ] Tests unitarios escritos
- [ ] Código pronto para Code Review

---

## CHECKLIST FINAL ARQUITECTO 2 (FRONTEND)

- [ ] TypeScript 100% coverage
- [ ] Componentes Shadcn/ui instalados
- [ ] Layouts y páginas públicas (home, shop, product)
- [ ] Componentes de autenticación (login, signup)
- [ ] Product gallery con filtros
- [ ] Carrito de compras con Zustand
- [ ] Checkout multi-paso
- [ ] Stripe Elements integrado
- [ ] Dashboard protegido
- [ ] Admin panel (products, orders, reviews)
- [ ] React Query para server state
- [ ] Responsive design (mobile-first)
- [ ] Accesibilidad WCAG 2.1 AA
- [ ] Tests E2E con Playwright
- [ ] Deploy a Vercel exitoso
- [ ] Código pronto para Code Review

---

**FIN DEL DOCUMENTO MAESTRO**

Este documento tiene TODO lo que necesitas para construir sin ambigüedad.

¡ADELANTE! 🚀
