# 👥 DIVISIÓN DE TRABAJO - ARQUITECTO A Y ARQUITECTO B

**Objetivo:** Maximizar velocidad desarrollando en paralelo sin conflictos de código

**Regla de Oro:** Arquitecto A y B trabajarán en DIFERENTES ramas de Git, sin interferencias. Sincronización diaria con develop branch.

---

## 🧭 MAPA DE RESPONSABILIDADES

### 📌 ARQUITECTO A: Backend y Datos

**Especialidad:** Lógica del negocio, APIs, Base de datos, Seguridad del servidor

**Ramas de trabajo:**

- `feature/auth-oauth` - Autenticación Google OAuth
- `feature/api-products` - CRUD de productos
- `feature/api-orders` - CRUD de órdenes y pagos
- `feature/db-schema` - Optimizaciones de BD

**Ubicaciones de trabajo:**

```
src/app/api/                    ← Todas las rutas API
src/lib/db/                     ← Data Access Layer (DAL)
src/lib/auth/                   ← Configuración NextAuth.js
src/lib/security/               ← Validaciones, rate limiting
src/lib/payments/               ← Stripe integration
src/lib/email/                  ← Templates Resend
prisma/schema.prisma            ← Modelos de datos
prisma/migrations/              ← Migraciones SQL
```

**Tareas iniciales (Sprint 1):**

1. Configurar NextAuth.js con Google OAuth (4 horas)
2. Crear 12 API routes principales (8 horas)
3. Implementar validaciones con Zod (4 horas)
4. Integrar Stripe payments (6 horas)
5. Crear email templates (3 horas)

**Total estimado:** 25 horas en Sprint 1

---

### 🎨 ARQUITECTO B: Frontend y UX

**Especialidad:** Interfaz de usuario, Experiencia del cliente, Flujo de navegación, Componentes

**Ramas de trabajo:**

- `feature/auth-pages` - Login/signup UI
- `feature/dashboard-ui` - Panel de administración
- `feature/store-pages` - Páginas públicas de tienda
- `feature/components` - Sistema de componentes

**Ubicaciones de trabajo:**

```
src/app/(auth)/                 ← Páginas login/signup
src/app/(dashboard)/            ← Admin panel
src/app/(store)/                ← Tienda pública
src/components/ui/              ← Components shadcn/ui
src/components/shared/          ← Header, Footer, Nav
src/components/features/        ← ProductCard, Cart, etc
src/lib/hooks/                  ← Custom React hooks
src/styles/                     ← CSS custom
```

**Tareas iniciales (Sprint 1):**

1. Crear login/signup pages (6 horas)
2. Crear dashboard layout (5 horas)
3. Crear tienda pública (catalog, product detail) (8 horas)
4. Crear componentes base (ProductCard, Cart, etc) (6 horas)
5. Integrar con hooks de autenticación (3 horas)

**Total estimado:** 28 horas en Sprint 1

---

## 🔗 PUNTOS DE INTEGRACIÓN

### "Contratos de API" - Arquitecto A ↔ Arquitecto B

Estos son los **contratos** que ambos arquitectos deben acordar ANTES de comenzar:

#### Contrato 1: Autenticación

```typescript
// Arquitecto A entrega:
POST /api/auth/google
POST /api/auth/logout
GET /api/auth/me

Response:
{
  user: {
    id: string
    email: string
    name: string
    image?: string
    tenantId: string
    role: "SUPER_ADMIN" | "STORE_OWNER" | "CUSTOMER"
  }
  token: string
}

// Arquitecto B consume:
import { useSession } from 'next-auth/react'
useSession().data?.user // obtiene datos del usuario
```

#### Contrato 2: Productos

```typescript
// Arquitecto A entrega:
GET /api/products?tenantId=UUID&category=slug&page=1
POST /api/products (protegido, STORE_OWNER)
PUT /api/products/:id (protegido)
DELETE /api/products/:id (protegido)

Response:
{
  products: [{
    id: string
    name: string
    slug: string
    price: number
    salePrice?: number
    image: string
    description: string
    sku: string
    stock: number
  }],
  pagination: { page: 1, limit: 20, total: 100 }
}

// Arquitecto B consume:
const { data } = useFetchProducts({ tenantId, category })
```

#### Contrato 3: Órdenes

```typescript
// Arquitecto A entrega:
GET /api/orders (usuario actual)
POST /api/checkout
GET /api/orders/:id
PUT /api/orders/:id/status

Response (orders):
{
  orders: [{
    id: string
    status: OrderStatus
    total: number
    items: OrderItem[]
    createdAt: string
  }]
}

// Arquitecto B consume:
const orders = useOrders(userId)
```

---

## 📊 CRONOGRAMA DE SINCRONIZACIÓN

### Diariamente (9am / 5pm)

```
09:00 - DAILY STANDUP (15 min)
├─ Arquitecto A: ¿Qué hiciste? ¿Qué bloqueos tienes?
├─ Arquitecto B: ¿Qué hiciste? ¿Qué bloqueos tienes?
└─ Resolver cualquier conflicto API

17:00 - GIT SYNC (10 min)
├─ Ambos: git pull origin develop
├─ Ambos: Resolver merge conflicts si hay
└─ Ambos: npm install (si hay cambios en package.json)
```

### Semanalmente (Viernes 4pm)

```
CODE REVIEW (1 hora)
├─ Revisar 10-15 PRs de la semana
├─ Validar que:
│  ├─ TypeScript types correctos
│  ├─ Error handling implementado
│  ├─ Validaciones Zod (Arquitecto A)
│  ├─ Accesibilidad (Arquitecto B)
│  └─ No hay código muerto
└─ Mergear a develop
```

### Mensualmente (Fin de mes)

```
RETROSPECTIVA Y PLANNING
├─ Qué salió bien
├─ Qué salió mal
├─ Improvements para siguiente mes
└─ Planning del siguiente sprint
```

---

## 🚨 REGLAS DE CONFLICTO EVITACIÓN

### ❌ NO HAGAS ESTO

```
Arquitecto B: NO edites archivos en src/app/api/
Arquitecto A: NO edites archivos en src/app/(auth)/ ni src/app/(dashboard)/
Ambos: NO mergeen directamente a main sin PR
```

### ✅ HAAZ ESTO

```
1. Siempre crear rama feature/nombre-descriptivo
2. Trabajar en tu rama sin afectar a otros
3. Crear PR a develop (NO a main)
4. Code review de mínimo 1 persona antes de mergear
5. Deletear rama después de mergear
```

---

## 📋 GIT WORKFLOW

### Paso 1: Crear rama feature

```bash
# Arquitecto A:
git checkout develop
git pull origin develop
git checkout -b feature/auth-oauth

# Arquitecto B:
git checkout develop
git pull origin develop
git checkout -b feature/auth-pages
```

### Paso 2: Trabajar en rama (diario)

```bash
# Hacer cambios...
git add .
git commit -m "feat: Agregar Google OAuth verification endpoint"
git push -u origin feature/auth-oauth
```

### Paso 3: Crear Pull Request

```bash
# En GitHub:
1. Click "Compare & pull request"
2. Base: develop
3. Compare: feature/auth-oauth
4. Title: "feat(auth): Implement Google OAuth endpoint"
5. Description: Qué cambios, por qué, testing
6. Click "Create pull request"
```

### Paso 4: Code Review

```bash
# Arquitecto B revisa código de Arquitecto A
# Comenta, sugiere cambios si hay
# Aprueba con "Approve"
```

### Paso 5: Mergear

```bash
# Arquitecto A (después de aprobación):
1. En PR, click "Merge pull request"
2. Click "Confirm merge"
3. En local: git checkout develop
4. git pull origin develop
5. git branch -d feature/auth-oauth
```

---

## 🔐 PROTECCIÓN DE DATOS SENSIBLES

### Secretos que NO deben commitearse

```
.env.local                  ← NUNCA
GOOGLE_SECRET              ← En GitHub Secrets, NO en código
STRIPE_SECRET_KEY          ← En GitHub Secrets, NO en código
DATABASE_URL               ← En .env.local, NO commiteado
JWT_SECRET                 ← En .env.local, NO commiteado
```

### Cómo manejar secretos correctamente

```typescript
// ❌ NO HAGAS ESTO:
export const GOOGLE_SECRET = "sk_live_123abc...";

// ✅ HAZ ESTO:
const googleSecret = process.env.GOOGLE_SECRET;

// Validar que exista:
if (!googleSecret) {
  throw new Error("Missing GOOGLE_SECRET in environment");
}
```

---

## 💻 TECNOLOGÍAS POR ARQUITECTO

### Arquitecto A debe dominar:

- Next.js API Routes
- TypeScript (tipos avanzados)
- Prisma (migraciones, relaciones complejas)
- PostgreSQL
- NextAuth.js
- Stripe API
- REST API design
- Error handling y logging
- Testing backend (Jest)

### Arquitecto B debe dominar:

- React 18+ (hooks, context)
- Next.js Client Components
- TypeScript (tipos UI)
- Tailwind CSS
- shadcn/ui
- Zustand (state management)
- React Query (server state)
- Forms (React Hook Form + Zod)
- Accesibilidad (WCAG)
- Testing frontend (Vitest + React Testing Library)

---

## 📚 DOCUMENTACIÓN COMPARTIDA

Ambos arquitectos deben crear Y mantener actualizada:

```
docs/
├── API_CONTRACTS.md          ← Contratos de API (CRÍTICO)
├── DATABASE_SCHEMA.md        ← Schema Prisma documentado
├── DEPLOYMENT.md             ← Guía de deployment
├── ENVIRONMENT_SETUP.md      ← Cómo setup local
├── TESTING_STRATEGY.md       ← Cómo hacer tests
├── SECURITY_CHECKLIST.md     ← Security best practices
└── TROUBLESHOOTING.md        ← Problemas comunes y soluciones
```

---

## 🎯 COMMITS Y PR DESCRIPTION

### Formato de commit (Ambos)

```bash
git commit -m "feat(modulo): Descripción breve del cambio

- Detalle 1
- Detalle 2
- Testing: describe tu testing
- Notes: cualquier nota importante"
```

### Formato de PR description

```markdown
## 📝 Descripción

Qué cambios hace este PR y por qué

## 🔗 Issues Relacionadas

Fixes #123

## ✅ Testing

- [ ] Unit tests pasando
- [ ] Manual testing completado
- [ ] No hay breaking changes

## 📷 Screenshots (si aplica)

[Agregar screenshots de cambios UI]

## 🚨 Warnings o notas especiales

Si hay algo que requiera atención especial
```

---

## 🏆 MÉTRICAS DE ÉXITO

Al final de cada sprint, evaluar:

```
Arquitecto A:
✅ Todos los endpoints funcionando
✅ 80%+ code coverage en tests
✅ 0 security vulnerabilities
✅ Documentación API completa
✅ Performance: response time < 200ms

Arquitecto B:
✅ Todas las páginas renderizando
✅ 80%+ component test coverage
✅ Lighthouse score > 90
✅ Accesibilidad: WCAG AA
✅ Componentes documentados (Storybook)
```

---

**Próximo paso:** Una vez completado Sprint 0, ambos arquitectos pueden crear sus ramas feature y comenzar Sprint 1 en paralelo.
