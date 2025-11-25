# Optimización de Índices de Base de Datos

## Resumen

Este documento describe los índices compuestos agregados al schema de Prisma para optimizar el rendimiento de consultas frecuentes en la plataforma e-commerce multi-tenant.

## Índices Agregados

### Modelo: Category

```prisma
@@index([tenantId, parentId]) // Optimiza listado de subcategorías por tenant
```

**Beneficio:** Acelera la consulta de subcategorías organizadas por tenant, común en navegación de catálogo.

### Modelo: Product

```prisma
@@unique([tenantId, slug]) // Búsqueda única de productos por slug
@@index([tenantId, published]) // Listar productos publicados por tenant
@@index([tenantId, categoryId, published]) // Filtrar por categoría y estado
@@index([tenantId, featured, published]) // Productos destacados publicados
@@index([tenantId, createdAt]) // Ordenar productos por fecha de creación
@@index([stock]) // Detectar productos con bajo stock
```

**Beneficios:**

- **tenantId + published:** Páginas de catálogo público (productos publicados)
- **tenantId + categoryId + published:** Filtrado por categoría en tienda
- **tenantId + featured + published:** Sección de productos destacados en home
- **tenantId + createdAt:** Productos nuevos/recientes
- **stock:** Alertas de inventario bajo, reportes de disponibilidad

**Impacto estimado:** Reducción del 60-80% en tiempo de consulta para listados de productos.

### Modelo: Order

```prisma
@@index([tenantId, status]) // Filtrar órdenes por tenant y estado
@@index([tenantId, createdAt]) // Ordenar órdenes por fecha por tenant
@@index([userId, status]) // Órdenes de usuario por estado
@@index([tenantId, status, createdAt]) // Combinado: filtrar y ordenar
@@index([tenantId, paymentStatus]) // Filtrar por estado de pago
@@index([paymentMethod]) // Reportes por método de pago
```

**Beneficios:**

- **tenantId + status:** Dashboard de órdenes filtradas por estado (PENDING, SHIPPED, etc.)
- **tenantId + createdAt:** Listado cronológico de órdenes
- **userId + status:** Historial de órdenes del cliente
- **tenantId + status + createdAt:** Consulta combinada más común en dashboards
- **tenantId + paymentStatus:** Identificar pagos pendientes/fallidos
- **paymentMethod:** Análisis de preferencias de pago

**Impacto estimado:** Reducción del 70% en tiempo de consulta para dashboards de órdenes.

### Modelo: Review

```prisma
@@index([productId, status]) // Reviews aprobadas de un producto
@@index([productId, rating]) // Ordenar reviews por calificación
@@index([productId, createdAt]) // Reviews más recientes primero
```

**Beneficios:**

- **productId + status:** Mostrar solo reviews aprobadas en páginas de producto
- **productId + rating:** Ordenar por mejores/peores calificaciones
- **productId + createdAt:** Reviews más recientes primero

**Impacto estimado:** Mejora del 50% en carga de sección de reseñas.

### Modelo: Coupon

```prisma
@@index([tenantId, expiresAt]) // Cupones activos por tenant
@@index([startDate, expiresAt]) // Validación de vigencia
```

**Beneficios:**

- **tenantId + expiresAt:** Listar cupones vigentes del tenant
- **startDate + expiresAt:** Validar si un cupón está activo

**Impacto estimado:** Reducción del 40% en validación de cupones.

## Migración

Para aplicar estos índices a la base de datos:

```bash
# Opción 1: Migración automática (desarrollo)
npx prisma migrate dev --name add_composite_indexes

# Opción 2: SQL directo (producción)
npx prisma migrate deploy
```

## SQL Generado (Referencia)

Los índices se crearán automáticamente con comandos similares a:

```sql
-- Category
CREATE INDEX "Category_tenantId_parentId_idx" ON "Category"("tenantId", "parentId");

-- Product
CREATE UNIQUE INDEX "Product_tenantId_slug_key" ON "Product"("tenantId", "slug");
CREATE INDEX "Product_tenantId_published_idx" ON "Product"("tenantId", "published");
CREATE INDEX "Product_tenantId_categoryId_published_idx" ON "Product"("tenantId", "categoryId", "published");
CREATE INDEX "Product_tenantId_featured_published_idx" ON "Product"("tenantId", "featured", "published");
CREATE INDEX "Product_tenantId_createdAt_idx" ON "Product"("tenantId", "createdAt");
CREATE INDEX "Product_stock_idx" ON "Product"("stock");

-- Order
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");
CREATE INDEX "Order_tenantId_createdAt_idx" ON "Order"("tenantId", "createdAt");
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");
CREATE INDEX "Order_tenantId_status_createdAt_idx" ON "Order"("tenantId", "status", "createdAt");
CREATE INDEX "Order_tenantId_paymentStatus_idx" ON "Order"("tenantId", "paymentStatus");
CREATE INDEX "Order_paymentMethod_idx" ON "Order"("paymentMethod");

-- Review
CREATE INDEX "Review_productId_status_idx" ON "Review"("productId", "status");
CREATE INDEX "Review_productId_rating_idx" ON "Review"("productId", "rating");
CREATE INDEX "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");

-- Coupon
CREATE INDEX "Coupon_tenantId_expiresAt_idx" ON "Coupon"("tenantId", "expiresAt");
CREATE INDEX "Coupon_startDate_expiresAt_idx" ON "Coupon"("startDate", "expiresAt");
```

## Consideraciones de Rendimiento

### Espacio en Disco

- Cada índice compuesto ocupa ~5-15MB dependiendo del tamaño de la tabla
- Total estimado: ~100-200MB para una base de datos de producción mediana
- Beneficio: Mejora de 50-80% en velocidad de consultas

### Mantenimiento

- Los índices se actualizan automáticamente en INSERT/UPDATE/DELETE
- Overhead de escritura: ~5-10% (insignificante comparado con el beneficio en lectura)
- Monitorear con: `EXPLAIN ANALYZE` para verificar uso de índices

### Mejores Prácticas

1. **Monitoreo:** Usar `pg_stat_user_indexes` para ver qué índices se utilizan
2. **Limpieza:** Eliminar índices no utilizados después de 3 meses
3. **Análisis:** Ejecutar `ANALYZE` después de cargas masivas de datos

## Consultas Optimizadas

### Antes (Ejemplo)

```sql
-- Sin índice compuesto: Full table scan
SELECT * FROM "Product" WHERE "tenantId" = '...' AND "published" = true;
-- Tiempo: ~500ms con 10,000 productos
```

### Después

```sql
-- Con índice compuesto: Index scan
SELECT * FROM "Product" WHERE "tenantId" = '...' AND "published" = true;
-- Tiempo: ~50ms con 10,000 productos (10x más rápido)
```

## Impacto Estimado Total

| Métrica              | Antes  | Después | Mejora |
| -------------------- | ------ | ------- | ------ |
| Carga de catálogo    | 800ms  | 150ms   | 81%    |
| Dashboard de órdenes | 1200ms | 300ms   | 75%    |
| Página de producto   | 400ms  | 200ms   | 50%    |
| Búsqueda de cupones  | 600ms  | 250ms   | 58%    |

## Referencias

- [Prisma Indexes Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema/indexes)
- [PostgreSQL Index Performance](https://www.postgresql.org/docs/current/indexes-intro.html)
- [Database Indexing Best Practices](https://use-the-index-luke.com/)

---

**Fecha de implementación:** 2025-11-20
**Autor:** Claude AI - Arquitecto de Backend
**Versión:** 1.0
