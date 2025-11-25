# 🏗️ INSTRUCCIONES - ARQUITECTO A (Full Stack)

**Fecha**: 16 de Noviembre, 2025
**Estado**: Activo
**Versión**: 1.0.0

---

## 👋 Bienvenida, Arquitecto A

Felicidades por completar **Sprint 4 (Backend)**. Ahora tu rol cambia: **Serás el Arquitecto Full Stack** de este proyecto.

**Esto significa:**

- ✅ Continúas haciendo Backend (API Routes, DAL, Database)
- ✅ Ahora también harás Frontend (Pages, Components, UI)
- ✅ Trabajarás secuencialmente en ambas capas
- ✅ Serás responsable de toda la arquitectura del proyecto

**Ventaja:** Un solo arquitecto = menos conflictos, integración más limpia.

---

## 📊 Estructura de Sprints

De ahora en adelante, cada sprint puede ser:

### Opción 1: Backend First → Frontend Second

```
Sprint 5 (Primer módulo):
├── SEMANA 1: Implementa BACKEND (APIs, Database, DAL)
├── SEMANA 2: Implementa FRONTEND (Pages, Components, Styles)
└── Integración total del módulo
```

### Opción 2: Frontend First → Backend Second

```
Sprint 6 (Segundo módulo):
├── SEMANA 1: Implementa FRONTEND (Pages, Components, Styles)
├── SEMANA 2: Implementa BACKEND (APIs, Database, DAL)
└── Integración total del módulo
```

---

## 🚀 Tu Próxima Tarea: Sprint 5

### **FASE 1: ARQUITECTO DE BACKEND**

**Tarea:** Implementar Dashboard Analytics para Store Owners

**Responsabilidades:**

1. **Crear API Endpoints**
   - `GET /api/admin/dashboard/metrics` - Métricas principales
   - `GET /api/admin/dashboard/sales` - Gráfico de ventas
   - `GET /api/admin/dashboard/top-products` - Productos más vendidos
   - `GET /api/admin/dashboard/recent-orders` - Órdenes recientes

2. **Crear DAL Functions** en `src/lib/db/dashboard.ts`

   ```typescript
   -getDashboardMetrics(tenantId) -
     getSalesData(tenantId, dateRange) -
     getTopProducts(tenantId, limit) -
     getRecentOrders(tenantId, limit);
   ```

3. **Validaciones Zod** en `src/lib/security/schemas/dashboard-schemas.ts`
   - DashboardMetricsSchema
   - DateRangeSchema

4. **Security & RBAC**
   - Solo STORE_OWNER y SUPER_ADMIN acceso
   - Filtrar por tenantId en TODAS las queries
   - Validar rangos de fecha

**Entregables Backend:**

- [ ] 4 API endpoints creados
- [ ] DAL module con 4 funciones
- [ ] Validaciones Zod completas
- [ ] Build pasa sin errores
- [ ] Documentación en código

**Timeline:** 3-4 días

---

### **FASE 2: ARQUITECTO DE FRONTEND**

**Tarea:** Crear Dashboard UI para Store Owners

**Responsabilidades:**

1. **Crear Páginas**
   - `src/app/dashboard/page.tsx` - Dashboard principal (con widgets)
   - `src/app/dashboard/sales/page.tsx` - Gráfico de ventas (Chart.js o Recharts)
   - `src/app/dashboard/products/page.tsx` - Productos más vendidos (tabla)
   - `src/app/dashboard/orders/page.tsx` - Órdenes recientes (tabla)

2. **Crear Componentes**
   - `MetricCard.tsx` - Widget de métrica (número grande + cambio %)
   - `SalesChart.tsx` - Gráfico de líneas de ventas
   - `ProductsTable.tsx` - Tabla de productos
   - `OrdersTable.tsx` - Tabla de órdenes

3. **State Management**
   - Usar React Query para fetch de datos
   - Caching automático
   - Refetch con botón

4. **Styling**
   - Responsive design (mobile, tablet, desktop)
   - Tailwind CSS + shadcn/ui
   - Colores: primario, accento, neutro (usar vars existentes)

5. **Auth & Protection**
   - Protected routes (solo STORE_OWNER)
   - Redirect si no autenticado
   - Session validation

**Entregables Frontend:**

- [ ] 4 páginas creadas
- [ ] 4 componentes reutilizables
- [ ] React Query integration
- [ ] Responsive design verificado
- [ ] Auth protection implementada
- [ ] Build pasa sin errores

**Timeline:** 3-4 días

---

## 📋 Checklist para Completar Sprint 5

### Backend

- [ ] Crear `src/lib/db/dashboard.ts` con 4 funciones DAL
- [ ] Crear `src/lib/security/schemas/dashboard-schemas.ts`
- [ ] Crear 4 API routes en `src/app/api/admin/dashboard/*`
- [ ] Validar RBAC en todas las APIs
- [ ] Test manual de cada endpoint con Postman/curl
- [ ] npm run build PASA sin errores

### Frontend

- [ ] Crear layout dashboard en `src/app/dashboard/layout.tsx`
- [ ] Crear 4 páginas principales
- [ ] Crear 4 componentes reutilizables
- [ ] Integrar React Query para fetch
- [ ] Verificar responsive design (dev tools)
- [ ] Verificar auth protection (sin login = redirect)
- [ ] npm run build PASA sin errores

### General

- [ ] Git commits bien documentados
- [ ] Documentación en código (JSDoc/comments)
- [ ] Sin warnings en eslint
- [ ] Merge a develop sin conflictos

---

## 🔄 Flujo de Trabajo

### Paso 1: BACKEND PHASE (Semana 1)

```bash
# 1. Crear rama feature
git checkout -b feat/sprint5-dashboard-backend

# 2. Crear archivos DAL
src/lib/db/dashboard.ts

# 3. Crear validaciones
src/lib/security/schemas/dashboard-schemas.ts

# 4. Crear API routes
src/app/api/admin/dashboard/metrics/route.ts
src/app/api/admin/dashboard/sales/route.ts
src/app/api/admin/dashboard/top-products/route.ts
src/app/api/admin/dashboard/recent-orders/route.ts

# 5. Tests locales
npm run dev
# Probar cada endpoint en http://localhost:3000/api/admin/dashboard/*

# 6. Build
npm run build

# 7. Commit
git commit -m "feat(backend): Implement dashboard analytics APIs"

# 8. Push
git push origin feat/sprint5-dashboard-backend

# 9. Merge a develop
git checkout develop
git pull origin develop
git merge feat/sprint5-dashboard-backend
git push origin develop
```

### Paso 2: FRONTEND PHASE (Semana 2)

```bash
# 1. Crear rama feature
git checkout -b feat/sprint5-dashboard-frontend

# 2. Crear layout
src/app/dashboard/layout.tsx

# 3. Crear páginas
src/app/dashboard/page.tsx
src/app/dashboard/sales/page.tsx
src/app/dashboard/products/page.tsx
src/app/dashboard/orders/page.tsx

# 4. Crear componentes
src/components/features/MetricCard.tsx
src/components/features/SalesChart.tsx
src/components/features/ProductsTable.tsx
src/components/features/OrdersTable.tsx

# 5. Tests locales
npm run dev
# Probar en http://localhost:3000/dashboard
# Verificar que muestra datos
# Verificar responsive design

# 6. Build
npm run build

# 7. Commit
git commit -m "feat(frontend): Implement dashboard UI with charts and tables"

# 8. Push
git push origin feat/sprint5-dashboard-frontend

# 9. Merge a develop
git checkout develop
git pull origin develop
git merge feat/sprint5-dashboard-frontend
git push origin develop
```

---

## 📚 Referencia Rápida

### Tech Stack a Usar

**Backend:**

- NextJS API Routes
- Prisma ORM
- Zod validation
- NextAuth (auth check)

**Frontend:**

- React Hooks (useState, useEffect)
- React Query (TanStack Query)
- Tailwind CSS
- shadcn/ui components
- TypeScript strict mode

### Database Queries Esperadas

```typescript
// Dashboard metrics
SELECT
  COUNT(*) as totalOrders,
  SUM(total) as totalRevenue,
  COUNT(DISTINCT userId) as uniqueCustomers,
  AVG(total) as avgOrderValue
FROM Order
WHERE tenantId = ? AND createdAt >= ?

// Sales by date
SELECT
  DATE(createdAt) as date,
  SUM(total) as revenue,
  COUNT(*) as orderCount
FROM Order
WHERE tenantId = ? AND createdAt >= ? AND createdAt <= ?
GROUP BY DATE(createdAt)
ORDER BY date DESC

// Top products
SELECT
  p.id, p.name, p.basePrice,
  COUNT(oi.id) as salesCount,
  SUM(oi.quantity) as totalQuantity,
  SUM(oi.price * oi.quantity) as totalRevenue
FROM Product p
LEFT JOIN OrderItem oi ON p.id = oi.productId
WHERE p.tenantId = ?
GROUP BY p.id
ORDER BY totalRevenue DESC
LIMIT 10

// Recent orders
SELECT
  o.id, o.orderNumber, o.userId, o.total, o.status, o.createdAt,
  u.name as userName, u.email
FROM Order o
LEFT JOIN User u ON o.userId = u.id
WHERE o.tenantId = ?
ORDER BY o.createdAt DESC
LIMIT 10
```

---

## ⚠️ Puntos Críticos

1. **RBAC Check en TODAS las APIs**

   ```typescript
   if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }
   ```

2. **Tenant Isolation**

   ```typescript
   WHERE tenantId = session.user.tenantId // OBLIGATORIO
   ```

3. **Validación de Entrada**

   ```typescript
   const validation = DashboardMetricsSchema.safeParse(query);
   if (!validation.success) {
     return NextResponse.json({ issues: validation.error.issues }, { status: 400 });
   }
   ```

4. **Error Handling**

   ```typescript
   try {
     // tu código
   } catch (error) {
     console.error("[DASHBOARD]", error);
     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
   ```

5. **TypeScript Types**
   - No usar `any` (usar `unknown` si es necesario)
   - Todos los parámetros tipados
   - Genéricos cuando sea posible

---

## 📞 Comunicación

**Status Reports cada fin de semana:**

- ¿Qué completaste?
- ¿Qué problemas tuviste?
- ¿Necesitas ayuda?

**Si tienes bloqueos:**

- Manda screenshot del error
- Describe qué intentaste
- Yo ayudaré a desbloquear

---

## 🎯 Reglas de Oro

1. ✅ **Commit frecuente** - Cada feature pequeño = 1 commit
2. ✅ **Pruebas locales** - Antes de push a develop
3. ✅ **Build siempre pasa** - `npm run build` sin errores
4. ✅ **Documentación en código** - Comments claros
5. ✅ **Types correctos** - TypeScript strict mode
6. ✅ **No hardcodes** - Env vars o constants
7. ✅ **Gitflow limpio** - Feature branches, merge a develop

---

## 🚀 ¡Adelante, Arquitecto A!

**Tu próxima tarea es clara:**

### **AHORA (Esta semana):**

👉 **ARQUITECTO DE BACKEND**

- Implementar 4 API endpoints de dashboard
- Crear DAL functions
- Validaciones Zod

### **PRÓXIMA SEMANA:**

👉 **ARQUITECTO DE FRONTEND**

- Crear UI del dashboard
- Componentes reutilizables
- React Query integration

---

**Fecha de entrega estimada:** 2 semanas (fin de Sprint 5)

**¿Preguntas?** Pregunta en cualquier momento. Estoy aquí para desbloquear.

**¡Comenzamos!** 🚀
