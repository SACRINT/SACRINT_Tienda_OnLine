# CLAUDE.md - Contexto del Proyecto para Desarrolladores IA

**Fecha de creación**: 15 de Noviembre, 2025
**Versión**: 1.0.0
**Estado**: En desarrollo activo

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

## 🚀 Plan de Desarrollo (Sprints)

### Sprint 0: Configuración (2-3 horas)
```
✅ GitHub repo setup
✅ Next.js initialization
✅ Neon database
✅ Tailwind + shadcn/ui
✅ Estructura de carpetas
✅ Validación local
Resultado: Proyecto corriendo en localhost
```

### Sprint 1: Autenticación + Tenants (4-5 días)
```
Arquitecto A (Backend):
- NextAuth.js con Google OAuth
- API de autenticación
- Tenant management
- DAL (Data Access Layer)

Arquitecto B (Frontend):
- Login/signup pages
- Dashboard layout
- Protected routes
- Auth UI components

Resultado: Usuarios pueden registrarse y crear tienda
```

### Sprint 2: Catálogo (4-5 días)
```
Arquitecto A:
- CRUD API de productos
- Validaciones Zod
- Índices de BD

Arquitecto B:
- Product listing UI
- Filtros y búsqueda
- Product detail page
- Galería de imágenes

Resultado: Dueños de tienda pueden agregar productos
```

### Sprint 3: Carrito + Checkout (4-5 días)
```
Arquitecto A:
- API de carrito
- Stripe integration
- Webhook handling
- Cálculo de impuestos/envío

Arquitecto B:
- Cart UI con Zustand
- Checkout wizard
- Stripe Elements
- Order confirmation

Resultado: Clientes pueden comprar y pagar
```

### Sprint 4: Post-venta (3-4 días)
```
Arquitecto A:
- API de órdenes
- Email transaccional
- Analytics backend

Arquitecto B:
- Order management UI
- Customer account
- Order history
- Reviews system

Resultado: MVP listo para producción
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
}
```

### Tenant Isolation
```typescript
// CRÍTICO: Filtrar por tenantId en CADA query
const products = await db.product.findMany({
  where: {
    tenantId: currentUserTenant, // ← OBLIGATORIO
    ...filters
  }
})
```

### RBAC Middleware
```typescript
export async function requireRole(role: UserRole) {
  const session = await getServerSession()
  if (session.user.role !== role) throw new Error('Forbidden')
  return session
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

**Última actualización**: 15 de Noviembre, 2025
**Estado**: ✅ Proyecto listo para desarrollo
**Próximo paso**: Ejecutar SPRINT-0-SETUP-CHECKLIST.md

Para preguntas, consulta el INDICE-DOCUMENTACION-TIENDA-ONLINE.md
