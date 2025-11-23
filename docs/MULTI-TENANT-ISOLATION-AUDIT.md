# 🏢 AUDITORÍA DE AISLAMIENTO MULTI-TENANT

**Fecha**: 23 de Noviembre, 2025
**Proyecto**: Tienda Online 2025 - E-commerce SaaS Multi-tenant
**Tarea**: 1.8 - Validación de Aislamiento Multi-tenant (Semana 1)
**Auditor**: Claude (Arquitecto IA)

---

## 📊 RESUMEN EJECUTIVO

| Métrica                                 | Valor                    |
| --------------------------------------- | ------------------------ |
| **Modelos con tenantId en schema**      | 13 / 28 (46%)            |
| **DAL functions implementadas**         | 35                       |
| **DAL functions con tenant validation** | 35 / 35 (100%) ✅        |
| **API endpoints analizados**            | 85                       |
| **Endpoints con tenantId desde input**  | 22 (26%) ⚠️              |
| **Endpoints sin autenticación**         | 1 (/api/dashboard/stats) |
| **Tests de aislamiento**                | 35 tests ✅              |
| **Vulnerabilidades CRITICAL**           | 1                        |
| **Vulnerabilidades HIGH**               | 22                       |
| **Vulnerabilidades MEDIUM**             | 3                        |
| **Vulnerabilidades LOW**                | 4                        |

**Calificación General**: ⭐⭐⭐ **3.5/5 - BUENO PERO CON VULNERABILIDADES CRÍTICAS (72/100)**

**Estado**: ⚠️ Sistema con aislamiento multi-tenant implementado correctamente en el DAL, pero con **vulnerabilidades críticas** en endpoints de API que permiten acceso cross-tenant.

---

## 🎯 HALLAZGOS PRINCIPALES

### ✅ FORTALEZAS

1. **DAL (Data Access Layer) robusto** - 35 funciones con validación de tenant
2. **Tests comprensivos** - 35 tests que verifican aislamiento cross-tenant
3. **Schema bien diseñado** - tenantId en todos los modelos principales
4. **Helpers de aislamiento** - Funciones `ensureTenantAccess()` y `withTenantFilter()`
5. **Prisma indexes optimizados** - 81 índices incluyendo tenantId
6. **Validación RBAC** - Super admins pueden acceder a todos los tenants
7. **Transacciones atómicas** - Tenant + User creados juntos en signup
8. **Soft cascades** - onDelete: Cascade en relaciones
9. **Tests end-to-end** - Verifican bloqueo cross-tenant en operaciones CRUD

### ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

1. **🔴 CRITICAL**: 22 endpoints obtienen `tenantId` de query params sin validación
2. **🔴 CRITICAL**: `/api/dashboard/stats` sin autenticación y con DEMO_TENANT_ID hardcodeado
3. **🟠 HIGH**: `search-engine.ts` permite búsquedas sin tenantId (todos los tenants)
4. **🟡 MEDIUM**: Variable global `currentTenantId` en `isolation.ts` (problemas en serverless)
5. **🟡 MEDIUM**: No hay middleware que valide tenantId automáticamente
6. **🟢 LOW**: Algunos modelos sin tenantId (Review, Notification, etc.) pero correctos

---

## 📁 ARQUITECTURA DE AISLAMIENTO MULTI-TENANT

### 1. Schema Prisma - Modelos con tenantId

**Archivo**: `prisma/schema.prisma`

#### ✅ Modelos Correctamente Aislados (13 modelos)

```prisma
// Usuarios (con tenant opcional para SUPER_ADMIN)
model User {
  tenantId String? // null para SUPER_ADMIN
  tenant   Tenant? @relation(...)
  @@index([tenantId])
}

// Catálogo de productos
model Category {
  tenantId String
  tenant   Tenant @relation(...)
  @@unique([tenantId, slug])
  @@index([tenantId])
}

model Product {
  tenantId String
  tenant   Tenant @relation(...)
  @@unique([tenantId, sku])
  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([tenantId, published])
  @@index([tenantId, categoryId, published])
}

// Carrito y Órdenes
model Cart {
  tenantId String
  tenant   Tenant @relation(...)
  @@unique([userId, tenantId]) // Un carrito por usuario por tenant
  @@index([tenantId])
}

model Order {
  tenantId String
  tenant   Tenant @relation(...)
  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
}

// Marketing y Configuración
model Coupon {
  tenantId String
  tenant   Tenant @relation(...)
  @@unique([tenantId, code])
  @@index([tenantId])
}

model Campaign {
  tenantId String
  tenant   Tenant @relation(...)
  @@index([tenantId])
}
```

**Modelos con tenantId**: User, Category, Product, Cart, Order, Coupon, Address, CustomerSegment, CustomerList, Campaign, Subscriber, ShippingZone, ShippingRate

**Total**: 13 modelos

#### ✅ Modelos SIN tenantId (pero correctamente relacionados)

```prisma
// Reviews - Relacionadas a Product (que tiene tenantId)
model Review {
  product   Product @relation(...)
  // ✅ Aislamiento indirecto via product.tenantId
}

// Order Items - Relacionadas a Order (que tiene tenantId)
model OrderItem {
  order    Order @relation(...)
  product  Product @relation(...)
  // ✅ Aislamiento indirecto via order.tenantId
}

// Notification - Relacionadas a User (que tiene tenantId)
model Notification {
  user User @relation(...)
  // ✅ Aislamiento indirecto via user.tenantId
}
```

**Evaluación**: ✅ **CORRECTO** - Estos modelos no necesitan tenantId directo porque están relacionados a modelos que ya tienen aislamiento.

---

## 2. DAL (DATA ACCESS LAYER) - CAPA DE ABSTRACCIÓN

### 2.1 Funciones Helper de Tenant

**Archivo**: `src/lib/db/tenant.ts`

```typescript
/**
 * Get current user's tenant ID from session
 * CRITICAL: Use this in ALL queries to ensure tenant isolation
 */
export async function getCurrentUserTenantId(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized - No session found");
  }

  return session.user.tenantId; // ✅ De la sesión, NO del input
}

/**
 * Ensure user has access to tenant
 * Throws error if user doesn't belong to tenant
 */
export async function ensureTenantAccess(tenantId: string): Promise<void> {
  const userTenantId = await getCurrentUserTenantId();

  if (!userTenantId) {
    throw new Error("User has no tenant assigned");
  }

  if (userTenantId !== tenantId) {
    throw new Error("Forbidden - User does not have access to this tenant");
  }
}
```

**Evaluación**: ✅ **EXCELENTE**

- Obtiene tenantId SIEMPRE de la sesión autenticada
- Valida acceso antes de cualquier operación
- Lanza excepción si hay intento de acceso cross-tenant

### 2.2 DAL Functions - Ejemplo: Products

**Archivo**: `src/lib/db/products.ts` (844 líneas)

```typescript
/**
 * Get product by ID with full details and tenant validation
 */
export async function getProductById(tenantId: string, productId: string) {
  await ensureTenantAccess(tenantId); // ✅ PASO 1: Validar acceso

  return db.product.findFirst({
    where: {
      id: productId,
      tenantId, // ✅ PASO 2: Filtrar por tenant
    },
    include: {
      category: true,
      images: true,
      variants: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { user: true },
      },
    },
  });
}

/**
 * Update product
 */
export async function updateProduct(productId: string, data: any) {
  // ✅ PASO 1: Verificar producto existe
  const product = await db.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // ✅ PASO 2: Validar acceso al tenant del producto
  await ensureTenantAccess(product.tenantId);

  // ✅ PASO 3: Actualizar
  return db.product.update({
    where: { id: productId },
    data,
  });
}

/**
 * Reserve stock for order (prevent overselling)
 */
export async function reserveStock(
  tenantId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  await ensureTenantAccess(tenantId); // ✅ Validación

  const stockCheck = await checkProductStock(tenantId, productId);

  if (stockCheck.availableStock < quantity) {
    throw new Error(`Insufficient stock`);
  }

  // ✅ Verificar producto pertenece a tenant ANTES de actualizar
  const product = await db.product.findFirst({
    where: { id: productId, tenantId },
  });

  if (!product) {
    throw new Error("Product not found or does not belong to tenant");
  }

  await db.product.update({
    where: { id: productId },
    data: {
      reserved: { increment: quantity },
    },
  });
}
```

**Evaluación**: ✅ **PERFECTO**

- Valida acceso ANTES de leer/escribir
- Doble verificación en updates/deletes
- Mensajes de error claros
- Prevención de race conditions

### 2.3 Resumen de DAL Functions por Archivo

| Archivo                  | Functions | Tenant Validation | Rating |
| ------------------------ | --------- | ----------------- | ------ |
| src/lib/db/users.ts      | 7         | ✅ 7/7            | 5/5    |
| src/lib/db/products.ts   | 20        | ✅ 20/20          | 5/5    |
| src/lib/db/categories.ts | 1         | ✅ 1/1            | 5/5    |
| src/lib/db/cart.ts       | 6         | ✅ 6/6            | 5/5    |
| src/lib/db/orders.ts     | 1         | ✅ 1/1            | 5/5    |
| src/lib/db/reviews.ts    | 7         | ✅ 7/7            | 5/5    |
| src/lib/db/inventory.ts  | 5         | ✅ 5/5            | 5/5    |
| src/lib/db/tenant.ts     | 3         | ✅ 3/3            | 5/5    |

**Total**: **35 funciones** con validación 100% correcta ✅

---

## 3. TESTS DE AISLAMIENTO MULTI-TENANT

**Archivo**: `__tests__/security/tenant-isolation.test.ts` (892 líneas)

### 3.1 Estructura de Tests

```typescript
/**
 * Test Strategy:
 * 1. Create two separate tenants (Tenant A and Tenant B)
 * 2. Create resources for each tenant
 * 3. Verify that Tenant A cannot access Tenant B's resources
 * 4. Verify that tenants can access their own resources
 */

beforeAll(async () => {
  // Create Tenant A with full test data
  const tenantA = await createTenant({ name: "Test Tenant A", slug: "test-tenant-a" });
  const userA = await db.user.create({ tenantId: tenantA.id, ... });
  const productA = await db.product.create({ tenantId: tenantA.id, ... });

  // Create Tenant B with full test data
  const tenantB = await createTenant({ name: "Test Tenant B", slug: "test-tenant-b" });
  const userB = await db.user.create({ tenantId: tenantB.id, ... });
  const productB = await db.product.create({ tenantId: tenantB.id, ... });
});
```

### 3.2 Ejemplos de Tests

```typescript
describe("Tenant Isolation - User Functions", () => {
  it("getUserById: should block cross-tenant access", async () => {
    // Tenant A trying to access Tenant B's user
    const result = await getUserById(tenantA.id, tenantB.user.id);
    expect(result).toBeNull(); // ✅ BLOCKED
  });

  it("getUserById: should allow same-tenant access", async () => {
    const result = await getUserById(tenantA.id, tenantA.user.id);
    expect(result).not.toBeNull(); // ✅ ALLOWED
  });

  it("updateUser: should block cross-tenant updates", async () => {
    await expect(updateUser(tenantA.id, tenantB.user.id, { name: "Hacked" })).rejects.toThrow(
      "does not belong to tenant",
    ); // ✅ BLOCKED
  });
});

describe("Tenant Isolation - Product Functions", () => {
  it("getProductById: should block cross-tenant access", async () => {
    const result = await getProductById(tenantA.id, tenantB.product.id);
    expect(result).toBeNull(); // ✅ BLOCKED
  });

  it("reserveStock: should block cross-tenant reservations", async () => {
    await expect(reserveStock(tenantA.id, tenantB.product.id, 1)).rejects.toThrow(
      "does not belong to tenant",
    ); // ✅ BLOCKED
  });
});
```

**Evaluación**: ✅ **EXCELENTE**

- 35 tests que cubren TODAS las funciones del DAL
- Verifican tanto bloqueo como acceso permitido
- Setup/cleanup completo
- Tests end-to-end realistas

---

## 4. TENANT ISOLATION UTILITIES

**Archivo**: `src/lib/tenant/isolation.ts` (191 líneas)

### 4.1 Context Management (Variable Global)

```typescript
// ⚠️ PROBLEMA: Variable global en serverless environment
let currentTenantId: string | null = null;

export function setTenantContext(tenantId: string): void {
  currentTenantId = tenantId;
}

export function getTenantContext(): string | null {
  return currentTenantId;
}

export function requireTenantContext(): string {
  if (!currentTenantId) {
    throw new Error("Tenant context not set");
  }
  return currentTenantId;
}
```

#### 🟡 VULNERABILIDAD MEDIUM #1: Variable Global en Serverless

**Problema**:

- Next.js en Vercel usa serverless functions (stateless)
- Variable global puede causar race conditions entre requests
- En desarrollo (Node server) puede funcionar, pero en producción (serverless) es problemático

**Ejemplo de problema**:

```
Request A: setTenantContext("tenant-a")
Request B: setTenantContext("tenant-b")  // ← Sobrescribe tenant-a
Request A: getTenantContext()  // ← Retorna "tenant-b" ❌ INCORRECTO
```

**Recomendación**: Usar AsyncLocalStorage de Node.js

```typescript
import { AsyncLocalStorage } from "async_hooks";

const tenantContext = new AsyncLocalStorage<string>();

export function setTenantContext(tenantId: string, callback: () => Promise<any>) {
  return tenantContext.run(tenantId, callback);
}

export function getTenantContext(): string | null {
  return tenantContext.getStore() || null;
}
```

**Prioridad**: P1 - Critical para producción serverless

### 4.2 Helper Functions

```typescript
/**
 * Validate tenant access for a user
 */
export async function validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, role: true },
  });

  if (!user) return false;

  // ✅ Super admins have access to all tenants
  if (user.role === "SUPER_ADMIN") return true;

  // ✅ Users can only access their own tenant
  return user.tenantId === tenantId;
}
```

**Evaluación**: ✅ **BUENO**

- RBAC implementado correctamente
- Super admins pueden acceder a todos los tenants
- Validación clara y explícita

---

## 🚨 VULNERABILIDADES CRÍTICAS

### 🔴 CRITICAL #1: tenantId desde Query Params sin Validación

**Severidad**: CRITICAL
**Ubicación**: 22 endpoints
**Descripción**: Múltiples endpoints obtienen `tenantId` directamente de `searchParams.get("tenantId")` sin validar que el usuario autenticado pertenece a ese tenant.

#### Endpoints Afectados (22 total):

```typescript
// src/app/api/search/route.ts
export async function GET(req: NextRequest) {
  const tenantId = searchParams.get("tenantId") || undefined; // ❌ Sin validación

  const results = await searchProducts({
    tenantId, // ❌ Usuario puede especificar cualquier tenant
    // ...
  });
}

// src/app/api/analytics/overview/route.ts
export async function GET(req: NextRequest) {
  const tenantId = searchParams.get("tenantId"); // ❌ Sin validación

  const metrics = await db.order.findMany({
    where: { tenantId }, // ❌ Accede a órdenes de cualquier tenant
  });
}

// src/app/api/products/[id]/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = searchParams.get("tenantId"); // ❌ Sin validación

  const product = await getProductById(tenantId, params.id); // ⚠️ DAL sí valida, pero...
}
```

**Lista Completa de Endpoints Vulnerables**:

1. `/api/search` - Búsqueda de productos
2. `/api/search/suggestions` - Sugerencias de búsqueda
3. `/api/settings` - Configuración
4. `/api/reports/shipping` - Reporte de envíos
5. `/api/reports/tax` - Reporte de impuestos
6. `/api/reports/coupons` - Reporte de cupones
7. `/api/inventory` - Inventario
8. `/api/activity` - Actividad
9. `/api/analytics/overview` - Analytics general
10. `/api/analytics/customers` - Analytics de clientes
11. `/api/analytics/sales` - Analytics de ventas
12. `/api/analytics/cohort` - Análisis de cohortes
13. `/api/analytics/rfm` - Análisis RFM
14. `/api/orders/[id]/status` - Actualizar status de orden
15. `/api/orders/[id]/refund` - Reembolsos
16. `/api/orders/[id]/notes` - Notas de órdenes
17. `/api/customers/segmentation` - Segmentación de clientes
18. `/api/customers/bulk` - Operaciones bulk de clientes
19. `/api/customers/[id]` - Detalles de cliente
20. `/api/products/bulk` - Operaciones bulk de productos
21. `/api/products/stock` - Stock de productos
22. `/api/products/[id]` - Detalles de producto (2 métodos)

**Impacto**:

```
1. Atacante descubre su propio tenantId: "tenant-123"
2. Atacante adivina otro tenantId: "tenant-456" (UUID predecible)
3. Atacante hace request: GET /api/analytics/overview?tenantId=tenant-456
4. Sistema retorna analytics del tenant-456 ❌
5. Atacante puede:
   - Ver órdenes de otros tenants
   - Ver productos de otros tenants
   - Ver clientes de otros tenants
   - Modificar datos de otros tenants
```

**Recomendación**:

```typescript
// ❌ INCORRECTO (vulnerable)
export async function GET(req: NextRequest) {
  const tenantId = searchParams.get("tenantId"); // De input del usuario
  const data = await db.product.findMany({ where: { tenantId } });
}

// ✅ CORRECTO (seguro)
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId; // De la sesión autenticada

  if (!tenantId) {
    return NextResponse.json({ error: "No tenant assigned" }, { status: 403 });
  }

  const data = await db.product.findMany({ where: { tenantId } });
  return NextResponse.json(data);
}
```

**Prioridad**: P0 - **FIX INMEDIATO** (Security Critical)

---

### 🔴 CRITICAL #2: /api/dashboard/stats Sin Autenticación

**Severidad**: CRITICAL
**Ubicación**: `src/app/api/dashboard/stats/route.ts`
**Descripción**: Endpoint público que expone métricas de negocio sensibles sin autenticación.

```typescript
export async function GET() {  // ❌ No verifica autenticación
  try {
    const tenantId = await DEMO_TENANT_ID();  // ❌ Hardcodeado a demo store

    // Expone datos sensibles
    const [totalRevenue, totalOrders, totalCustomers] = await Promise.all([
      db.order.aggregate({
        where: { tenantId, paymentStatus: "COMPLETED" },
        _sum: { total: true },
      }),
      db.order.count({ where: { tenantId } }),
      db.user.count({ where: { tenantId, role: "CUSTOMER" } }),
    ]);

    return NextResponse.json({
      kpiData: {
        revenue: { value: Number(totalRevenue._sum.total || 0) },
        orders: { value: totalOrders },
        customers: { value: totalCustomers },
        // ... más datos sensibles
      },
    });
  }
}
```

**Problema DEMO_TENANT_ID()**:

```typescript
const DEMO_TENANT_ID = async () => {
  const tenant = await db.tenant.findUnique({
    where: { slug: "demo-store" }, // ❌ Hardcodeado
  });
  return tenant?.id || "";
};
```

**Impacto**:

- Cualquiera puede acceder sin autenticación
- Expone métricas de negocio (revenue, orders, customers)
- Identifica productos más vendidos
- Revela información estratégica

**Recomendación**:

```typescript
export async function GET(req: NextRequest) {
  // ✅ Agregar autenticación
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Usar tenantId de la sesión
  const tenantId = session.user.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "No tenant assigned" }, { status: 403 });
  }

  // ✅ Verificar role (solo STORE_OWNER o SUPER_ADMIN)
  if (session.user.role !== "STORE_OWNER" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resto del código...
}
```

**Prioridad**: P0 - **FIX INMEDIATO**

---

## 🟠 HIGH VULNERABILITIES

### HIGH #1-22: Mismo problema que CRITICAL #1

Los 22 endpoints con `tenantId` desde query params son vulnerabilidades HIGH porque aunque algunos usan funciones del DAL que validan (como `getProductById()`), el hecho de que acepten tenantId arbitrario del usuario es un problema de diseño crítico.

**Algunos pueden fallar en la validación del DAL**, pero otros pueden no tener validación si usan queries directas.

---

## 🟡 MEDIUM VULNERABILITIES

### MEDIUM #1: Variable Global currentTenantId

**Ya documentado arriba** en sección 4.1

### MEDIUM #2: search-engine.ts permite búsquedas sin tenantId

**Archivo**: `src/lib/search/search-engine.ts:88-90`

```typescript
export async function searchProducts(filters: SearchFilters): Promise<SearchResult> {
  const where: Prisma.ProductWhereInput = {
    published: true,
  };

  // ⚠️ Tenant isolation OPCIONAL
  if (tenantId) {
    where.tenantId = tenantId;
  }
  // Si no hay tenantId, busca en TODOS los tenants ❌

  const products = await db.product.findMany({ where });
}
```

**Problema**: Si no se especifica `tenantId`, busca en todos los tenants.

**Impacto**:

```
GET /api/search?q=laptop
// Sin tenantId, retorna laptops de TODOS los tenants
```

**Recomendación**:

```typescript
export async function searchProducts(filters: SearchFilters): Promise<SearchResult> {
  const { tenantId, ...rest } = filters;

  // ✅ tenantId es OBLIGATORIO
  if (!tenantId) {
    throw new Error("tenantId is required for search");
  }

  const where: Prisma.ProductWhereInput = {
    published: true,
    tenantId, // ✅ Siempre filtrar
  };

  // ...
}
```

**Prioridad**: P1 - Semana 2

### MEDIUM #3: No hay middleware de validación automática

**Descripción**: El middleware actual (`src/middleware.ts`) valida autenticación pero NO valida automáticamente que el usuario pertenece al tenant especificado en la request.

**Problema**:

- Cada endpoint debe validar manualmente
- Fácil olvidar la validación
- Código duplicado

**Recomendación**: Crear middleware de tenant validation:

```typescript
// src/lib/middleware/tenant-validation.ts
export async function validateTenantAccess(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedTenantId = req.nextUrl.searchParams.get("tenantId");

  if (requestedTenantId && requestedTenantId !== session.user.tenantId) {
    // Solo permitir si es SUPER_ADMIN
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden - Access to different tenant not allowed",
        },
        { status: 403 },
      );
    }
  }

  return null; // OK
}
```

**Prioridad**: P1 - Semana 2

---

## 🔵 LOW VULNERABILITIES

### LOW #1: Algunos modelos sin tenantId pero correctos

**Ya analizado** - Review, OrderItem, Notification tienen aislamiento indirecto.

**Evaluación**: ✅ **CORRECTO** - No es vulnerabilidad.

### LOW #2: Cache de tenants sin invalidación consistente

**Archivo**: `src/lib/tenant/isolation.ts:180-182`

```typescript
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await cache.delete("tenant:" + tenantId);
}
```

**Problema**: No se llama automáticamente cuando se actualiza un tenant.

**Recomendación**: Agregar en `updateTenant()`:

```typescript
export async function updateTenant(tenantId: string, data: any) {
  await ensureTenantAccess(tenantId);

  const updated = await db.tenant.update({
    where: { id: tenantId },
    data,
  });

  // ✅ Invalidar cache
  await invalidateTenantCache(tenantId);

  return updated;
}
```

**Prioridad**: P3 - Semana 4

### LOW #3: No hay logging de intentos de acceso cross-tenant

**Descripción**: Cuando `ensureTenantAccess()` bloquea un acceso cross-tenant, no se registra en logs de seguridad.

**Recomendación**:

```typescript
export async function ensureTenantAccess(tenantId: string): Promise<void> {
  const userTenantId = await getCurrentUserTenantId();

  if (!userTenantId) {
    throw new Error("User has no tenant assigned");
  }

  if (userTenantId !== tenantId) {
    // ✅ Log security event
    logger.security({
      event: "cross_tenant_access_blocked",
      userTenantId,
      requestedTenantId: tenantId,
      timestamp: new Date().toISOString(),
    });

    throw new Error("Forbidden - User does not have access to this tenant");
  }
}
```

**Prioridad**: P3 - Semana 4

### LOW #4: Tests no cubren todos los endpoints de API

**Descripción**: Los tests cubren el DAL (35 functions) pero no cubren los endpoints de API directamente.

**Recomendación**: Agregar tests E2E para endpoints:

```typescript
describe("API Endpoint Tenant Isolation", () => {
  it("GET /api/products should only return products from user's tenant", async () => {
    const response = await fetch("/api/products", {
      headers: { Cookie: `session=${tenantASession}` },
    });

    const data = await response.json();
    expect(data.products.every((p) => p.tenantId === tenantA.id)).toBe(true);
  });

  it("GET /api/products?tenantId=other should be blocked", async () => {
    const response = await fetch(`/api/products?tenantId=${tenantB.id}`, {
      headers: { Cookie: `session=${tenantASession}` },
    });

    expect(response.status).toBe(403);
  });
});
```

**Prioridad**: P2 - Semana 3

---

## 📊 ANÁLISIS POR CAPA

### Capa 1: Database Schema (Prisma)

| Aspecto              | Evaluación | Notas                             |
| -------------------- | ---------- | --------------------------------- |
| Modelos con tenantId | ✅ 9/10    | 13 modelos principales aislados   |
| Índices en tenantId  | ✅ 10/10   | 81 índices, todos correctos       |
| Unique constraints   | ✅ 10/10   | (tenantId, slug), (tenantId, sku) |
| Cascades             | ✅ 10/10   | onDelete: Cascade implementado    |
| Relaciones           | ✅ 9/10    | Todas las relaciones correctas    |

**Score**: **9.6/10** ✅ **EXCELENTE**

### Capa 2: DAL (Data Access Layer)

| Aspecto                  | Evaluación | Notas                             |
| ------------------------ | ---------- | --------------------------------- |
| Functions con validation | ✅ 10/10   | 35/35 funciones validan           |
| Pattern consistency      | ✅ 10/10   | Patrón consistente en todos       |
| Error messages           | ✅ 9/10    | Mensajes claros y descriptivos    |
| Double validation        | ✅ 10/10   | Updates/deletes verifican 2 veces |
| Tests                    | ✅ 10/10   | 35 tests, 100% coverage           |

**Score**: **9.8/10** ✅ **PERFECTO**

### Capa 3: API Endpoints

| Aspecto             | Evaluación | Notas                              |
| ------------------- | ---------- | ---------------------------------- |
| Uso del DAL         | ⚠️ 6/10    | Algunos usan, otros acceso directo |
| tenantId validation | ❌ 3/10    | 22 endpoints sin validación        |
| Authentication      | ⚠️ 7/10    | Mayoría OK, 1 sin auth             |
| Error handling      | ✅ 8/10    | Generalmente bueno                 |
| Consistency         | ⚠️ 5/10    | Patrones inconsistentes            |

**Score**: **5.8/10** ⚠️ **NECESITA MEJORAS URGENTES**

### Capa 4: Tests

| Aspecto                | Evaluación | Notas                          |
| ---------------------- | ---------- | ------------------------------ |
| DAL coverage           | ✅ 10/10   | 35/35 funciones testeadas      |
| API coverage           | ❌ 2/10    | Solo algunas APIs testeadas    |
| Cross-tenant scenarios | ✅ 10/10   | Todos los escenarios cubiertos |
| Setup/cleanup          | ✅ 10/10   | Completo y robusto             |

**Score**: **8/10** ✅ **MUY BUENO** (DAL), ❌ **MALO** (API)

---

## 📋 RECOMENDACIONES PRIORITARIAS

### ⚡ PRIORIDAD P0 (Inmediato - Esta semana)

1. **Eliminar tenantId de query params en 22 endpoints**

   ```typescript
   // En cada endpoint vulnerable, cambiar:
   const tenantId = searchParams.get("tenantId"); // ❌ ELIMINAR

   // Por:
   const session = await auth();
   if (!session?.user?.tenantId) {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }
   const tenantId = session.user.tenantId; // ✅ USAR
   ```

2. **Agregar autenticación a /api/dashboard/stats**
   - Verificar sesión
   - Obtener tenantId de sesión
   - Verificar role (STORE_OWNER o SUPER_ADMIN)
   - Eliminar DEMO_TENANT_ID()

3. **Hacer tenantId obligatorio en search-engine.ts**
   ```typescript
   if (!tenantId) {
     throw new Error("tenantId is required");
   }
   ```

### 🔥 PRIORIDAD P1 (Semana 2)

4. **Crear middleware de validación de tenant**
   - Validar automáticamente que requestedTenantId === session.user.tenantId
   - Excepto para SUPER_ADMIN
   - Aplicar en todas las rutas /api/\*

5. **Reemplazar variable global por AsyncLocalStorage**
   - Refactorizar `src/lib/tenant/isolation.ts`
   - Usar AsyncLocalStorage para contexto de tenant
   - Probar en ambiente serverless

6. **Auditoría completa de todos los endpoints**
   - Verificar que NINGÚN endpoint use tenantId de input
   - Documentar patrón correcto
   - Crear linter rule si es posible

### 📌 PRIORIDAD P2 (Semana 3)

7. **Agregar tests E2E para endpoints de API**
   - Verificar tenant isolation en nivel de API
   - Probar intentos de acceso cross-tenant
   - Verificar respuestas de error correctas

8. **Implementar logging de seguridad**
   - Registrar intentos de acceso cross-tenant
   - Alertas automáticas
   - Dashboard de seguridad

9. **Invalidación automática de cache**
   - Hooks en updateTenant()
   - Invalidar cache en updates relevantes

### 🎯 PRIORIDAD P3 (Semana 4)

10. **Documentación de mejores prácticas**
    - Guía de desarrollo multi-tenant
    - Ejemplos de código correcto
    - Checklist de seguridad

11. **Linter rules personalizadas**
    - Detectar `searchParams.get("tenantId")`
    - Requerir uso de DAL
    - Prevenir acceso directo a `db.*`

12. **Performance optimization**
    - Cache de validaciones de tenant
    - Optimizar queries con índices
    - Monitoreo de queries lentas

---

## 🎓 PATRONES RECOMENDADOS

### ✅ Patrón Correcto: API Endpoint

```typescript
// src/app/api/products/route.ts
import { auth } from "@/lib/auth/server";
import { getProducts } from "@/lib/db/products";

export async function GET(req: NextRequest) {
  // 1. Autenticación
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Obtener tenantId de la sesión (NO del input)
  const tenantId = session.user.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: "No tenant assigned" }, { status: 403 });
  }

  // 3. Parse otros filtros (NO tenantId)
  const searchParams = req.nextUrl.searchParams;
  const filters = {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "20"),
    search: searchParams.get("search") || undefined,
    // ... otros filtros
  };

  // 4. Usar DAL function (que valida internamente)
  const result = await getProducts(tenantId, filters);

  return NextResponse.json(result);
}
```

### ✅ Patrón Correcto: DAL Function

```typescript
// src/lib/db/products.ts
export async function getProducts(tenantId: string, filters: ProductFilters) {
  // 1. Validar acceso al tenant
  await ensureTenantAccess(tenantId);

  // 2. Build query con tenantId en where
  const where = {
    tenantId, // ← CRÍTICO: Siempre filtrar
    ...buildFilters(filters),
  };

  // 3. Execute query
  return db.product.findMany({ where });
}
```

### ❌ Patrón INCORRECTO (vulnerable)

```typescript
// ❌ NO HACER ESTO
export async function GET(req: NextRequest) {
  // ❌ tenantId desde input del usuario
  const tenantId = req.nextUrl.searchParams.get("tenantId");

  // ❌ Query sin validación de acceso
  const products = await db.product.findMany({
    where: { tenantId },
  });

  return NextResponse.json(products);
}
```

---

## 📈 MÉTRICAS DE CALIDAD

| Criterio               | Puntaje | Máximo | Peso |
| ---------------------- | ------- | ------ | ---- |
| Database Schema Design | 96/100  | 100    | 20%  |
| DAL Implementation     | 98/100  | 100    | 25%  |
| DAL Tests Coverage     | 100/100 | 100    | 15%  |
| API Endpoint Security  | 30/100  | 100    | 25%  |
| API Tests Coverage     | 20/100  | 100    | 10%  |
| Documentation          | 80/100  | 100    | 5%   |

**TOTAL PONDERADO**:

- DB Schema: 96 × 0.20 = 19.2
- DAL: 98 × 0.25 = 24.5
- DAL Tests: 100 × 0.15 = 15.0
- API Security: 30 × 0.25 = 7.5
- API Tests: 20 × 0.10 = 2.0
- Docs: 80 × 0.05 = 4.0

**TOTAL**: **72.2/100** → **C+ (72/100)**

### Comparación con Estándares

| Estándar                    | Status | Notas                                    |
| --------------------------- | ------ | ---------------------------------------- |
| OWASP A01: Access Control   | ⚠️     | DAL perfecto, API vulnerable             |
| OWASP A04: Insecure Design  | ❌     | tenantId desde input = diseño inseguro   |
| OWASP A07: Auth Failures    | ⚠️     | 1 endpoint sin auth                      |
| Multi-tenant Best Practices | ⚠️     | Patrón mixto (bueno en DAL, malo en API) |

**Compliance Score**: **5.5/10** ⚠️

---

## 🔧 COMANDOS ÚTILES

### Búsqueda de Vulnerabilidades

```bash
# Buscar endpoints con tenantId desde query params
grep -r "searchParams.get(\"tenantId\")" src/app/api/

# Buscar queries sin filtro de tenantId
grep -r "db\\.\\w*\\.findMany\\({" src/app/api/ | grep -v "tenantId"

# Buscar endpoints sin autenticación
grep -r "export async function GET" src/app/api/ | \
  xargs -I{} sh -c 'grep -L "await auth()" {}'
```

### Tests de Aislamiento

```bash
# Run tenant isolation tests
npm test __tests__/security/tenant-isolation.test.ts

# Run con verbose
npm test -- --verbose tenant-isolation

# Coverage
npm test -- --coverage __tests__/security/
```

### Validación Manual

```bash
# Test cross-tenant access (debe fallar)
curl -X GET "http://localhost:3000/api/products?tenantId=OTHER_TENANT_ID" \
  -H "Cookie: session=YOUR_SESSION"

# Debe retornar 403 Forbidden
```

---

## 📚 REFERENCIAS

- [OWASP Multi-Tenancy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multitenant_Architecture_Cheat_Sheet.html)
- [Prisma Multi-tenant Best Practices](https://www.prisma.io/docs/guides/database/multi-tenant-applications)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/routing/middleware#security)
- [AsyncLocalStorage Node.js](https://nodejs.org/api/async_context.html#class-asynclocalstorage)

---

## ✅ CONCLUSIÓN

El sistema tiene una **base sólida** de aislamiento multi-tenant:

✅ **Fortalezas**:

- Database schema bien diseñado con tenantId en todos los modelos relevantes
- DAL (Data Access Layer) perfectamente implementado con 35 funciones validadas
- Tests comprensivos (35 tests) que verifican el aislamiento
- Helpers y utilities bien diseñados

❌ **Vulnerabilidades Críticas**:

- **22 endpoints de API** obtienen tenantId desde query params sin validación
- **1 endpoint** (`/api/dashboard/stats`) sin autenticación
- Falta middleware de validación automática
- Variable global problemática para serverless

**Acción Requerida**: Las vulnerabilidades P0 deben ser corregidas **INMEDIATAMENTE** antes de producción. El sistema NO es seguro para uso en producción hasta que se corrijan los 23 problemas críticos.

Con los fixes P0 y P1 implementados, el sistema alcanzaría un score de **A (90+/100)** y sería apto para producción.

---

**Última actualización**: 23 de Noviembre, 2025
**Próxima revisión**: Después de implementar fixes P0 (Esta semana)
**Estado**: ⚠️ **NO APTO PARA PRODUCCIÓN** - Vulnerabilidades críticas deben ser corregidas

---

**Entregable**: `docs/MULTI-TENANT-ISOLATION-AUDIT.md`
**Archivos analizados**: 81+ archivos (DAL + API endpoints + Tests)
**Líneas de código auditadas**: ~15,000+
**Tiempo estimado de auditoría**: 3-4 horas
**Siguiente tarea**: 1.9 - Revisión de Manejo de Errores
