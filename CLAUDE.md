# CLAUDE.md - Contexto del Proyecto para Desarrolladores IA

**Fecha de creación**: 15 de Noviembre, 2025
**Versión**: 2.0.0
**Estado**: ✅ SPRINT 0 COMPLETADO - Proyecto deployado y funcional
**Última actualización**: 23 de Noviembre, 2025

---

## 🎯 Resumen Ejecutivo

Proyecto **Tienda Online 2025** - Una plataforma e-commerce SaaS multi-tenant con seguridad de nivel bancario.

**Objetivo**: Crear una plataforma donde múltiples vendedores puedan crear tiendas online independientes con:

- ✅ Autenticación con Google OAuth
- ✅ Catálogo de productos dinámico
- ✅ Carrito y checkout con Stripe
- ✅ Dashboard de análisis
- ✅ Seguridad de nivel bancario

**Tiempo estimado para MVP**: 3-4 semanas con 2 arquitectos

---

## 📚 Documentación Disponible

Toda la documentación está en la raíz del proyecto:

1. **README-PROYECTO-TIENDA-ONLINE.md** - Punto de entrada (30 min lectura)
2. **ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md** - Especificaciones técnicas (2-3 horas)
3. **SPRINT-0-SETUP-CHECKLIST.md** - Pasos de configuración (2-3 horas ejecución)
4. **DIVISION-TRABAJO-PARALELO.md** - Coordinación de equipo (30-45 min)
5. **INDICE-DOCUMENTACION-TIENDA-ONLINE.md** - Navegación (referencia)
6. **CHANGELOG.md** - Historial de cambios
7. **CLAUDE.md** - Este archivo (contexto IA)

**Total**: 8,000+ líneas de documentación profesional

---

## 🏗️ Stack Tecnológico

```
Frontend:
├─ Next.js 14+ (App Router)
├─ React 18+ (Hooks, SSR)
├─ TypeScript (strict mode)
├─ Tailwind CSS + shadcn/ui
├─ React Query (server state)
├─ Zustand (client state)
└─ React Hook Form + Zod

Backend:
├─ Next.js API Routes
├─ NextAuth.js v5 (Google OAuth)
├─ Prisma ORM
├─ PostgreSQL 15+ (Neon)
├─ Stripe (pagos)
├─ Resend (email)
└─ Zod (validaciones)

DevOps:
├─ Vercel (hosting)
├─ GitHub (source control)
├─ Neon (BD managed)
└─ Stripe (payments)
```

---

## 📊 Arquitectura de Base de Datos

### Modelos principales (20+ total):

```
Multi-tenancy:
- Tenant (tienda del vendedor)

Autenticación:
- User (usuarios globales)
- Account (OAuth integrations)
- Session (sesiones activas)

Catálogo:
- Category (categorías y subcategorías)
- Product (productos)
- ProductVariant (variaciones: talla, color)
- ProductImage (galería de imágenes)

Órdenes:
- Order (órdenes de compra)
- OrderItem (ítems de orden)
- Address (direcciones de envío)

Otros:
- Review (reseñas de productos)
- Coupon (cupones y descuentos)
```

### Principios críticos:

- ✅ Todos los datos filtrados por `tenantId`
- ✅ RBAC con 3 roles (SUPER_ADMIN, STORE_OWNER, CUSTOMER)
- ✅ Aislamiento completo de datos entre tenants
- ✅ Índices optimizados en campos de filtro

---

## 🔐 Seguridad Implementada

### 2-layer validation:

```typescript
// Frontend (Zod) - UX feedback inmediato
// Backend (Zod) - Verdadero control, nunca confiar en cliente
```

### RBAC (3 roles):

- **SUPER_ADMIN**: Acceso total al sistema
- **STORE_OWNER**: Gestión de su tienda
- **CUSTOMER**: Compras y perfil

### Headers de seguridad:

- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

### Otros:

- Passwords con bcrypt (12 rounds)
- Secrets en env variables
- SQL injection prevention (Prisma prepared statements)
- Rate limiting en endpoints críticos
- Refresh token rotation

---

## 🚀 Estado Actual del Proyecto (Fases Completadas)

### ✅ Semanas 1-4: Auditoría y Fundamentos (COMPLETADAS)

**Estado**: ✅ 100% Completadas
**Resultado**: Documentación completa, auditoría de seguridad, arquitectura definida

- Auditoría de código y seguridad (Documentos P0-P25)
- Especificaciones técnicas completas
- Arquitectura multi-tenant con RBAC
- Validaciones y esquemas de seguridad
- Stack tecnológico definido

### ✅ Sprint 0: Configuración (COMPLETADAS)

```
✅ GitHub repo setup
✅ Next.js 14 initialization
✅ Neon PostgreSQL database
✅ Tailwind CSS + shadcn/ui
✅ Estructura de carpetas profesional
✅ NextAuth.js v5 with Google OAuth
✅ Prisma ORM with 20+ models
✅ TypeScript strict mode
✅ Testing infrastructure (Jest + Testing Library)
✅ CI/CD Pipeline (GitHub Actions)
✅ Vercel deployment configuration
✅ All 122 TypeScript errors fixed
Resultado: ✅ Proyecto deployado en Vercel - FUNCIONANDO
```

**Acceso**: https://[vercel-project-url].vercel.app

## 📋 Próximas Fases (Semanas 5-56)

### 🔄 PRÓXIMO: Semanas 5-8 - Transformación UX/UI (PENDIENTE)

```
Objetivo: Interfaz profesional y moderna
Riesgo: ALTO (user acceptance testing)
Duración: 4 semanas
Entrega: Shop completamente funcional

Incluye:
- Redesign de landing page
- Shop UI con filtros
- Product detail pages
- Cart UI mejorada
- Checkout flow visual
- Dashboard layout profesional
- Mobile-first responsive design
- Componentes shadcn/ui avanzados
```

### Semanas 9-12 - Catálogo Profesional (PENDIENTE)

```
Objetivo: Gestión avanzada de productos
Riesgo: MEDIO
Duración: 4 semanas
Entrega: CRUD, búsqueda, filtros avanzados

Incluye:
- CRUD API de productos
- Búsqueda full-text con PostgreSQL
- Filtros avanzados (categoría, precio, stock)
- Gestión de variantes (talla, color)
- Galerías de imágenes
- SEO optimización
```

### Semanas 13-20 - Pagos, Órdenes y Logística (PENDIENTE)

```
Objetivo: Transacciones y flujo completo
Riesgo: CRÍTICO (dinero real)
Duración: 8 semanas
Entrega: MVP con pagos reales

Incluye:
- Stripe integration completa
- MercadoPago integration
- Sistema de órdenes
- Seguimiento de envíos
- Cálculo de impuestos
- Notificaciones por email
```

### Semanas 21-28 - Panel Administrativo y Analítica (PENDIENTE)

```
Objetivo: Control total de operaciones
Riesgo: MEDIO
Duración: 8 semanas
Entrega: Dashboard operacional completo

Incluye:
- Dashboard de estadísticas
- Gestión de órdenes
- Gestión de clientes
- Reportes y analítica
- Configuración de tienda
```

### Semanas 29-36 - Rendimiento, SEO y PWA (PENDIENTE)

```
Objetivo: Competitividad en Google
Riesgo: MEDIO
Duración: 8 semanas
Entrega: Lighthouse >90, Core Web Vitals OK

Incluye:
- Optimizaciones de performance
- SEO técnico y contenidos
- PWA implementation
- Caché strategies
- Compresión de assets
```

### Semanas 37-44 - Marketing y Automatización (PENDIENTE)

```
Objetivo: Crecimiento de usuarios
Riesgo: BAJO
Duración: 8 semanas
Entrega: Email marketing, automations, analytics

Incluye:
- Email campaigns
- Automations (welcome, abandoned cart)
- Customer segmentation
- Marketing analytics
```

### Semanas 45-52 - Escalabilidad e Infraestructura (PENDIENTE)

```
Objetivo: Preparado para 10M+ usuarios
Riesgo: ALTO
Duración: 8 semanas
Entrega: Arquitectura resiliente, observabilidad

Incluye:
- Database optimization
- CDN implementation
- Load balancing
- Monitoring y alertas
- Backup y disaster recovery
```

### Semanas 53-56 - Documentación Final (PENDIENTE)

```
Objetivo: Handoff y roadmap futuro
Riesgo: BAJO
Duración: 4 semanas
Entrega: Proyecto completamente documentado

Incluye:
- API documentation
- Deployment guide
- Troubleshooting guide
- Roadmap 2.0
```

---

## 📁 Estructura de Carpetas

```
tienda-online/
├── app/
│   ├── (auth)/           ← Arquitecto B
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (store)/          ← Arquitecto B
│   │   ├── shop/page.tsx
│   │   └── [product]/page.tsx
│   ├── (dashboard)/      ← Protegido
│   │   └── [storeId]/...
│   └── api/              ← Arquitecto A
│       ├── auth/
│       ├── products/
│       ├── checkout/
│       └── webhooks/
├── lib/
│   ├── auth/             ← Arquitecto A
│   ├── db/               ← Arquitecto A
│   ├── security/         ← Arquitecto A
│   ├── payments/         ← Arquitecto A
│   ├── hooks/            ← Arquitecto B
│   └── utils/
├── components/
│   ├── ui/               ← shadcn/ui
│   ├── shared/           ← Arquitecto B
│   └── features/         ← Arquitecto B
├── prisma/
│   ├── schema.prisma     ← Arquitecto A
│   └── migrations/
└── public/
```

---

## 🔗 API Contracts (Arquitecto A ↔ B)

### Autenticación

```
POST /api/auth/google
POST /api/auth/logout
GET /api/auth/me
```

### Productos

```
GET /api/products?tenantId=UUID&category=slug&page=1
POST /api/products (admin)
PUT /api/products/:id (admin)
DELETE /api/products/:id (admin)
```

### Órdenes

```
GET /api/orders
POST /api/checkout
GET /api/orders/:id
PUT /api/orders/:id/status
```

---

## 💡 Patrones Clave

### Validación Zod (Reutilizable)

```typescript
// /lib/security/validation.ts
export const Schemas = {
  UUID: z.string().uuid(),
  PRICE: z.number().positive(),
  EMAIL: z.string().email(),
  // ... más
};
```

### Tenant Isolation

```typescript
// CRÍTICO: Filtrar por tenantId en CADA query
const products = await db.product.findMany({
  where: {
    tenantId: currentUserTenant, // ← OBLIGATORIO
    ...filters,
  },
});
```

### RBAC Middleware

```typescript
export async function requireRole(role: UserRole) {
  const session = await getServerSession();
  if (session.user.role !== role) throw new Error("Forbidden");
  return session;
}
```

---

## 📋 Checklist para CI/CD

Antes de hacer cualquier commit:

```bash
✅ npm run build       # Verificar tipos y bundling
✅ npm run lint        # ESLint
✅ npm test            # Tests
✅ npm run type-check  # TypeScript strict
```

---

## 🎯 Instrucciones para IA (Claude/otros)

### Cuándo pedir ayuda a IA:

1. **Lectura de documentación**: "Lee todos los archivos .md del proyecto"
2. **Implementación de features**: "Implementa la API de [feature]"
3. **Debugging**: "¿Por qué falla este test?"
4. **Refactoring**: "Mejora este código"
5. **Documentación**: "Crea docs para [feature]"

### Instrucciones importantes:

- ✅ Seguir el stack exactamente (Next.js 14+, Prisma, TypeScript)
- ✅ Implementar validaciones Zod en TODAS las APIs
- ✅ Tenant isolation en TODAS las queries
- ✅ Tests para código crítico
- ✅ Comentarios explicativos para lógica compleja
- ❌ NO hardcodear valores
- ❌ NO confiar en input del cliente
- ❌ NO commitear secretos

---

## 📊 Métricas de Éxito

Cada sprint debe cumplir:

```
Performance:
✅ Lighthouse > 90
✅ FCP < 1.5s
✅ LCP < 2.5s

Seguridad:
✅ 0 vulnerabilidades
✅ CSP score A
✅ Todos endpoints autenticados

Código:
✅ TypeScript strict mode
✅ 80%+ coverage
✅ Zero ESLint warnings

Funcionalidad:
✅ Todos los acceptance criteria
✅ Tests pasando
✅ Manual testing OK
```

---

## 📞 Contacto y Notas

**Repositorio**: https://github.com/SACRINT/SACRINT_Tienda_OnLine.git

**Desarrolladores**:

- Arquitecto A (Backend): [nombre]
- Arquitecto B (Frontend): [nombre]

**Notas importantes**:

- Todos los PRs requieren code review mínima
- Main branch siempre deployable
- Documentar cambios en CHANGELOG
- Daily standups en morning/evening
- Weekly code reviews viernes 4pm

---

## 🔄 Sincronización de Cambios

Si alguien modifica este archivo:

```bash
git pull origin main  # Siempre pull antes de trabajar
git checkout develop   # Trabajar en develop
git push origin develop  # Push cambios
```

---

## 📊 Resumen de Estado

### Progreso General

```
Semanas 1-4:     ✅ COMPLETADAS (100%)
Sprint 0:        ✅ COMPLETADO (100%)
Semanas 5-56:    ⏳ PENDIENTE (0%)
────────────────────────────
Total Progreso:  ~7% del plan de 56 semanas
```

### Métricas Actuales

```
TypeScript:      ✅ 0 errores (122 resueltos)
Build Status:    ✅ Exitoso
Deployment:      ✅ Vercel (funcionando)
Tests:           ✅ Infrastructure configurado
Code Quality:    ✅ Strict TypeScript, ESLint configured
```

### Stack Confirmado

```
Frontend:        ✅ Next.js 14, React 18, TypeScript, Tailwind, shadcn/ui
Backend:         ✅ Next.js API, Prisma, PostgreSQL, NextAuth.js v5
Payments:        ✅ Stripe, MercadoPago (placeholders - MERCADOPAGO_ACCESS_TOKEN=APP_USR-TEST_TOKEN, NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-TEST_PUBLIC_KEY)
Email:           ✅ Resend API
Deployment:      ✅ Vercel
Database:        ✅ Neon PostgreSQL
```

---

## 📞 Instrucciones para Arquitectos

### Estado Actual

- **Rama principal**: `main` (estable, deployada)
- **Rama develop**: Disponible para nuevas features
- **Deployment**: Vercel (production-ready)

### Próximos Pasos Recomendados

**Opción A: Semanas 5-8 - Transformación UX/UI**

```bash
git checkout develop
git pull origin develop
# Crear feature branch para UX/UI
git checkout -b feature/weeks-5-8-ui-transformation
```

**Opción B: Semanas 9-12 - Catálogo Profesional**

```bash
git checkout develop
git pull origin develop
# Crear feature branch para catálogo
git checkout -b feature/weeks-9-12-professional-catalog
```

### Checklist Pre-desarrollo

- ✅ Clonar repositorio
- ✅ Instalar dependencias: `npm install`
- ✅ Verificar build: `npm run build`
- ✅ Ejecutar tests: `npm test`
- ✅ Iniciar dev server: `npm run dev`
- ✅ Leer documentación relevante de INDICE-DOCUMENTACION-TIENDA-ONLINE.md

---

**Última actualización**: 23 de Noviembre, 2025
**Estado**: ✅ Sprint 0 completado - Proyecto deployado
**Próximo paso**: Seleccionar siguiente fase (Semanas 5-8, 9-12, o 13-20)

Para preguntas técnicas, consulta:

- ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md (diseño del sistema)
- CHANGELOG.md (historial de cambios)
- INDICE-DOCUMENTACION-TIENDA-ONLINE.md (navegación de docs)
