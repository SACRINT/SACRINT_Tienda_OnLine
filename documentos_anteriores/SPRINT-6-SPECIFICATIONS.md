# 📋 SPRINT 6 - ESPECIFICACIONES Y PLANNING

**Fecha:** 17 de Noviembre, 2025
**Arquitecto:** Arquitecto A (Backend)
**Sprint Anterior:** Sprint 5 - Dashboard Analytics ✅
**Estado del Proyecto:** 75% completado hacia MVP

---

## 🎯 OBJETIVOS DEL SPRINT 6

**Objetivo Principal:** Completar features críticos para MVP y resolver vulnerabilidades de seguridad.

**Prioridades:**

1. 🔴 **CRÍTICO:** Refactorizar tenant isolation (seguridad)
2. 🟠 **ALTA:** Implementar features faltantes para MVP
3. 🟡 **MEDIA:** Mejoras de UX y performance

**Timeline Estimado:** 3-4 semanas (120-160 horas de trabajo)

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### Features Completadas (Sprints 1-5)

| Sprint       | Feature                       | Backend | Frontend | Status           |
| ------------ | ----------------------------- | ------- | -------- | ---------------- |
| **Sprint 1** | Authentication (Google OAuth) | ✅      | ✅       | Completado       |
| **Sprint 1** | Multi-tenant System           | ✅      | ⏳       | Backend completo |
| **Sprint 2** | Products & Categories CRUD    | ✅      | ✅       | Completado       |
| **Sprint 3** | Shopping Cart                 | ✅      | ✅       | Completado       |
| **Sprint 3** | Checkout & Orders             | ✅      | ✅       | Completado       |
| **Sprint 3** | Stripe Integration            | ✅      | ✅       | Completo parcial |
| **Sprint 4** | Reviews System                | ✅      | ⏳       | Backend completo |
| **Sprint 4** | Inventory Management          | ✅      | ⏳       | Backend completo |
| **Sprint 5** | Dashboard Analytics           | ✅      | ⏳       | Backend completo |

**Cobertura Backend:** ~85%
**Cobertura Frontend:** ~60%
**Integración:** ~70%

### Endpoints API Implementados

**Total: 20 endpoints REST**

#### Autenticación (2)

- ✅ `POST /api/auth/signup` - Registro de usuarios
- ✅ `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

#### Productos (4)

- ✅ `GET /api/products` - Lista de productos con filtros
- ✅ `POST /api/products` - Crear producto (STORE_OWNER)
- ✅ `GET /api/products/[id]` - Detalle de producto
- ✅ `PATCH /api/products/[id]` - Actualizar producto

#### Categorías (2)

- ✅ `GET /api/categories` - Lista de categorías
- ✅ `POST /api/categories` - Crear categoría (STORE_OWNER)

#### Carrito (2)

- ✅ `GET /api/cart` - Obtener carrito del usuario
- ✅ `POST /api/cart` - Agregar item al carrito

#### Checkout (1)

- ✅ `POST /api/checkout` - Procesar pago con Stripe

#### Órdenes (3)

- ✅ `GET /api/orders` - Listar órdenes del usuario
- ✅ `GET /api/orders/[id]` - Detalle de orden
- ✅ `PATCH /api/orders/[id]` - Actualizar estado (STORE_OWNER)

#### Reviews (2)

- ✅ `GET /api/products/[id]/reviews` - Reviews de producto
- ✅ `POST /api/products/[id]/reviews` - Crear review

#### Inventario (3)

- ✅ `POST /api/inventory/reserve` - Reservar stock
- ✅ `POST /api/inventory/confirm` - Confirmar reserva
- ✅ `GET /api/inventory` - Reporte de inventario

#### Admin (1)

- ✅ `GET /api/admin/orders` - Admin orders panel

---

## 🚀 FEATURES FALTANTES PARA MVP

### Prioridad CRÍTICA (Deben implementarse)

#### 1. Security Refactoring ⚠️ (De auditoría)

**Descripción:** Refactorizar 33 funciones DAL para implementar tenant isolation correcto.

**Justificación:** Vulnerabilidad de seguridad detectada en auditoría (VULN-001).

**Esfuerzo Estimado:** 10-12 horas

**Archivos Afectados:**

- `src/lib/db/products.ts` (5 funciones)
- `src/lib/db/cart.ts` (6 funciones)
- `src/lib/db/categories.ts` (1 función)
- `src/lib/db/inventory.ts` (5 funciones)
- `src/lib/db/reviews.ts` (7 funciones)
- `src/lib/db/users.ts` (6 funciones)
- `src/lib/db/tenant.ts` (2 funciones)

**Acceptance Criteria:**

- [ ] Todas las funciones DAL validan `tenantId` en la query
- [ ] No hay validación post-query en APIs
- [ ] Tests de seguridad pasan (intentos cross-tenant fallan)
- [ ] Performance no se degrada

**Tareas:**

1. Refactorizar función por función
2. Actualizar callers en APIs
3. Agregar tests de seguridad
4. Documentar cambios

---

#### 2. User Profile Management 👤

**Descripción:** API completa para gestión de perfil de usuario.

**Esfuerzo Estimado:** 6-8 horas

**Endpoints a Crear:**

| Endpoint                   | Método | Descripción                |
| -------------------------- | ------ | -------------------------- |
| `/api/user/profile`        | GET    | Obtener perfil del usuario |
| `/api/user/profile`        | PATCH  | Actualizar perfil          |
| `/api/user/addresses`      | GET    | Listar direcciones         |
| `/api/user/addresses`      | POST   | Crear dirección            |
| `/api/user/addresses/[id]` | PATCH  | Actualizar dirección       |
| `/api/user/addresses/[id]` | DELETE | Eliminar dirección         |

**Archivos a Crear:**

- `src/app/api/user/profile/route.ts`
- `src/app/api/user/addresses/route.ts`
- `src/app/api/user/addresses/[id]/route.ts`
- `src/lib/security/schemas/user-schemas.ts`

**Acceptance Criteria:**

- [ ] Usuario puede ver y editar su perfil
- [ ] Usuario puede gestionar direcciones de envío
- [ ] Validación Zod en todos los inputs
- [ ] Tenant isolation verificado

---

#### 3. Stripe Webhooks (Completar) 💳

**Descripción:** Completar implementación de webhooks de Stripe para actualizar estados de órdenes.

**Esfuerzo Estimado:** 4-6 horas

**Estado Actual:**

- ✅ DAL function existe (`src/lib/payment/stripe.ts`)
- ❌ Endpoint API no implementado
- ❌ Signature verification incompleta

**Endpoints a Crear:**

| Endpoint               | Método | Descripción       |
| ---------------------- | ------ | ----------------- |
| `/api/webhooks/stripe` | POST   | Webhook de Stripe |

**Archivos a Crear:**

- `src/app/api/webhooks/stripe/route.ts`

**Eventos a Manejar:**

- `payment_intent.succeeded` → Marcar orden como PAID
- `payment_intent.payment_failed` → Marcar orden como FAILED
- `charge.refunded` → Procesar reembolso

**Acceptance Criteria:**

- [ ] Webhook signature validada
- [ ] Eventos procesados correctamente
- [ ] Órdenes actualizadas automáticamente
- [ ] Logs de eventos guardados
- [ ] Tests con Stripe CLI

---

#### 4. Email Notifications 📧

**Descripción:** Sistema de notificaciones por email para eventos críticos.

**Esfuerzo Estimado:** 8-10 horas

**Tecnología:** Resend API (ya en dependencies)

**Emails a Implementar:**

| Email              | Trigger             | Destinatario |
| ------------------ | ------------------- | ------------ |
| Welcome Email      | Registro de usuario | Usuario      |
| Order Confirmation | Checkout exitoso    | Usuario      |
| Order Shipped      | Cambio a SHIPPED    | Usuario      |
| Order Delivered    | Cambio a DELIVERED  | Usuario      |
| Password Reset     | Solicitud de reset  | Usuario      |

**Archivos a Crear:**

- `src/lib/email/resend.ts` - Client de Resend
- `src/lib/email/templates/` - Templates de emails
- `src/lib/email/templates/welcome.tsx`
- `src/lib/email/templates/order-confirmation.tsx`
- `src/lib/email/templates/order-status.tsx`

**Acceptance Criteria:**

- [ ] Emails se envían en eventos correctos
- [ ] Templates responsivos (React Email)
- [ ] Manejo de errores (queue si falla)
- [ ] Logs de envíos
- [ ] Testing en sandbox

---

### Prioridad ALTA (Muy recomendadas)

#### 5. Coupons & Discounts System 🎟️

**Descripción:** Sistema completo de cupones y descuentos.

**Esfuerzo Estimado:** 12-15 horas

**Features:**

- Cupones de porcentaje (10% off)
- Cupones de monto fijo ($50 off)
- Cupones de envío gratis
- Validez por fecha
- Uso único o múltiple
- Límite de usos

**Archivos a Crear:**

- `src/lib/db/coupons.ts` - DAL
- `src/lib/security/schemas/coupon-schemas.ts` - Validación
- `src/app/api/coupons/route.ts` - CRUD
- `src/app/api/coupons/validate/route.ts` - Validar cupón
- `prisma/migrations/XXX_add_coupons.sql` - Migration

**Modelo Prisma:**

```prisma
model Coupon {
  id            String   @id @default(uuid())
  code          String   @unique
  type          CouponType // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
  value         Float
  minPurchase   Float?
  maxDiscount   Float?
  usageLimit    Int?
  usedCount     Int      @default(0)
  validFrom     DateTime
  validUntil    DateTime
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum CouponType {
  PERCENTAGE
  FIXED_AMOUNT
  FREE_SHIPPING
}
```

**Acceptance Criteria:**

- [ ] STORE_OWNER puede crear cupones
- [ ] Cupones se validan en checkout
- [ ] Descuentos se aplican correctamente
- [ ] Límites de uso respetados
- [ ] Tenant isolation verificado

---

#### 6. Advanced Search & Filters 🔍

**Descripción:** Búsqueda y filtros avanzados de productos.

**Esfuerzo Estimado:** 6-8 horas

**Features:**

- Búsqueda full-text (nombre, descripción, tags)
- Filtros combinados (precio + categoría + stock)
- Ordenamiento múltiple
- Paginación optimizada
- Faceted search (contadores)

**Endpoints a Mejorar:**

| Endpoint                   | Mejora                        |
| -------------------------- | ----------------------------- |
| `GET /api/products`        | Agregar filtros avanzados     |
| `GET /api/products/search` | Mejorar algoritmo de búsqueda |

**Optimizaciones:**

- Índices compuestos en DB
- Cache de resultados frecuentes
- Debouncing en frontend

**Acceptance Criteria:**

- [ ] Búsqueda retorna resultados relevantes
- [ ] Filtros combinables
- [ ] Performance < 500ms
- [ ] Paginación eficiente

---

#### 7. File Upload (Product Images) 🖼️

**Descripción:** Sistema de upload de imágenes para productos.

**Esfuerzo Estimado:** 8-10 horas

**Tecnología:** Uploadthing o Cloudinary

**Features:**

- Upload múltiple (hasta 5 imágenes)
- Compresión automática
- Redimensionamiento (thumbnails)
- Drag & drop UI
- Progreso de upload

**Archivos a Crear:**

- `src/app/api/upload/route.ts` - Upload endpoint
- `src/lib/upload/uploadthing.ts` - Client
- `src/components/features/ImageUploader.tsx` - UI

**Acceptance Criteria:**

- [ ] Imágenes se suben correctamente
- [ ] Compresión automática
- [ ] Preview antes de subir
- [ ] Límite de tamaño (5MB)
- [ ] Solo formatos válidos (jpg, png, webp)

---

### Prioridad MEDIA (Mejoras)

#### 8. Rate Limiting 🚦

**Descripción:** Implementar rate limiting en endpoints críticos.

**Esfuerzo Estimado:** 4-6 horas

**Endpoints a Proteger:**

- `/api/auth/signup` - 5 requests/15 min
- `/api/auth/signin` - 10 requests/15 min
- `/api/checkout` - 3 requests/1 min
- `/api/products` (POST) - 20 requests/1 hour

**Tecnología:** upstash-ratelimit (Redis)

**Archivos a Crear:**

- `src/lib/rate-limit/config.ts`
- `src/lib/rate-limit/middleware.ts`

**Acceptance Criteria:**

- [ ] Límites respetados
- [ ] Headers informativos (X-RateLimit-\*)
- [ ] Status 429 Too Many Requests
- [ ] Whitelist para testing

---

#### 9. Dashboard (Frontend) 📊

**Descripción:** Frontend del dashboard para STORE_OWNER.

**Esfuerzo Estimado:** 12-16 horas (Arquitecto B)

**Páginas a Crear:**

- `/admin/dashboard` - Overview con métricas
- `/admin/products` - Gestión de productos
- `/admin/orders` - Gestión de órdenes
- `/admin/customers` - Lista de clientes
- `/admin/analytics` - Reportes

**APIs Disponibles:**

- ✅ `GET /api/admin/dashboard/metrics`
- ✅ `GET /api/admin/dashboard/sales`
- ✅ `GET /api/admin/dashboard/products`
- ✅ `GET /api/admin/dashboard/orders`

**Nota:** Esta tarea es para Arquitecto B (Frontend), pero requiere coordinación.

---

#### 10. Enhanced Analytics 📈

**Descripción:** Analytics más detallados para STORE_OWNER.

**Esfuerzo Estimado:** 6-8 horas

**Features:**

- Conversion rate (visitors → purchases)
- Average order value (AOV)
- Customer lifetime value (CLV)
- Abandoned carts tracking
- Revenue by category

**Endpoints a Crear:**

| Endpoint                               | Descripción        |
| -------------------------------------- | ------------------ |
| `/api/admin/dashboard/conversion`      | Conversion metrics |
| `/api/admin/dashboard/revenue`         | Revenue breakdown  |
| `/api/admin/dashboard/customers/stats` | Customer analytics |

**Archivos a Crear:**

- Agregar funciones a `src/lib/db/dashboard.ts`
- Agregar endpoints en `src/app/api/admin/dashboard/`

**Acceptance Criteria:**

- [ ] Métricas calculadas correctamente
- [ ] Performance < 1s
- [ ] Datos cacheables
- [ ] Visualizaciones claras

---

## 📅 TIMELINE PROPUESTO

### Semana 1: Security & Core Features (40 horas)

**Días 1-2 (16 horas):**

- ✅ Refactorizar tenant isolation (10-12h)
- ✅ Tests de seguridad (2-3h)
- ✅ Code review (1-2h)

**Días 3-4 (16 horas):**

- ✅ User Profile Management (6-8h)
- ✅ Stripe Webhooks (4-6h)
- ✅ Tests (2-3h)

**Día 5 (8 horas):**

- ✅ Email Notifications setup (8h)

### Semana 2: Features & Enhancements (40 horas)

**Días 1-3 (24 horas):**

- ✅ Coupons System (12-15h)
- ✅ Advanced Search (6-8h)
- ✅ Tests (3h)

**Días 4-5 (16 horas):**

- ✅ File Upload (8-10h)
- ✅ Rate Limiting (4-6h)

### Semana 3: Polish & Integration (32 horas)

**Días 1-3 (24 horas):**

- ✅ Enhanced Analytics (6-8h)
- ✅ Integration tests (8h)
- ✅ Bug fixes (8h)

**Días 4-5 (16 horas):**

- ✅ Documentation (8h)
- ✅ Deployment prep (4h)
- ✅ Final testing (4h)

---

## 🎯 ACCEPTANCE CRITERIA DEL SPRINT

### Must Have (Crítico)

- [ ] **Security:** Todas las 33 funciones DAL refactorizadas
- [ ] **Security:** Tests de tenant isolation pasan
- [ ] **Features:** User profile management completo
- [ ] **Features:** Stripe webhooks funcionando
- [ ] **Features:** Email notifications enviándose
- [ ] **Build:** `npm run build` pasa sin errores
- [ ] **Tests:** Coverage > 70%

### Should Have (Alta prioridad)

- [ ] **Features:** Coupons system implementado
- [ ] **Features:** Advanced search funcionando
- [ ] **Features:** File upload para imágenes
- [ ] **Security:** Rate limiting en endpoints críticos
- [ ] **Docs:** API documentation actualizada

### Nice to Have (Media prioridad)

- [ ] **Analytics:** Enhanced analytics implementado
- [ ] **Frontend:** Dashboard UI (Arquitecto B)
- [ ] **Performance:** Cache implementado
- [ ] **DevOps:** CI/CD pipeline configurado

---

## 📊 ESTIMACIÓN DE ESFUERZO

### Por Categoría

| Categoría                                   | Horas   | Porcentaje |
| ------------------------------------------- | ------- | ---------- |
| Security Refactoring                        | 12      | 10%        |
| Core Features (Profile, Webhooks, Email)    | 20      | 17%        |
| Advanced Features (Coupons, Search, Upload) | 36      | 30%        |
| Enhancements (Rate Limit, Analytics)        | 14      | 12%        |
| Testing & QA                                | 20      | 17%        |
| Documentation                               | 8       | 7%         |
| Deployment & DevOps                         | 8       | 7%         |
| **TOTAL**                                   | **118** | **100%**   |

### Por Prioridad

| Prioridad | Features                               | Horas   |
| --------- | -------------------------------------- | ------- |
| CRÍTICA   | Security + Profile + Webhooks + Email  | 38      |
| ALTA      | Coupons + Search + Upload + Rate Limit | 46      |
| MEDIA     | Analytics + Dashboard + Polish         | 34      |
| **TOTAL** | **10 features**                        | **118** |

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Fundación Segura (Semana 1)

1. **Refactorizar Tenant Isolation** (12h) 🔴
   - Crítico para seguridad
   - Afecta a todas las features

2. **User Profile Management** (8h) 🔴
   - Necesario para UX completa
   - Base para otras features

3. **Stripe Webhooks** (6h) 🔴
   - Completar flujo de pagos
   - Automatizar actualizaciones

4. **Email Notifications** (8h) 🔴
   - Mejorar UX significativamente
   - Necesario para producción

### Fase 2: Value-Add Features (Semana 2)

5. **Coupons System** (15h) 🟠
   - Alto valor para clientes
   - Diferenciador competitivo

6. **Advanced Search** (8h) 🟠
   - Mejora UX de tienda
   - Incrementa conversiones

7. **File Upload** (10h) 🟠
   - Esencial para gestión de productos
   - Mejor presentación visual

8. **Rate Limiting** (6h) 🟠
   - Protección contra abuso
   - Mejora estabilidad

### Fase 3: Polish & Scale (Semana 3)

9. **Enhanced Analytics** (8h) 🟡
   - Insights para store owners
   - Data-driven decisions

10. **Integration & Testing** (16h) 🟡
    - Garantizar calidad
    - Preparar para producción

---

## 🔗 DEPENDENCIAS

### Internas

| Feature             | Depende de                |
| ------------------- | ------------------------- |
| Email Notifications | User Profile (para email) |
| Coupons             | Checkout API existente    |
| Enhanced Analytics  | Dashboard API (Sprint 5)  |
| Rate Limiting       | Ninguna (independiente)   |

### Externas

| Feature             | Servicio Externo         |
| ------------------- | ------------------------ |
| Email Notifications | Resend API               |
| File Upload         | Uploadthing / Cloudinary |
| Rate Limiting       | Upstash Redis            |
| Stripe Webhooks     | Stripe API               |

---

## ⚠️ RIESGOS IDENTIFICADOS

### Riesgos Técnicos

| Riesgo                     | Probabilidad | Impacto | Mitigación                     |
| -------------------------- | ------------ | ------- | ------------------------------ |
| Refactoring introduce bugs | Media        | Alto    | Tests exhaustivos, code review |
| Stripe webhooks fallan     | Baja         | Alto    | Retry logic, monitoring        |
| Email delivery issues      | Media        | Medio   | Queue system, fallback         |
| File upload performance    | Media        | Medio   | Compresión, CDN                |

### Riesgos de Timeline

| Riesgo                                | Probabilidad | Impacto | Mitigación                    |
| ------------------------------------- | ------------ | ------- | ----------------------------- |
| Features más complejas de lo estimado | Alta         | Medio   | Buffer de 20% en estimaciones |
| Coordinación con Arquitecto B         | Media        | Medio   | Daily syncs, clear contracts  |
| Testing toma más tiempo               | Media        | Alto    | Priorizar automated tests     |

---

## 📝 NOTAS TÉCNICAS

### Configuración Requerida

**Variables de Entorno (.env):**

```env
# Existentes
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# Nuevas para Sprint 6
STRIPE_WEBHOOK_SECRET=      # Para webhooks
RESEND_API_KEY=             # Para emails
UPLOADTHING_SECRET=         # Para uploads
UPLOADTHING_APP_ID=
UPSTASH_REDIS_REST_URL=     # Para rate limiting
UPSTASH_REDIS_REST_TOKEN=
```

### Migraciones de Base de Datos

**Nuevas tablas necesarias:**

1. `Coupon` - Sistema de cupones
2. `EmailLog` - Registro de emails enviados (opcional)
3. Índices adicionales para performance

---

## ✅ DEFINITION OF DONE

Un feature se considera **DONE** cuando:

- [ ] Código implementado y reviewed
- [ ] Tests unitarios escritos (coverage > 80%)
- [ ] Tests de integración pasando
- [ ] Documentación API actualizada
- [ ] Zod validation implementada
- [ ] Tenant isolation verificado
- [ ] RBAC verificado (si aplica)
- [ ] Error handling completo
- [ ] Logging implementado
- [ ] Build pasa sin errores
- [ ] Deployed a staging environment

---

## 📚 RECURSOS Y REFERENCIAS

### Documentación del Proyecto

- `ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md` - Arquitectura completa
- `AUDITORIA-SEGURIDAD-SPRINT-6.md` - Resultado de auditoría
- `docs/DASHBOARD-API.md` - Documentación Sprint 5
- `SPRINT-3-CHECKOUT-BACKEND.md` - Checkout & Orders
- `INSTRUCCIONES-SPRINT4-ARQUITECTO-A.md` - Reviews & Inventory

### Referencias Externas

- [Resend Email API](https://resend.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Uploadthing Docs](https://docs.uploadthing.com)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [React Email](https://react.email)

---

## 🎉 CONCLUSIÓN

**Sprint 6 es el sprint final hacia MVP.** Con las features planificadas, el proyecto alcanzará:

**Funcionalidad:** 95%
**Seguridad:** 95%
**UX:** 85%
**Production Ready:** 90%

**Tiempo Total Estimado:** 118 horas (3 semanas a 40h/semana)

**Próximos Pasos:**

1. ✅ Aprobar este documento
2. ✅ Asignar features a Arquitectos
3. ✅ Comenzar Fase 1 (Security + Core)
4. ✅ Daily standups para tracking
5. ✅ Deploy a staging al finalizar

---

**Preparado por:** Arquitecto A (Claude Code)
**Fecha:** 17 de Noviembre, 2025
**Versión:** 1.0.0
**Estado:** ✅ LISTO PARA REVISIÓN
