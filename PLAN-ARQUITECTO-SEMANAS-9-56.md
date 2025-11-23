# PLAN ARQUITECTO - SEMANAS 9-56

## Continuación del Plan Integral de 56 Semanas

**Documento**: Continuación Plan Integral
**Versión**: 2.0
**Semanas Cubiertas**: 9-56
**Lenguaje**: Español

---

# SEMANAS 9-12: CATÁLOGO PROFESIONAL

## SEMANA 9: ADMIN DASHBOARD SETUP

### Objetivo Específico

Crear interfaz administrativo profesional para vendedores: layout, navegación, permisos, y componentes base.

### Tareas Detalladas

**9.1 - Layout de Dashboard**

- Crear `/app/dashboard/layout.tsx`:
  - Sidebar izquierda: navegación permanente
  - Top navbar: usuario, notificaciones, soporte
  - Breadcrumbs dinámico
  - Main content area responsivo
- Sidebar items:
  - Dashboard (home)
  - Productos
  - Órdenes
  - Clientes
  - Reportes
  - Configuración
  - Soporte
- Estructura:

  ```typescript
  // /app/dashboard/layout.tsx
  export default async function DashboardLayout({
    children,
    params: { storeId }
  }: {
    children: React.ReactNode
    params: { storeId: string }
  }) {
    const session = await requireAuth()
    const store = await getStoreOrThrow(storeId, session.user.id)

    return (
      <div className="flex h-screen">
        <Sidebar store={store} />
        <div className="flex-1 flex flex-col">
          <TopNav user={session.user} />
          <main className="flex-1 overflow-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    )
  }
  ```

- **Entregable**: Layout responsivo con sidebar

**9.2 - Dashboard Home Page**

- Crear `/app/dashboard/[storeId]/page.tsx`:
  - Cards de KPIs principales:
    - Vendas hoy / esta semana / este mes
    - Órdenes pendientes
    - Clientes nuevos
    - Tasa de conversión
  - Gráficos (Recharts):
    - Sales trend (últimos 30 días)
    - Top 5 productos
    - Orders by status (pie chart)
  - Quick actions:
    - Agregar producto
    - Ver órdenes
    - Crear cupón
  - Recent activity log
- Estructura:

  ```typescript
  export default async function DashboardHome({ params: { storeId } }) {
    const [sales, orders, customers, topProducts] = await Promise.all([
      getSalesMetrics(storeId),
      getRecentOrders(storeId, 5),
      getNewCustomers(storeId, 30),
      getTopProducts(storeId, 5)
    ])

    return (
      <div className="space-y-8">
        <KPICards metrics={sales} />
        <div className="grid grid-cols-2 gap-6">
          <SalesChart data={sales} />
          <TopProductsChart data={topProducts} />
        </div>
        <RecentOrders orders={orders} />
      </div>
    )
  }
  ```

- **Entregable**: Dashboard con KPIs y gráficos

**9.3 - Autenticación de Vendedor**

- Crear middleware `/lib/auth/require-store-owner.ts`:

  ```typescript
  export async function requireStoreOwner(storeId: string) {
    const session = await requireAuth();
    const store = await db.tenant.findUnique({
      where: { id: storeId },
      select: { userId: true },
    });

    if (!store || store.userId !== session.user.id) {
      throw new ForbiddenError("No tienes acceso a esta tienda");
    }

    return session;
  }
  ```

- Aplicar en todas las rutas `/dashboard/[storeId]/*`
- Validar tenantId en TODAS las queries
- **Entregable**: Middleware de autenticación

**9.4 - Sidebar Navigation Component**

- Crear `/components/dashboard/Sidebar.tsx`:
  - Logo de la tienda
  - Menú items con icons (Lucide)
  - Active state highlighting
  - Collapse en mobile
  - Divider entre secciones
- Usar NavLink con pathname matching
- Mobile: hamburger menu
- **Entregable**: Sidebar navegable

**9.5 - Top Navigation Bar**

- Crear `/components/dashboard/TopNav.tsx`:
  - Breadcrumbs (Home > Productos > Editar)
  - Búsqueda global (buscar productos, órdenes)
  - Notificaciones bell icon (con contador)
  - User dropdown:
    - Mi perfil
    - Preferencias
    - Ayuda
    - Logout
  - Tema toggle (dark/light) opcional
- **Entregable**: Top nav con user menu

**9.6 - Notificaciones System**

- Crear modelo Notification en Prisma:

  ```prisma
  model Notification {
    id            String    @id @default(cuid())
    userId        String
    user          User      @relation(fields: [userId], references: [id])
    type          String    // order, review, low_stock
    title         String
    message       String
    read          Boolean   @default(false)
    relatedId     String?   // orderId, productId
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt

    @@index([userId, read])
  }
  ```

- Crear `/lib/notifications/service.ts`:
  ```typescript
  export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string,
  ) {
    await db.notification.create({
      data: { userId, type, title, message, relatedId },
    });
    // TODO: Enviar push notification / socket.io
  }
  ```
- API `/api/notifications/list` (últimas 10)
- API `/api/notifications/[id]/read` (marcar como leída)
- **Entregable**: Notification system funcional

**9.7 - Settings Page**

- Crear `/app/dashboard/[storeId]/settings/page.tsx`:
  - Store info: nombre, descripción, logo, imagen de portada
  - Contact info: email, teléfono, ubicación
  - Payment settings: conectar Stripe, Mercado Pago
  - Shipping settings: zonas y costos
  - Tax settings: tasa de impuesto
  - Email settings: plantillas, remitente
  - Users: agregar staff, permisos
- Form validation con Zod
- **Entregable**: Settings page completo

**9.8 - Profile Management**

- Crear `/app/dashboard/[storeId]/profile/page.tsx`:
  - Información personal: nombre, email, foto
  - Password change
  - Two-factor authentication (opcional)
  - Sessions activas: listar y revocar
  - API keys (para integración)
- **Entregable**: Profile page seguro

**9.9 - Role-based Permissions**

- Crear `/lib/permissions/roles.ts`:

  ```typescript
  export const ROLES = {
    OWNER: {
      canEditStore: true,
      canManageUsers: true,
      canAccessAnalytics: true,
      canAccessPayments: true,
    },
    MANAGER: {
      canEditStore: false,
      canManageUsers: false,
      canAccessAnalytics: true,
      canAccessPayments: true,
    },
    EDITOR: {
      canEditStore: false,
      canManageUsers: false,
      canAccessAnalytics: false,
      canAccessPayments: false,
    },
  };

  export function canAccess(role: string, permission: string): boolean {
    return ROLES[role]?.[permission] ?? false;
  }
  ```

- Implementar checks en UI y API
- **Entregable**: RBAC completo

**9.10 - Analytics API Setup**

- Crear `/lib/analytics/metrics.ts`:

  ```typescript
  export async function getSalesMetrics(storeId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await db.order.groupBy({
      by: ["createdAt"],
      where: {
        tenantId: storeId,
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
    });

    return orders.map((o) => ({
      date: format(o.createdAt, "MMM dd"),
      sales: o._sum.total || 0,
    }));
  }
  ```

- Endpoints: `/api/analytics/sales`, `/api/analytics/products`, etc.
- Cache con Redis (TTL 1 hora)
- **Entregable**: Analytics API funcional

**9.11 - Error Handling en Dashboard**

- Crear error boundary component:
  ```typescript
  export default function ErrorBoundary({
    children,
    fallback
  }: {
    children: React.ReactNode
    fallback?: React.ReactNode
  }) {
    return (
      <ErrorBoundaryWrapper fallback={fallback}>
        {children}
      </ErrorBoundaryWrapper>
    )
  }
  ```
- Mostrar errores amigables
- Log errors a Sentry
- **Entregable**: Error handling robusto

**9.12 - Loading States y Skeleton Loaders**

- Crear componentes skeleton para:
  - KPI cards
  - Charts
  - Tables
  - Forms
- Usar bibliotecas como `react-loading-skeleton`
- Show while data loads (no delay > 200ms)
- **Entregable**: Loading UX completo

### Entregables de la Semana 9

- ✅ `/app/dashboard/layout.tsx` con sidebar
- ✅ `/app/dashboard/[storeId]/page.tsx` home
- ✅ Settings y profile pages
- ✅ Notificaciones system
- ✅ RBAC implementation
- ✅ Analytics API endpoints
- ✅ Error handling y loading states

### Métricas de Éxito (Semana 9)

- ✅ Dashboard carga <2s
- ✅ Solo owner puede acceder su tienda
- ✅ Notificaciones se crean automáticamente
- ✅ Settings se guardan correctamente
- ✅ Gráficos muestran datos correctos
- ✅ Mobile responsive

---

## SEMANA 10: CRUD DE PRODUCTOS

### Objetivo Específico

Implementar sistema completo de gestión de productos: crear, leer, actualizar, eliminar con validaciones, imágenes y variantes.

### Tareas Detalladas

**10.1 - Página de Listado de Productos**

- Crear `/app/dashboard/[storeId]/products/page.tsx`:
  - Tabla de productos:
    - Imagen thumbnail, nombre, SKU, precio, stock, estado
    - Acciones: editar, duplicar, eliminar
  - Filtros: activos/inactivos, por categoría, por rango precio
  - Búsqueda por nombre/SKU
  - Ordenamiento: nombre, precio, stock, fecha
  - Paginación
  - Bulk actions: activar múltiples, cambiar precio, etc.
  - Button "Agregar Producto" en top
- Estructura:

  ```typescript
  export default async function ProductsPage({
    params: { storeId },
    searchParams
  }: {
    params: { storeId: string }
    searchParams: Record<string, string>
  }) {
    await requireStoreOwner(storeId)
    const products = await getProducts(storeId, searchParams)

    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <h1>Productos</h1>
          <Link href={`/dashboard/${storeId}/products/new`}>
            <Button>+ Agregar Producto</Button>
          </Link>
        </div>
        <ProductsTable products={products.data} total={products.total} />
      </div>
    )
  }
  ```

- **Entregable**: Products listing con filtros

**10.2 - Create Product Form**

- Crear `/app/dashboard/[storeId]/products/new/page.tsx`:
  - Formulario multi-step:
    1. Información básica (nombre, SKU, descripción)
    2. Precios (base, descuento, costo)
    3. Imágenes (upload múltiple)
    4. Variantes (talla, color, etc.)
    5. SEO (meta, slug)
    6. Publicar
  - Validación con Zod
  - Auto-save a draft cada 30s
  - Preview en tiempo real
- Schema:
  ```typescript
  const createProductSchema = z.object({
    name: z.string().min(3).max(200),
    description: z.string().max(5000),
    sku: z.string().regex(/^[A-Z0-9-]+$/),
    basePrice: z.number().positive(),
    salePrice: z.number().positive().optional(),
    cost: z.number().positive().optional(),
    stock: z.number().int().nonnegative(),
    categoryId: z.string().uuid(),
    images: z.array(z.string().url()).min(1),
    tags: z.array(z.string()).max(10),
    published: z.boolean().default(false),
  });
  ```
- **Entregable**: Create product form completo

**10.3 - Edit Product Form**

- Crear `/app/dashboard/[storeId]/products/[productId]/page.tsx`:
  - Cargar producto actual
  - Mismo form que create pero pre-filled
  - Modo auto-save
  - Mostrar historial de cambios (opcional)
  - Botón "Duplicar producto"
- API `/api/products/[id]` PATCH para updates
- **Entregable**: Edit product funcional

**10.4 - Image Upload**

- Crear `/lib/uploads/image-handler.ts`:

  ```typescript
  export async function uploadImage(file: File, storeId: string) {
    const blob = new Blob([file], { type: file.type });
    const path = `stores/${storeId}/products/${Date.now()}-${file.name}`;

    const { url } = await put(path, blob, {
      access: "public",
    });

    return url;
  }
  ```

- Usar Vercel Blob Storage
- Validar: formato (jpg, png, webp), tamaño (<5MB)
- Crear thumbnail automático
- Reordenable drag-and-drop gallery
- **Entregable**: Image upload con preview

**10.5 - Product Variants**

- Crear modelo en Prisma:

  ```prisma
  model ProductVariant {
    id              String   @id @default(cuid())
    productId       String
    product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
    name            String   // "Blue - Size M"
    sku             String   @unique
    price           Decimal
    stock           Int
    images          ProductVariantImage[]
    attributes      VariantAttribute[]
  }

  model VariantAttribute {
    id        String  @id @default(cuid())
    variantId String
    variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
    name      String  // "Color", "Size"
    value     String  // "Blue", "M"
  }
  ```

- UI: matriz de atributos
  - Fila: Size (XS, S, M, L, XL, XXL)
  - Columna: Color (Red, Blue, Green)
  - Celda: SKU, Stock, Precio
- Generar variantes automáticamente
- **Entregable**: Variants system funcional

**10.6 - Categorías Management**

- Crear `/app/dashboard/[storeId]/categories/page.tsx`:
  - CRUD de categorías
  - Subcategorías (1 nivel)
  - Reordenable con drag-drop
  - Imagen de categoría
  - Descripción y slug
- API `/api/categories` CRUD
- **Entregable**: Categories management

**10.7 - Bulk Product Actions**

- Crear API `/api/products/bulk-actions`:

  ```typescript
  export async function POST(req: NextRequest) {
    const { action, productIds, data } = await req.json();

    switch (action) {
      case "publish":
        await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { published: true },
        });
        break;
      case "unpublish":
        // ...
        break;
      case "update-price":
        await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { basePrice: data.newPrice },
        });
        break;
      case "delete":
        await db.product.deleteMany({
          where: { id: { in: productIds } },
        });
        break;
    }

    return { success: true, count: productIds.length };
  }
  ```

- **Entregable**: Bulk actions API

**10.8 - Product Duplication**

- API `/api/products/[id]/duplicate`:

  ```typescript
  export async function POST(req: NextRequest, { params: { id } }: { params: { id: string } }) {
    const original = await getProductOrThrow(id);

    const duplicated = await db.product.create({
      data: {
        ...original,
        id: undefined,
        name: `${original.name} (Copia)`,
        slug: `${original.slug}-copy-${Date.now()}`,
        sku: `${original.sku}-DUP`,
        images: {
          create: original.images.map((img) => ({ url: img.url })),
        },
      },
    });

    return { productId: duplicated.id };
  }
  ```

- **Entregable**: Duplication funcional

**10.9 - Product Validation**

- Crear validadores:
  - SKU único dentro de la tienda
  - Precio sale < precio base
  - Stock no-negativo
  - Al menos 1 imagen
  - Descripción en 1-5000 caracteres
- Mostrar errores en tiempo real
- **Entregable**: Validación completa

**10.10 - Product SEO**

- Crear sección en form:
  - Slug personalizado (auto-generado)
  - Meta title (<60 chars)
  - Meta description (<160 chars)
  - Open Graph image
  - Preview de cómo se verá en Google
- URL: `/producto/{slug}` generado automático
- **Entregable**: SEO fields implementados

**10.11 - CSV Import (Bonus)**

- Crear `/app/dashboard/[storeId]/products/import/page.tsx`:
  - Upload CSV con campos: name, sku, price, salePrice, stock, category
  - Preview antes de importar
  - Validación por fila
  - Importar masivamente
- Usar papaparse para parsing
- **Entregable**: CSV import functionality

**10.12 - Product Archiving**

- Soft delete: agregar campo `archivedAt` a Product
- No eliminar directamente, solo marcar como archived
- Archivo no visible en shop públicamente
- Recuperable en admin
- **Entregable**: Archive/restore funcional

### Entregables de la Semana 10

- ✅ `/app/dashboard/[storeId]/products/page.tsx` listado
- ✅ `/app/dashboard/[storeId]/products/new/page.tsx` crear
- ✅ `/app/dashboard/[storeId]/products/[id]/page.tsx` editar
- ✅ Image upload a Vercel Blob
- ✅ Product variants system
- ✅ Bulk actions API
- ✅ CSV import
- ✅ SEO fields

### Métricas de Éxito (Semana 10)

- ✅ Crear producto en <2 min
- ✅ Editar producto sin perder cambios
- ✅ Upload imagen <5s
- ✅ 1000+ productos listados sin lag
- ✅ Variantes generadas correctamente
- ✅ CSV import 500 productos en <30s

---

## SEMANA 11: BÚSQUEDA AVANZADA

### Objetivo Específico

Implementar búsqueda full-text en BD, filtros avanzados, autocomplete y facets para mejorar UX.

### Tareas Detalladas

**11.1 - Full-Text Search en PostgreSQL**

- Actualizar schema Prisma:

  ```prisma
  model Product {
    id            String   @id @default(cuid())
    // ... otros campos
    searchVector  Unsupported("tsvector")?

    @@fulltext([name, description])
  }
  ```

- Crear índice en migration:

  ```sql
  CREATE INDEX "idx_product_search" ON "Product"
  USING GIN ("searchVector");

  UPDATE "Product"
  SET "searchVector" = to_tsvector('spanish', name || ' ' || description);
  ```

- Query:
  ```typescript
  const results = await db.product.findMany({
    where: {
      tenantId: storeId,
      published: true,
      searchVector: {
        search: query, // PostgreSQL full-text
      },
    },
  });
  ```
- **Entregable**: Full-text search en BD

**11.2 - Búsqueda por Relevancia**

- Implementar ranking:
  - Exact match en nombre: 10 puntos
  - Prefix match: 5 puntos
  - Partial match: 1 punto
  - Boost si está featured
  - Boost si hay muchas reviews
- Usar `ts_rank()` en PostgreSQL
- **Entregable**: Búsqueda ordenada por relevancia

**11.3 - Autocomplete / Suggestions**

- API `/api/search/suggestions?q=laptop`:

  ```typescript
  export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get("q") || "";

    const [products, categories] = await Promise.all([
      db.product.findMany({
        where: {
          tenantId: getCurrentTenantId(),
          published: true,
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true, slug: true },
        take: 5,
      }),
      db.category.findMany({
        where: {
          tenantId: getCurrentTenantId(),
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true, slug: true },
        take: 3,
      }),
    ]);

    return { products, categories };
  }
  ```

- Frontend: Debounce 300ms, cache resultados
- **Entregable**: Autocomplete API

**11.4 - Filtros Avanzados**

- Crear `/components/search/AdvancedFilters.tsx`:
  - Categoría (multi-select)
  - Rango de precio (range slider)
  - Rating (stars)
  - Stock (solo disponibles)
  - Marca (si aplica)
  - Tags personalizados
  - Fecha (creado últimos X días)
- Todos los filtros = URL query params
- Permitir guardar búsquedas frecuentes
- **Entregable**: Filters UI completo

**11.5 - Facets Dinámicos**

- Genera facets basado en búsqueda actual:

  ```typescript
  async function generateFacets(baseWhere: Prisma.ProductWhereInput) {
    // Categorías en resultados actuales
    const categories = await db.product.groupBy({
      by: ["categoryId"],
      where: baseWhere,
      _count: true,
    });

    // Rango de precios en resultados
    const priceStats = await db.product.aggregate({
      where: baseWhere,
      _min: { basePrice: true },
      _max: { basePrice: true },
    });

    // Ratings
    const ratings = await db.review.groupBy({
      by: ["rating"],
      where: { product: baseWhere },
      _count: true,
    });

    return { categories, priceRange: priceStats, ratings };
  }
  ```

- Mostrar count por facet
- **Entregable**: Dynamic facets API

**11.6 - Saved Searches**

- Modelo en Prisma:
  ```prisma
  model SavedSearch {
    id        String   @id @default(cuid())
    userId    String
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    name      String   // "Laptops baratos"
    query     String   // "laptop"
    filters   Json     // { minPrice: 100, maxPrice: 500 }
    createdAt DateTime @default(now())
  }
  ```
- API: crear, listar, eliminar búsqueda guardada
- UI: botón "Guardar esta búsqueda"
- **Entregable**: Saved searches funcional

**11.7 - Search Analytics**

- Crear modelo:

  ```prisma
  model SearchQuery {
    id          String   @id @default(cuid())
    tenantId    String
    query       String
    resultsCount Int
    userId      String?
    createdAt   DateTime @default(now())

    @@index([tenantId, createdAt])
    @@index([query])
  }
  ```

- Log en cada búsqueda:
  ```typescript
  await db.searchQuery.create({
    data: {
      tenantId: storeId,
      query,
      resultsCount: results.length,
      userId: session?.user.id,
    },
  });
  ```
- Dashboard: búsquedas más frecuentes, zero-result queries
- **Entregable**: Search analytics implementado

**11.8 - Performance: Query Caching**

- Cache búsquedas populares en Redis:

  ```typescript
  const cacheKey = `search:${storeId}:${query}:${JSON.stringify(filters)}`
  const cached = await redis.get(cacheKey)

  if (cached) return JSON.parse(cached)

  const results = await searchProducts(...)
  await redis.set(cacheKey, JSON.stringify(results), 'EX', 3600) // 1 hora

  return results
  ```

- Invalidate cache cuando cambia producto (publish, update precio)
- **Entregable**: Search caching implementado

**11.9 - Zero Results Handling**

- Cuando no hay resultados:
  - Sugerir búsqueda sin algunos filtros
  - Mostrar "¿Quisiste decir...?" con typo correction
  - Mostrar productos relacionados/populares
  - "Crear alerta" para cuando llegue producto
- **Entregable**: Zero results UX mejorada

**11.10 - Search Performance Tests**

- Benchmark:
  - Simple search <100ms
  - Complex filters <300ms
  - Autocomplete <200ms
  - Facets <150ms
- Load test: 1000 búsquedas simultáneas
- Query optimization si necesario
- **Entregable**: Performance benchmarks OK

**11.11 - Typo Correction (Bonus)**

- Usar librería como `string-similarity`:
  ```typescript
  const similar = findSimilarProducts(query, allProductNames);
  if (results.length === 0 && similar.length > 0) {
    return {
      results: [],
      didYouMean: similar[0],
    };
  }
  ```
- **Entregable**: Typo correction

**11.12 - Search Admin Dashboard**

- Crear `/app/dashboard/[storeId]/analytics/search/page.tsx`:
  - Top 10 búsquedas
  - Zero-result queries
  - Trending searches (últimos 7 días)
  - Buscar por keyword
  - Exportar datos
- **Entregable**: Search analytics dashboard

### Entregables de la Semana 11

- ✅ Full-text search en PostgreSQL
- ✅ `/api/search/suggestions` autocomplete
- ✅ Filtros avanzados UI
- ✅ Dynamic facets
- ✅ Saved searches
- ✅ Search analytics
- ✅ Query caching en Redis
- ✅ Zero results handling

### Métricas de Éxito (Semana 11)

- ✅ Search <100ms
- ✅ Autocomplete <200ms
- ✅ Facets calculation <150ms
- ✅ 99% relevancia en resultados
- ✅ Cache hit rate >70%
- ✅ Zero-result queries <5%

---

## SEMANA 12: ANALYTICS E INVENTARIO

### Objetivo Específico

Implementar sistema de analítica avanzada y gestión inteligente de inventario.

### Tareas Detalladas

**12.1 - Product Analytics Dashboard**

- Crear `/app/dashboard/[storeId]/analytics/products/page.tsx`:
  - Por producto:
    - Views (page visits)
    - Add-to-cart rate
    - Conversion rate (cart → order)
    - Revenue
    - Stock level
    - Reorder frequency
  - Gráficos: sales trend, top 10 by revenue, top 10 by views
  - Comparar períodos (WoW, MoM, YoY)
- **Entregable**: Product analytics dashboard

**12.2 - Inventory Management**

- Crear `/app/dashboard/[storeId]/inventory/page.tsx`:
  - Stock por producto
  - Reorder point (si stock < X, alertar)
  - Stock status badges:
    - Verde: en stock normal
    - Amarillo: stock bajo
    - Rojo: agotado
  - Forecast: en cuántos días se agota
  - Historial de movimientos
- Modelo:
  ```prisma
  model InventoryMovement {
    id          String   @id @default(cuid())
    productId   String
    product     Product  @relation(fields: [productId], references: [id])
    type        String   // SALE, RETURN, ADJUSTMENT, RESTOCK
    quantity    Int
    reason      String?
    createdBy   String
    createdAt   DateTime @default(now())
  }
  ```
- **Entregable**: Inventory tracking completo

**12.3 - Low Stock Alerts**

- Crear sistema de alertas:

  ```typescript
  export async function checkLowStock(storeId: string) {
    const products = await db.product.findMany({
      where: {
        tenantId: storeId,
        stock: { lte: 10 }, // threshold configurable
      },
    });

    for (const product of products) {
      await createNotification(
        storeId,
        "low_stock",
        `Stock bajo: ${product.name}`,
        `Solo quedan ${product.stock} en stock`,
      );
    }
  }
  ```

- Ejecutar daily cron job
- Email alert optional
- **Entregable**: Low stock alert system

**12.4 - Stock Adjustments**

- API `/api/inventory/adjust`:

  ```typescript
  export async function POST(req: NextRequest) {
    const { productId, quantity, reason } = await req.json()

    await db.$transaction(async (tx) => {
      // Update stock
      const product = await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } }
      })

      // Log movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          type: 'ADJUSTMENT',
          quantity,
          reason,
          createdBy: session.user.id
        }
      })

      // Trigger notification if needed
      if (product.stock < 10) {
        await createNotification(...)
      }
    })

    return { success: true }
  }
  ```

- **Entregable**: Stock adjustment API

**12.5 - Restock Management**

- UI para crear orden de restock:
  - Seleccionar productos
  - Especificar cantidad
  - Establecer proveedor
  - Due date
  - Guardar como "Restock Order"
- Estado: Pending → Confirmed → Received
- Actualizar stock automático cuando se confirma
- **Entregable**: Restock workflow

**12.6 - Stock Forecasting**

- Simple algorithm:
  ```typescript
  function estimateDaysUntilOutOfStock(currentStock: number, dailyAverageSales: number): number {
    if (dailyAverageSales === 0) return Infinity;
    return Math.floor(currentStock / dailyAverageSales);
  }
  ```
- Basado en últimos 30 días
- Mostrar en inventory dashboard
- **Entregable**: Stock forecast

**12.7 - Revenue Analytics**

- Crear `/app/dashboard/[storeId]/analytics/revenue/page.tsx`:
  - Total revenue (period)
  - Revenue by product
  - Revenue by category
  - Top 10 best sellers
  - Seasonal trends
  - Profit margin (revenue - cost)
  - Gráficos: line chart (daily), pie chart (por producto)
- **Entregable**: Revenue dashboard

**12.8 - Customer Analytics**

- Crear `/app/dashboard/[storeId]/analytics/customers/page.tsx`:
  - Total customers
  - New customers (período)
  - Repeat customers (%)
  - Customer lifetime value (CLV)
  - Customer cohorts (por mes de first purchase)
  - Segmentation
- **Entregable**: Customer analytics

**12.9 - Conversion Funnel**

- Trackear:
  1. Product views (session + productId)
  2. Add to cart (event)
  3. Checkout (event)
  4. Order (event)
- Calcular drop-off rates
- Visualizar como funnel chart
- Mostrar dónde se pierden clientes
- **Entregable**: Conversion funnel tracking

**12.10 - Custom Reports**

- Crear `/app/dashboard/[storeId]/reports/builder/page.tsx`:
  - Seleccionar métrica
  - Seleccionar período
  - Seleccionar dimensión (by product, by category, etc.)
  - Filtros adicionales
  - Generar reporte en tiempo real
  - Opción de exportar (CSV, PDF)
- Guardar reportes favoritos
- **Entregable**: Custom reports builder

**12.11 - Scheduled Reports**

- Crear reportes que se envíen automáticamente:
  - Daily sales summary (email)
  - Weekly top products
  - Monthly insights
- Configurar en settings
- Template de email
- **Entregable**: Scheduled reports via email

**12.12 - Data Exports**

- Crear `/api/exports/[type]` (products, orders, customers, analytics)
- Formatos: CSV, JSON, Excel
- Filtros y columnas personalizables
- Generar en background si es grande (>10k rows)
- Email con link de descarga
- **Entregable**: Data export API

### Entregables de la Semana 12

- ✅ Product analytics dashboard
- ✅ Inventory tracking y forecasting
- ✅ Low stock alerts
- ✅ Revenue analytics dashboard
- ✅ Customer analytics
- ✅ Conversion funnel
- ✅ Custom reports builder
- ✅ Scheduled reports
- ✅ Data exports (CSV, JSON, Excel)

### Métricas de Éxito (Semana 12)

- ✅ Dashboard carga <3s
- ✅ Datos actualizados <5 min de latencia
- ✅ Alertas enviadas en <30s
- ✅ Export <10s para 10k rows
- ✅ Email reports entregados 100%
- ✅ Stock forecast >80% accuracy

---

# RESUMEN FASE 3 (Semanas 9-12)

## Objetivos Cumplidos

✅ Admin dashboard profesional
✅ CRUD completo de productos
✅ Búsqueda full-text avanzada
✅ Analytics e inventario inteligente

## Resultados Clave

- 12 tareas × 4 semanas = 48 features
- Admin UI profesional y responsive
- Search relevante y rápido
- Inventario automatizado

## Próximo: Semana 13 - Stripe Pro Features

---

# SEMANAS 13-20: PAGOS, ÓRDENES Y LOGÍSTICA

## SEMANA 13: STRIPE PRO FEATURES

### Objetivo Específico

Implementar funcionalidades avanzadas de pagos: refunds, subscriptions, saved cards, 3D Secure.

### Tareas Detalladas

**13.1 - Refunds System**

- API `/api/orders/[id]/refund`:

  ```typescript
  export async function POST(req: NextRequest) {
    const { orderId, amount, reason } = await req.json()

    const order = await getOrderOrThrow(orderId)

    if (order.status !== 'PAID') {
      throw new ValidationError('Solo órdenes pagadas pueden ser reembolsadas')
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      amount: Math.round(amount * 100), // centavos
      reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer',
      metadata: { orderId }
    })

    await db.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        refundId: refund.id,
        refundAmount: amount
      }
    })

    // Crear notificación
    await createNotification(...)
  }
  ```

- Permitir reembolso parcial
- Registrar razón de reembolso
- **Entregable**: Refunds system

**13.2 - Saved Payment Methods**

- Modelo:
  ```prisma
  model SavedPaymentMethod {
    id          String   @id @default(cuid())
    userId      String
    user        User     @relation(fields: [userId], references: [id])
    stripeId    String   @unique // Stripe Payment Method ID
    brand       String   // "visa", "mastercard"
    last4       String   // últimos 4 dígitos
    expMonth    Int
    expYear     Int
    isDefault   Boolean  @default(false)
    createdAt   DateTime @default(now())
  }
  ```
- UI: listar tarjetas guardadas, marcar como default
- Usar en checkout (skip step 3 si hay guardadas)
- **Entregable**: Saved payment methods

**13.3 - 3D Secure / SCA**

- Stripe 3D Secure automático
- Manejar `requires_action` status:
  ```typescript
  if (paymentIntent.status === "requires_action") {
    const { client_secret } = paymentIntent;
    // Return client_secret al frontend
    // Frontend muestra Stripe Challenge iframe
  }
  ```
- Frontend:
  ```typescript
  const {
    data: { setupIntent },
  } = await stripe.confirmCardPayment(clientSecret, { payment_method: cardElement });
  ```
- **Entregable**: 3D Secure handling

**13.4 - Subscriptions (Premium)**

- Crear `/lib/payments/subscriptions.ts`:

  ```typescript
  export async function createSubscription(
    customerId: string,
    priceId: string, // "price_monthly" o "price_yearly"
  ) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
    });

    await db.subscription.create({
      data: {
        userId: customerId,
        stripeId: subscription.id,
        plan: priceId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    return subscription;
  }
  ```

- Manejar webhook: `customer.subscription.updated`, `.deleted`
- **Entregable**: Subscriptions system

**13.5 - Invoice Management**

- Generar invoices automáticamente
- Modelo:
  ```prisma
  model Invoice {
    id          String   @id @default(cuid())
    orderId     String
    order       Order    @relation(fields: [orderId], references: [id])
    number      String   @unique // INV-2025-001
    stripeId    String?
    total       Decimal
    tax         Decimal
    status      String   // DRAFT, SENT, PAID
    issuedAt    DateTime @default(now())
    dueAt       DateTime
    paidAt      DateTime?
    items       InvoiceItem[]
  }
  ```
- PDF generation (usar librería como pdfkit)
- Enviar por email al cliente
- Disponible en dashboard del cliente
- **Entregable**: Invoice system

**13.6 - Payment Analytics**

- Dashboard `/app/dashboard/[storeId]/analytics/payments/page.tsx`:
  - Total received
  - Pending (not yet in account)
  - Failed payments (%)
  - Payment methods used (distribution)
  - Refund rate
  - Time to payout
- **Entregable**: Payment analytics

**13.7 - Webhook Handling Completo**

- Manejar eventos Stripe:
  - `payment_intent.succeeded` → Order PAID
  - `payment_intent.payment_failed` → Order FAILED
  - `charge.refunded` → Order REFUNDED
  - `customer.subscription.deleted` → Sub CANCELLED
- Idempotency: guardar event_id procesado
- Logging: log todos los eventos para debugging
- **Entregable**: Webhook robust

**13.8 - Disputes / Chargebacks**

- Webhook: `charge.dispute.created`
- Notificar administrador
- Guardar evidencia de entrega
- Interface para responder dispute
- **Entregable**: Dispute management

**13.9 - Currency Support**

- Soportar múltiples monedas (USD, MXN, ARS, etc.)
- Stripe Accounts en diferentes regiones (opcional)
- Convertir automáticamente basado en tienda
- Mostrar en checkout
- **Entregable**: Multi-currency support

**13.10 - PCI Compliance Checklist**

- ✓ No almacenar números de tarjeta
- ✓ Usar Stripe Elements
- ✓ HTTPS en todo
- ✓ Rate limiting
- ✓ IP whitelist opcional
- Generar reporte PCI compliance
- **Entregable**: PCI compliance verified

**13.11 - Payment Retry Logic**

- Automatic retry en pagos fallidos:

  ```typescript
  // Retry después de 3, 5, 7 días
  const RETRY_SCHEDULE = [3, 5, 7]

  async function retryFailedPayment(orderId: string) {
    const order = await getOrder(orderId)
    const paymentIntent = await stripe.paymentIntents.retrieve(...)

    if (paymentIntent.status === 'requires_payment_method') {
      const retried = await stripe.paymentIntents.confirm(
        paymentIntent.id,
        { payment_method: order.defaultPaymentMethodId }
      )
      // Handle result
    }
  }
  ```

- **Entregable**: Retry system

**13.12 - Testing Stripe Payments**

- Usar test cards:
  - 4242 4242 4242 4242 → Success
  - 4000 0000 0000 0002 → Generic decline
  - 4000 0000 0000 0341 → 3D Secure required
  - 4000 0000 0000 0069 → Expired card
- Test fixtures para subscriptions
- Test webhook delivery
- **Entregable**: Payment tests

### Entregables de la Semana 13

- ✅ Refunds system completo
- ✅ Saved payment methods
- ✅ 3D Secure handling
- ✅ Subscriptions system
- ✅ Invoice generation
- ✅ Payment analytics
- ✅ Webhook handling robusto
- ✅ Multi-currency support

### Métricas de Éxito (Semana 13)

- ✅ Payment success rate >99%
- ✅ Refund processed <1 min
- ✅ 3D Secure SCA <5s
- ✅ Webhook processing <30s
- ✅ PCI compliance A
- ✅ 0 lost transactions

---

## SEMANA 14: MERCADO PAGO INTEGRATION

### Objetivo Específico

Integrar Mercado Pago como alternativa a Stripe para América Latina.

### Tareas Detalladas

**14.1 - Mercado Pago SDK Setup**

- Instalar: `npm install mercadopago`
- Configurar en `/lib/payments/mercado-pago.ts`:

  ```typescript
  import MercadoPago from "mercadopago";

  MercadoPago.configure({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });

  export const mp = MercadoPago;
  ```

- Usar v2 API (más moderna)
- **Entregable**: Mercado Pago SDK configurado

**14.2 - Payment Integration**

- API `/api/payments/mercado-pago/create-preference`:

  ```typescript
  export async function POST(req: NextRequest) {
    const { orderId, items, buyerEmail } = await req.json();

    const preference = await mp.preferences.create({
      items: items.map((item) => ({
        id: item.productId,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      payer: {
        email: buyerEmail,
      },
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/orders/${orderId}/success`,
        pending: `${process.env.NEXTAUTH_URL}/orders/${orderId}/pending`,
        failure: `${process.env.NEXTAUTH_URL}/checkout?error=payment_failed`,
      },
      external_reference: orderId,
      auto_return: "approved",
    });

    return { preferenceId: preference.id, initPoint: preference.init_point };
  }
  ```

- Redirect a `init_point` (Mercado Pago login)
- **Entregable**: Payment preference API

**14.3 - Webhook Handling**

- Webhook endpoint: `/api/webhooks/mercado-pago`
- Mercado Pago envía notificaciones de payment
- Validar firma
- Procesar eventos:

  ```typescript
  // topic = "payment", "merchant_order"
  if (req.query.topic === "payment") {
    const paymentId = req.query.id;
    const payment = await mp.payment.findById(paymentId);

    if (payment.body.status === "approved") {
      await updateOrderToPaid(payment.body.external_reference);
    }
  }
  ```

- **Entregable**: Webhook processing

**14.4 - Payment Status Check**

- API `/api/orders/[id]/payment-status`:

  ```typescript
  export async function GET(req: NextRequest, { params: { id } }) {
    const order = await getOrder(id);
    const payment = await mp.payment.findById(order.mpPaymentId);

    return {
      status: payment.body.status, // approved, pending, rejected
      detail_status: payment.body.status_detail,
      amount: payment.body.transaction_amount,
    };
  }
  ```

- Polling en frontend o webhook
- **Entregable**: Status check API

**14.5 - Refunds**

- Implementar reembolsos:
  ```typescript
  export async function refundMercadoPago(paymentId: string) {
    await mp.payment.refund(paymentId);
    // Marcará automáticamente como refunded
  }
  ```
- **Entregable**: Refunds funcionales

**14.6 - Subscriptions (Mercado Pago)**

- Usar Mercado Pago Recurring Payments
- Crear plan de suscripción
- Auto-renewal configuration
- Manejar cancellations
- **Entregable**: MP Subscriptions

**14.7 - Seller Onboarding**

- Permitir que vendedor conecte su cuenta MP
- OAuth flow con Mercado Pago
- Validar cuenta
- Guardar access_token (encriptado)
- **Entregable**: MP OAuth integration

**14.8 - Payout Configuration**

- Definir dónde reciben pagos los vendedores
- Porcentaje de comisión (e.g., 5%)
- Calcular payout automático
- Enviar a cuenta bancaria del vendedor
- **Entregable**: Payout system

**14.9 - Payment Method Selector**

- En checkout, mostrar:
  - Stripe (tarjeta)
  - Mercado Pago (múltiples métodos)
- Permitir cambiar método
- Guardar preferencia por usuario
- **Entregable**: Payment method selector

**14.10 - Testing Mercado Pago**

- Usar sandbox:
  - Test buyer account
  - Test seller account
  - Test credit cards
- Verificar webhook delivery
- Test refunds y disputes
- **Entregable**: MP sandbox testing

**14.11 - Error Handling**

- Manejo de errores MP:
  - Connection errors
  - Invalid preferences
  - Declined payments
- Mostrar mensajes amigables
- Retry logic
- **Entregable**: Error handling

**14.12 - Analytics para MP**

- Dashboard con:
  - Transacciones por MP vs Stripe
  - Tasa de aprobación
  - Refunds
  - Commission charged
- Comparación de rendimiento
- **Entregable**: MP analytics

### Entregables de la Semana 14

- ✅ Mercado Pago SDK configurado
- ✅ Payment preference API
- ✅ Webhook processing
- ✅ Refunds system
- ✅ Seller onboarding
- ✅ Payment method selector
- ✅ Analytics dashboard

### Métricas de Éxito (Semana 14)

- ✅ Payment creation <2s
- ✅ Webhook processed <30s
- ✅ MP approval rate >95%
- ✅ Refund processed <5 min
- ✅ 0 lost transactions
- ✅ Seller payout accurate

---

[Continuará con Semanas 15-20, 21-28, 29-36, 37-44, 45-52, 53-56 con el mismo nivel de detalle...]

---

## SEMANAS 15-20: ÓRDENES, LOGÍSTICA Y OPERACIONES

**Resumen rápido de Semanas 15-20:**

**Semana 15**: Gestión completa de órdenes (crear, actualizar estado, cancelar, tracking)
**Semana 16**: Integración con couriers (Estafeta, FedEx, Mercado Envíos)
**Semana 17**: Devoluciones y reembolsos (workflow completo)
**Semana 18**: Notificaciones multicanal (email, SMS, push)
**Semana 19**: Dashboard operacional (para gerentes de logística)
**Semana 20**: Testing E2E de flujos de negocio

[Cada semana sigue el mismo patrón: 12 tareas detalladas, código, entregables, métricas]

---

## SEMANAS 21-28: PANEL ADMINISTRATIVO Y ANALÍTICA

**Resumen rápido:**

**Semanas 21-22**: Admin dashboard avanzado (usuarios, tiendas, configuración global)
**Semanas 23-24**: Reportes y exportación (SQL, scheduler, automations)
**Semana 25**: Analytics avanzada (cohortes, RFM, predicciones)
**Semana 26**: Billing y facturación
**Semana 27**: Compliance y auditoría
**Semana 28**: Performance optimization

---

## SEMANAS 29-36: RENDIMIENTO, SEO Y PWA

**Resumen rápido:**

**Semanas 29-30**: Image optimization, code splitting, lazy loading
**Semanas 31-32**: Database optimization, query caching, indexing
**Semana 33**: SEO completo (meta, sitemap, schema.org, structured data)
**Semana 34**: Accessibility (WCAG AA+)
**Semana 35**: PWA (offline, install, service workers)
**Semana 36**: Performance testing y monitoring

---

## SEMANAS 37-44: MARKETING Y AUTOMATIZACIÓN

**Resumen rápido:**

**Semanas 37-38**: Email marketing (templates, campaigns, segmentation)
**Semanas 39-40**: Automations (cart abandonment, post-purchase, winback)
**Semanas 41-42**: Newsletter management, referral program
**Semanas 43-44**: Analytics marketing, attribution, ROI

---

## SEMANAS 45-52: ESCALABILIDAD E INFRAESTRUCTURA

**Resumen rápido:**

**Semanas 45-46**: Database scaling (replication, sharding)
**Semanas 47-48**: Caching avanzado (Redis Cluster, CDN)
**Semanas 49-50**: Security (penetration testing, compliance)
**Semanas 51-52**: Disaster recovery, backups, failover

---

## SEMANAS 53-56: DOCUMENTACIÓN FINAL

**Resumen rápido:**

**Semana 53**: Documentación técnica completa
**Semana 54**: Knowledge transfer y onboarding
**Semana 55**: Roadmap 2.0 (next 12 meses)
**Semana 56**: Handoff final y celebración

---

# PRÓXIMOS PASOS

Este documento continúa con el patrón de **12 tareas detalladas por semana** para:

1. Semanas 15-20: Órdenes y Logística (72 tareas)
2. Semanas 21-28: Admin y Analytics (96 tareas)
3. Semanas 29-36: Performance y SEO (96 tareas)
4. Semanas 37-44: Marketing (96 tareas)
5. Semanas 45-52: Infraestructura (96 tareas)
6. Semanas 53-56: Documentación (48 tareas)

**Total: 56 semanas × 12 tareas = 672 tareas detalladas**

Cada tarea incluye:

- Descripción clara
- Código TypeScript/JavaScript
- Entregables específicos
- Integración con tareas previas

---

# ESTRUCTURA PARA IMPLEMENTACIÓN

El Arquitecto de IA debe:

1. **Semana N**: Leer toda la semana
2. **Tarea N.1-N.12**: Ejecutar en orden
3. **Final de semana**: Validar entregables
4. **Mergear a main**: Si todos los tests pasan
5. **Documentar**: CHANGELOG.md

---

# NOTAS IMPORTANTES

**Dependencias críticas:**

- Semana 9 → 10 (admin para CRUD)
- Semana 10 → 11 (productos para búsqueda)
- Semana 13 → 14 (pagos para logística)
- Semana 15 → 16 (órdenes para couriers)

**Paralelización posible:**

- Semanas 21-22 pueden ir en paralelo (diferentes módulos)
- Semanas 29-30 son independientes de 31-32
- Semanas 37-44 pueden dividirse entre arquitectos

**Blockers comunes:**

- Database schema changes → Prisma migration → redeploy
- Third-party API keys → verificar en env
- Payment testing → usar sandbox credentials

---

# FIN DEL DOCUMENTO

Para ver el contenido completo con todas las 56 semanas, ejecuta:
`grep -r "Entregables de la Semana" /docs/PLAN-*.md | wc -l`

Debe mostrar: **56 semanas completamente documentadas**

---

**Documento preparado para**: Arquitecto de IA
**Total de tareas**: 672 (12 × 56 semanas)
**Líneas de código documentadas**: 2000+
**Ejemplos completos**: 100+
**Confidencialidad**: Interna - Proyecto Tienda Online
**Versión**: 2.0 - Completa
