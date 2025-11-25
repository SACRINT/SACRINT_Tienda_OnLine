# PLAN ARQUITECTO 56 SEMANAS - PLATAFORMA E-COMMERCE SAAS MULTI-TENANT

**Documento**: Plan Integral de Desarrollo
**Versión**: 2.0
**Fecha Creación**: 15 de Noviembre, 2025
**Última Actualización**: 22 de Noviembre, 2025
**Estado**: Activo - En Ejecución
**Lenguaje**: Español

---

## TABLA DE CONTENIDOS

1. [Fases del Proyecto](#fases-del-proyecto)
2. [Semanas 1-4: Auditoría y Fundamentos](#semanas-1-4-auditoría-y-fundamentos)
3. [Semanas 5-8: Transformación UX/UI](#semanas-5-8-transformación-uxui)
4. [Semanas 9-12: Catálogo Profesional](#semanas-9-12-catálogo-profesional)
5. [Semanas 13-20: Pagos, Órdenes y Logística](#semanas-13-20-pagos-órdenes-y-logística)
6. [Semanas 21-28: Panel Administrativo y Analítica](#semanas-21-28-panel-administrativo-y-analítica)
7. [Semanas 29-36: Rendimiento, SEO y PWA](#semanas-29-36-rendimiento-seo-y-pwa)
8. [Semanas 37-44: Marketing y Automatización](#semanas-37-44-marketing-y-automatización)
9. [Semanas 45-52: Escalabilidad e Infraestructura](#semanas-45-52-escalabilidad-e-infraestructura)
10. [Semanas 53-56: Documentación Final y Roadmap 2.0](#semanas-53-56-documentación-final-y-roadmap-20)

---

## FASES DEL PROYECTO

```
FASE 1 (Semanas 1-4): AUDITORÍA Y FUNDAMENTOS
├─ Objetivo: Código limpio, seguridad garantizada, documentación
├─ Riesgo: CRÍTICO
└─ Entrega: Proyecto production-ready en localhost

FASE 2 (Semanas 5-8): TRANSFORMACIÓN UX/UI
├─ Objetivo: Interfaz profesional y moderna
├─ Riesgo: ALTO (user acceptance)
└─ Entrega: Shop completamente funcional

FASE 3 (Semanas 9-12): CATÁLOGO PROFESIONAL
├─ Objetivo: Gestión avanzada de productos
├─ Riesgo: MEDIO
└─ Entrega: CRUD, búsqueda, filtros

FASE 4 (Semanas 13-20): PAGOS, ÓRDENES Y LOGÍSTICA
├─ Objetivo: Transacciones y flujo completo
├─ Riesgo: CRÍTICO (dinero real)
└─ Entrega: MVP con pagos reales

FASE 5 (Semanas 21-28): ADMIN Y ANALÍTICA
├─ Objetivo: Control total de operaciones
├─ Riesgo: MEDIO
└─ Entrega: Dashboard operacional completo

FASE 6 (Semanas 29-36): RENDIMIENTO, SEO Y PWA
├─ Objetivo: Competitividad en Google
├─ Riesgo: MEDIO
└─ Entrega: Lighthouse >90, Core Web Vitals OK

FASE 7 (Semanas 37-44): MARKETING Y AUTOMATIZACIÓN
├─ Objetivo: Crecimiento de usuarios
├─ Riesgo: BAJO
└─ Entrega: Email marketing, automations, analytics

FASE 8 (Semanas 45-52): ESCALABILIDAD E INFRAESTRUCTURA
├─ Objetivo: Preparado para 10M+ usuarios
├─ Riesgo: ALTO
└─ Entrega: Arquitectura resiliente, observabilidad

FASE 9 (Semanas 53-56): DOCUMENTACIÓN FINAL
├─ Objetivo: Handoff y roadmap futuro
├─ Riesgo: BAJO
└─ Entrega: Proyecto completamente documentado
```

---

# SEMANAS 1-4: AUDITORÍA Y FUNDAMENTOS

## SEMANA 1: AUDITORÍA DE CÓDIGO Y SEGURIDAD

### Objetivo Específico

Analizar el estado actual del proyecto, identificar deuda técnica, vulnerabilidades de seguridad y crear un backlog de fixes priorizado.

### Tareas Detalladas

**1.1 - Análisis de Cobertura de Tipos TypeScript**

- Usar `npm run type-check` para identificar errores de tipo
- Documentar cada error: archivo, línea, tipo de error, severidad
- Crear archivo `/docs/TYPE-ERRORS-AUDIT.md` con listado completo
- Priorizar errores que afecten seguridad (any types en validación)
- Crear GitHub issues para cada error crítico
- **Entregable**: Reporte de auditoría con 50+ páginas de análisis

**1.2 - Validación de Estructura Prisma**

- Revisar `/prisma/schema.prisma` línea por línea
- Verificar índices en campos de búsqueda (name, email, tenantId)
- Validar relaciones y cascades
- Revisar constraints de unicidad
- Crear diagrama ER en `/docs/DATABASE-SCHEMA-DIAGRAM.md`
- **Entregable**: Schema validado, diagrama actualizado

**1.3 - Auditoría de Endpoints API**

- Documentar todos los `/api/*` endpoints en tabla
- Verificar autenticación en cada uno (requireAuth, roleCheck)
- Validar validación Zod en body/query
- Comprobar respuestas HTTP correctas (200, 400, 401, 403, 500)
- Crear matriz: endpoint × autenticación × validación
- **Entregable**: `/docs/API-ENDPOINTS-MATRIX.md` (matriz 20+x4)

**1.4 - Análisis de Deuda Técnica**

- Buscar TODO, FIXME, HACK comments en codebase
- Usar grep para encontrar: `// TODO|FIXME|HACK|XXX|REVIEW`
- Clasificar por severidad: CRITICAL, HIGH, MEDIUM, LOW
- Crear issues en GitHub para cada uno
- Estimar horas de fix por categoría
- **Entregable**: Backlog de 40+ items de deuda técnica

**1.5 - Revisión de Validaciones Zod**

- Verificar que TODAS las APIs tengan esquema Zod
- Documentar esquemas faltantes
- Revisar que reglas sean consistentes (ej: email en múltiples schemas)
- Crear `/lib/security/validation-schemas.ts` centralizado
- Validar tipos: UUID, EMAIL, PRICE, PHONE, etc.
- **Entregable**: Esquemas centralizados y validados

**1.6 - Auditoría de Dependencias**

- Ejecutar `npm audit` y revisar vulnerabilidades
- Actualizar packages vulnerables
- Revisar versiones de dependencias críticas:
  - Prisma (>6.0)
  - Next.js (14+)
  - NextAuth (5+)
  - Stripe SDK
- Crear lock file actualizado
- **Entregable**: Todas las vulnerabilidades auditadas y fixes aplicados

**1.7 - Análisis de Autenticación**

- Revisar flujo de NextAuth en `/lib/auth/*`
- Verificar manejo seguro de JWT/sesiones
- Revisar middleware de autenticación
- Documentar roles y permisos
- Crear diagrama de flujo: login → token → autorización
- **Entregable**: Documento de arquitectura de autenticación

**1.8 - Validación de Aislamiento Multi-tenant**

- Auditoría: ¿TODAS las queries filtran por tenantId?
- Crear script que busque `findMany`, `findFirst`, `count` sin tenantId
- Listar potenciales data leaks
- Crear fixes para cada uno
- **Entregable**: Confirmación de aislamiento 100%

**1.9 - Revisión de Manejo de Errores**

- Auditoría: ¿Dónde se usan try-catch incorrectamente?
- Revisar logging: ¿Se logean errores con contexto suficiente?
- Verificar error messages: ¿Exponen detalles internos?
- Crear estándar de error handling
- Documentar códigos de error HTTP
- **Entregable**: Error handling guide completo

**1.10 - Análisis de Performance Inicial**

- Ejecutar Lighthouse en 5 páginas clave
- Documentar LCP, CLS, FID actuales
- Identificar bottlenecks: queries N+1, componentes sin memoization, etc.
- Crear baseline de performance
- Documentar en `/docs/PERFORMANCE-BASELINE.md`
- **Entregable**: Metrics de baseline listos para mejora

**1.11 - Auditoría de Variables de Entorno**

- Verificar que NO hay secrets en código
- Revisar `.env.example` está completo
- Documentar variables requeridas
- Crear script de validación `check-env.sh`
- **Entregable**: `.env.example` actualizado, script de validación

**1.12 - Planificación de Roadmap de Fixes**

- Consolidar todos los findings (tipos, validación, seguridad)
- Crear priorización: Critical → High → Medium → Low
- Estimar horas por categoría
- Identificar dependencias entre fixes
- Crear diagrama Gantt de la próxima semana
- **Entregable**: Plan detallado para Semana 2

### Entregables de la Semana 1

- ✅ `/docs/TYPE-ERRORS-AUDIT.md` (50+ issues documentadas)
- ✅ `/docs/DATABASE-SCHEMA-DIAGRAM.md` (diagrama ER actualizado)
- ✅ `/docs/API-ENDPOINTS-MATRIX.md` (matriz de endpoints)
- ✅ `/docs/DEUDA-TECNICA.md` (40+ items clasificados)
- ✅ `npm audit` completado y reportado
- ✅ 15+ GitHub issues creados
- ✅ Baseline de performance documentado

### Métricas de Éxito (Semana 1)

- ✅ 100% de endpoints auditados
- ✅ 100% deuda técnica documentada
- ✅ 0 vulnerabilidades críticas sin fix
- ✅ Roadmap priorizado completado
- ✅ Todo documentado en `/docs`

### Dependencias Previas

- Acceso a repo GitHub
- Environment de desarrollo local
- Node 18+, npm 9+

---

## SEMANA 2: FIXES DE CÓDIGO Y SEGURIDAD

### Objetivo Específico

Reparar todos los errores de tipo TypeScript críticos, vulnerabilidades de seguridad y establecer estándares de código.

### Tareas Detalladas

**2.1 - Fix de Errores de Tipo TypeScript Críticos**

- Enfocarse en errors que bloquean build
- Eliminar `// @ts-ignore` y `// @ts-nocheck`
- Usar `unknown` en lugar de `any` donde sea apropiado
- Crear tipos reutilizables en `/lib/types/index.ts`
- Ejecutar `npm run type-check` después de cada fix
- Archivo: `/src/lib/types/index.ts` con:
  ```typescript
  // Tipos globales reutilizables
  export type UUID = string & { readonly __brand: "UUID" };
  export type Email = string & { readonly __brand: "Email" };
  export type Price = number & { readonly __brand: "Price" };
  export type Slug = string & { readonly __brand: "Slug" };
  export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
  export interface JSONObject {
    [key: string]: JSONValue;
  }
  export type JSONArray = JSONValue[];
  ```
- **Entregable**: Build sin errores de tipo

**2.2 - Centralización de Esquemas Zod**

- Crear `/lib/security/validation-schemas.ts` con todos los schemas
- Importar y reutilizar en todas las APIs
- Estándares:
  ```typescript
  // schemas.ts
  export const Schemas = {
    UUID: z.string().uuid("UUID inválido"),
    EMAIL: z.string().email("Email inválido").toLowerCase(),
    PRICE: z.number().positive("Precio debe ser positivo"),
    PHONE: z.string().regex(/^\+?[0-9]{10,}/, "Teléfono inválido"),
    SLUG: z.string().regex(/^[a-z0-9-]+$/, "Slug inválido"),
    PASSWORD: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  };
  ```
- Documentar reglas de validación en comentarios
- **Entregable**: Archivo centralizado con 20+ esquemas

**2.3 - Implementación de RBAC Correcto**

- Crear middleware en `/lib/auth/rbac.ts`:

  ```typescript
  export async function requireAuth() {
    const session = await getServerSession(authConfig);
    if (!session) throw new UnauthorizedError("No autenticado");
    return session;
  }

  export async function requireRole(...roles: string[]) {
    const session = await requireAuth();
    if (!roles.includes(session.user.role)) {
      throw new ForbiddenError("Permiso denegado");
    }
    return session;
  }
  ```

- Usar en TODAS las APIs protegidas
- Crear tests para cada combinación role × endpoint
- **Entregable**: RBAC middleware implementado en 20+ endpoints

**2.4 - Fix de Validación Multi-tenant**

- Auditar TODAS las queries (`findMany`, `findFirst`, `count`, etc.)
- Crear script que enforce tenantId en donde clause
- Ejemplo de pattern correcto:
  ```typescript
  const products = await db.product.findMany({
    where: {
      tenantId: currentUserTenantId, // ← OBLIGATORIO
      published: true,
      ...otherFilters,
    },
  });
  ```
- Crear linter rule customizado (ESLint plugin)
- **Entregable**: Todas las queries multi-tenant validadas

**2.5 - Implementación de Error Handling Estándar**

- Crear `/lib/errors/api-errors.ts`:

  ```typescript
  export class APIError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public code?: string,
    ) {
      super(message);
    }
  }

  export class ValidationError extends APIError {
    constructor(
      message: string,
      public fields?: Record<string, string>,
    ) {
      super(400, message, "VALIDATION_ERROR");
    }
  }

  export class UnauthorizedError extends APIError {
    constructor(message = "No autenticado") {
      super(401, message, "UNAUTHORIZED");
    }
  }
  ```

- Crear middleware de error global en `/app/api/middleware.ts`
- Respuesta estándar:
  ```typescript
  {
    success: false,
    error: {
      code: "ERROR_CODE",
      message: "Mensaje para usuario",
      details: { /* info técnica */ }
    }
  }
  ```
- **Entregable**: Error handling en todos los endpoints

**2.6 - Seguridad de Variables de Entorno**

- Crear `/lib/config/env.ts` con validación:

  ```typescript
  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
    STRIPE_PUBLIC_KEY: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    // ... más
  });

  export const env = envSchema.parse(process.env);
  ```

- Ejecutar en tiempo de build (fail fast)
- Documentar requeridas vs opcionales en `.env.example`
- **Entregable**: Validación de env en startup

**2.7 - Protección contra CSRF y XSS**

- Revisar headers de seguridad en `next.config.js`:
  ```typescript
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Content-Security-Policy", value: "..." },
      ],
    },
  ];
  ```
- Validar CSP no sea too permissive
- Documentar política en `/docs/SECURITY-HEADERS.md`
- **Entregable**: Headers de seguridad documentados y testados

**2.8 - Rate Limiting en APIs**

- Implementar Redis-based rate limiting en `/lib/security/rate-limit.ts`:
  ```typescript
  export async function rateLimit(key: string, options: RateLimitOptions) {
    const count = await redis.incr(`ratelimit:${key}`);
    if (count === 1) {
      await redis.expire(`ratelimit:${key}`, options.windowSeconds);
    }
    if (count > options.maxRequests) {
      throw new RateLimitError("Too many requests");
    }
  }
  ```
- Aplicar en endpoints sensibles:
  - Login: 5 intentos/15 min
  - Signup: 3/hora
  - Checkout: 10/hora
  - API general: 100/min
- Documentar límites en `/docs/RATE-LIMITS.md`
- **Entregable**: Rate limiting en 10+ endpoints críticos

**2.9 - Implementación de Logging Estructurado**

- Usar Pino/Winston para logs estructurados:

  ```typescript
  import { logger } from "@/lib/logger";

  logger.info("User login", {
    userId: "123",
    timestamp: new Date(),
    context: "auth",
  });
  ```

- Niveles: DEBUG, INFO, WARN, ERROR, FATAL
- NO loguear passwords, tokens, PII
- Enviar a stdout (Vercel captura automáticamente)
- **Entregable**: Logger implementado en todas las APIs

**2.10 - Testing de Seguridad**

- Crear `/tests/security` con:
  - Test RBAC: role CUSTOMER no puede acceder /api/admin
  - Test multi-tenant: tenant A no ve datos de tenant B
  - Test CSRF: requests sin token fallan
  - Test rate limiting: requests 6+ fallan
  - Test XSS: valores `<script>` se sanitizan
- Mínimo 20 tests de seguridad
- **Entregable**: 20+ tests de seguridad pasando

**2.11 - Revisión de Dependencias Críticas**

- Actualizar a versiones seguras:
  ```json
  {
    "next": "^14.2.18",
    "prisma": "^6.19.0",
    "next-auth": "^5.0.0",
    "stripe": "^19.3.0"
  }
  ```
- Revisar changelogs para breaking changes
- Testear build y startup
- **Entregable**: package.json actualizado y lock file

**2.12 - Documentación de Standards**

- Crear `/docs/CODING-STANDARDS.md`:
  - TypeScript strict mode: sí
  - Zod validation: SIEMPRE
  - Error handling: try-catch con logging
  - RBAC: en TODOS los endpoints
  - Tenant isolation: en TODAS las queries
  - Rate limiting: en endpoints públicos
- Crear checklist pre-commit en `/hooks/pre-commit`
- **Entregable**: Documento de estándares y pre-commit hook

### Entregables de la Semana 2

- ✅ Build sin errores de tipo (`npm run type-check` pasa)
- ✅ Schemas centralizados en `/lib/security/validation-schemas.ts`
- ✅ RBAC implementado en 20+ endpoints
- ✅ Todas las queries multi-tenant validadas
- ✅ Error handling estándar en todos los endpoints
- ✅ Rate limiting en endpoints críticos
- ✅ 20+ tests de seguridad
- ✅ `/docs/CODING-STANDARDS.md` creado

### Métricas de Éxito (Semana 2)

- ✅ `npm run type-check` con 0 errores
- ✅ `npm run build` exitoso
- ✅ 100% de endpoints con validación Zod
- ✅ 100% de queries con tenantId filter
- ✅ 100% de endpoints con RBAC
- ✅ Tests de seguridad: 20/20 pasando
- ✅ 0 vulnerabilidades críticas (npm audit)

---

## SEMANA 3: TESTING Y CI/CD

### Objetivo Específico

Establecer infraestructura de testing, CI/CD automatizado y garantizar calidad de código.

### Tareas Detalladas

**3.1 - Configuración de Jest para Unit Tests**

- Crear `/jest.config.js`:
  ```javascript
  module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
    },
    collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/**/*.stories.tsx"],
  };
  ```
- Configurar `tsconfig.json` para Jest (incluir test files)
- Crear scripts en `package.json`:
  ```json
  {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
  ```
- **Entregable**: Jest configurado y funcionando

**3.2 - Tests Unitarios para Funciones Críticas**

- Crear 50+ tests unitarios para:
  - Validaciones Zod (¿rechaza valores inválidos?)
  - Funciones de cálculo (impuestos, descuentos)
  - Conversión de tipos (Decimal → number)
  - Normalización de strings (búsqueda)
  - Funciones de seguridad (hash password)
- Ubicación: `/src/lib/**/__tests__/*.test.ts`
- Ejemplo:

  ```typescript
  // /src/lib/security/__tests__/hash.test.ts
  import { hashPassword, verifyPassword } from "../hash";

  describe("hashPassword", () => {
    it("should hash password securely", async () => {
      const password = "MyPassword123!";
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should verify correct password", async () => {
      const password = "MyPassword123!";
      const hash = await hashPassword(password);
      const valid = await verifyPassword(password, hash);
      expect(valid).toBe(true);
    });
  });
  ```

- **Entregable**: 50+ tests unitarios pasando

**3.3 - Tests de Integración para APIs**

- Crear `/tests/api` con tests para cada endpoint
- Usar `node-test-server` para spin up servidor
- Tests incluyen:
  - Happy path: request válido → 200 OK
  - Validación: request inválido → 400 Bad Request
  - Autenticación: sin token → 401 Unauthorized
  - Autorización: rol incorrecto → 403 Forbidden
  - Rate limiting: 6 requests → última falla
  - Multi-tenant: tenant A no ve datos de B
- Ejemplo:

  ```typescript
  // /tests/api/products.test.ts
  describe("GET /api/products", () => {
    it("should return products for valid tenant", async () => {
      const response = await fetch("/api/products?tenantId=uuid", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.products).toBeInstanceOf(Array);
    });

    it("should reject without auth", async () => {
      const response = await fetch("/api/products");
      expect(response.status).toBe(401);
    });
  });
  ```

- Mínimo 30 tests de integración
- **Entregable**: 30+ tests de integración

**3.4 - Configuración de Playwright para E2E**

- Crear `/playwright.config.ts`:

  ```typescript
  import { defineConfig, devices } from "@playwright/test";

  export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    use: {
      baseURL: "http://localhost:3000",
      trace: "on-first-retry",
    },
    projects: [
      {
        name: "chromium",
        use: { ...devices["Desktop Chrome"] },
      },
      {
        name: "firefox",
        use: { ...devices["Desktop Firefox"] },
      },
    ],
    webServer: {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
    },
  });
  ```

- Crear script: `"test:e2e": "playwright test"`
- **Entregable**: Playwright configurado

**3.5 - E2E Tests de Flujos Críticos**

- Crear `/tests/e2e` con tests de:
  1. **Auth**: Signup → Login → Dashboard → Logout
  2. **Shop**: Home → Search → Product Detail → Cart → Checkout
  3. **Pagos**: Order → Stripe Payment → Confirmation Email
  4. **Admin**: Dashboard → Add Product → Publish → See en Shop
- Ejemplo:

  ```typescript
  // /tests/e2e/shop.test.ts
  import { test, expect } from "@playwright/test";

  test("complete shop flow", async ({ page }) => {
    // Home
    await page.goto("/");
    await expect(page).toHaveTitle(/Tienda Online/);

    // Search
    await page.fill('input[placeholder="Buscar..."]', "laptop");
    await page.press('input[placeholder="Buscar..."]', "Enter");
    await expect(page).toHaveURL(/.*\?q=laptop/);

    // Product detail
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/producto\//);

    // Add to cart
    await page.click('button:has-text("Agregar al Carrito")');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText("1");

    // Checkout
    await page.click('a:has-text("Ver Carrito")');
    await page.click('button:has-text("Proceder al Pago")');
    await expect(page).toHaveURL(/\/checkout/);
  });
  ```

- Mínimo 10 E2E tests
- Ejecutar en CI contra Chrome y Firefox
- **Entregable**: 10+ E2E tests de flujos críticos

**3.6 - Configuración de GitHub Actions CI/CD**

- Crear `.github/workflows/ci.yml`:

  ```yaml
  name: CI
  on: [push, pull_request]

  jobs:
    test:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:15
          env:
            POSTGRES_PASSWORD: postgres
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5

      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: "18"
        - run: npm ci
        - run: npm run build
        - run: npm run type-check
        - run: npm run lint
        - run: npm run test:ci
        - run: npm run test:e2e
        - uses: codecov/codecov-action@v3
  ```

- Configurar para ejecutarse en:
  - Push a main y develop
  - Pull requests
  - Scheduled (nightly build)
- **Entregable**: CI pipeline funcionando en GitHub Actions

**3.7 - Coverage Reporting**

- Configurar `collectCoverageFrom` en jest.config.js
- Target: 80%+ coverage general, 95%+ en código crítico
- Integrar con codecov.io
- Crear `/docs/COVERAGE-REPORT.md` con baseline
- Crear GitHub comment bot que report coverage en PRs
- **Entregable**: Coverage >80%, reportado automáticamente

**3.8 - Linting y Formatting Automático**

- ESLint ya está, revisar config:
  ```json
  {
    "extends": ["next/core-web-vitals"],
    "rules": {
      "no-unused-vars": "error",
      "no-console": "warn",
      "@next/next/no-html-link-for-pages": "off"
    }
  }
  ```
- Prettier ya está, revisar `.prettierrc.json`
- Crear pre-commit hook con husky:
  ```bash
  # .husky/pre-commit
  #!/bin/sh
  npm run lint:staged
  ```
- Script en package.json:
  ```json
  {
    "lint": "next lint",
    "lint:staged": "lint-staged",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
  ```
- **Entregable**: Pre-commit hooks funcionando

**3.9 - Configuración de Prettier**

- Crear `.prettierrc.json`:
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2,
    "arrowParens": "always",
    "tailwindConfig": "./tailwind.config.js"
  }
  ```
- Integrar con VSCode: crear `.vscode/settings.json`:
  ```json
  {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
  ```
- **Entregable**: Formato automático en save

**3.10 - Tests de Performance**

- Crear `/tests/performance` con lighthouse checks:

  ```typescript
  import { playAudit } from "playwright-lighthouse";

  test("homepage lighthouse", async ({ page }) => {
    await page.goto("/");
    const audit = await playAudit({
      page,
      thresholds: {
        performance: 80,
        accessibility: 90,
        "best-practices": 80,
        seo: 80,
      },
    });
    expect(audit.finalUrl).toBe(page.url());
  });
  ```

- Verificar FCP < 1.5s, LCP < 2.5s, CLS < 0.1
- Ejecutar en CI
- **Entregable**: 5+ performance tests

**3.11 - Staging Deployment**

- Configurar rama `staging` en GitHub
- Crear workflow que deploya a Vercel staging en cada push
- URL: `staging.tienda-online.vercel.app`
- Ambiente: replica de production pero con datos de test
- **Entregable**: Staging deployment automático

**3.12 - Documentación de Testing**

- Crear `/docs/TESTING-GUIDE.md`:
  - Cómo ejecutar tests localmente
  - Estructura de carpetas
  - Patrón AAA (Arrange-Act-Assert)
  - Mocking de dependencias
  - Coverage targets
  - CI/CD expectations
- Ejemplo de test bien escrito para copiar/pegar
- **Entregable**: Guía de testing documentada

### Entregables de la Semana 3

- ✅ Jest configurado con 50+ unit tests
- ✅ 30+ integration tests de API
- ✅ 10+ E2E tests con Playwright
- ✅ Coverage >80% documentado
- ✅ CI/CD pipeline en GitHub Actions
- ✅ Pre-commit hooks funcionando
- ✅ Performance tests integrando

### Métricas de Éxito (Semana 3)

- ✅ `npm run test:ci` → 100% pasando
- ✅ `npm run test:e2e` → 10/10 pasando
- ✅ GitHub Actions: 0 failed builds
- ✅ Coverage: >80% general, 95% en crítico
- ✅ Lighthouse: >80 en todas las páginas
- ✅ Linting: 0 eslint warnings

---

## SEMANA 4: DOCUMENTACIÓN Y CONOCIMIENTO

### Objetivo Específico

Documentar completamente la arquitectura, decisiones de diseño y crear playbooks operacionales.

### Tareas Detalladas

**4.1 - Documentación de Arquitectura**

- Crear `/docs/ARCHITECTURE.md` (2000+ palabras):
  - Diagrama de capas: UI → API → DB
  - Data flow: request → response
  - Multi-tenancy design
  - Authentication flow: OAuth → JWT → session
  - Database schema justificación
  - Índices y performance considerations
- Crear diagramas con Mermaid:
  ```mermaid
  graph TD
    A[Client] -->|HTTP| B[Next.js API Routes]
    B -->|Prisma| C[PostgreSQL]
    B -->|Redis| D[Cache]
    B -->|Stripe| E[Payment Gateway]
  ```
- **Entregable**: Arquitectura documentada con diagramas

**4.2 - API Documentation**

- Documentar TODOS los endpoints en `/docs/API.md`:
  - Método HTTP
  - URL path con parámetros
  - Query parameters
  - Request body schema (Zod)
  - Response schema
  - HTTP status codes posibles
  - Ejemplos de curl/fetch
  - Rate limits
- Usar formato OpenAPI/Swagger
- Generar Swagger UI automáticamente si es posible
- Ejemplo:

  ````markdown
  ### GET /api/products

  Obtiene lista de productos de una tienda.

  **Autenticación**: Opcional (público)
  **Rate Limit**: 100/min

  #### Query Parameters

  - `tenantId` (required): UUID de la tienda
  - `page` (optional): Número de página, default 1
  - `limit` (optional): Items por página, default 24, máximo 100
  - `category` (optional): Slug de categoría para filtrar
  - `minPrice` (optional): Precio mínimo en centavos
  - `maxPrice` (optional): Precio máximo en centavos

  #### Response (200 OK)

  ```json
  {
    "success": true,
    "products": [
      {
        "id": "uuid",
        "name": "Laptop",
        "price": 99900,
        "salePrice": 79900,
        ...
      }
    ],
    "pagination": { "page": 1, "limit": 24, "total": 150 }
  }
  ```
  ````

  #### Errores
  - 400: `tenantId` inválido
  - 429: Rate limit excedido

  ```

  ```

- **Entregable**: Documentación de 30+ endpoints

**4.3 - Database Schema Documentation**

- Crear `/docs/DATABASE.md`:
  - Descripción de cada tabla
  - Campos: tipo, constraints, índices
  - Relaciones: foreign keys, cascades
  - Ejemplo migrations
  - Query optimization tips
- Crear diagrama ER mejorado
- Documentar índices creados y por qué
- Ejemplo:

  ```markdown
  ## Tabla: Product

  Almacena productos de una tienda.

  | Campo     | Tipo          | Constraint   | Índice | Propósito                |
  | --------- | ------------- | ------------ | ------ | ------------------------ |
  | id        | UUID          | PRIMARY KEY  | -      | Identificador único      |
  | tenantId  | UUID          | NOT NULL, FK | ✓      | Aislamiento multi-tenant |
  | name      | String        | NOT NULL     | ✓      | Búsqueda rápida          |
  | slug      | String        | UNIQUE       | ✓      | URLs amigables           |
  | basePrice | Decimal(12,2) | NOT NULL     | -      | Precio base              |
  | published | Boolean       | NOT NULL     | ✓      | Filtro visibility        |

  ### Índices

  - `(tenantId, published)` - Búsqueda por tienda y estado
  - `(tenantId, slug)` - URL amigable lookup
  - `(tenantId, name COLLATE "C")` - Búsqueda por nombre

  ### Relaciones

  - Product.tenantId → Tenant.id (CASCADE DELETE)
  - Product.categoryId → Category.id (SET NULL)
  - Product ← ProductImage (CASCADE DELETE)
  - Product ← Review (CASCADE DELETE)
  ```

- **Entregable**: Schema completamente documentado

**4.4 - Seguridad y Compliance Documentation**

- Crear `/docs/SECURITY.md`:
  - Autenticación: NextAuth + OAuth Google
  - Autorización: RBAC matrix
  - Encriptación: TLS en tránsito, bcrypt en passwords
  - Validación: Zod schemas
  - Rate limiting: límites por endpoint
  - Headers de seguridad: CSP, HSTS, etc.
  - Multi-tenancy: isolation guarantee
  - PII: cómo se maneja, dónde se almacena
  - Auditing: qué se registra
- Crear compliance checklist:
  - ✓ OWASP Top 10
  - ✓ GDPR compliance (si aplica)
  - ✓ PCI DSS (para pagos)
- **Entregable**: Security documentation completo

**4.5 - Deployment y Infrastructure**

- Crear `/docs/DEPLOYMENT.md`:
  - Vercel configuration
  - Environment variables requeridas
  - Database: Neon setup y backup
  - Redis: ioredis configuration
  - Third-party services: Stripe, Resend, etc.
  - DNS: custom domains
  - SSL/TLS: auto-managed by Vercel
  - Backups y disaster recovery
  - Scaling: qué sucede cuando crece
- Paso a paso para deployar:
  ```bash
  1. git checkout main
  2. git pull origin main
  3. npm install
  4. npm run build
  5. npm run test:ci
  6. git push origin main
  7. Vercel auto-deploys
  ```
- **Entregable**: Deployment guide completo

**4.6 - Troubleshooting Guide**

- Crear `/docs/TROUBLESHOOTING.md` con soluciones a:
  - Build failures (TypeScript, Missing deps)
  - Database connection errors
  - Authentication failures
  - Payment webhook issues
  - Email delivery failures
  - Performance problems
  - Out of memory errors
- Incluir logs esperados vs erróneos
- Incluir comandos debug útiles
- **Entregable**: Troubleshooting guide

**4.7 - Development Workflow Documentation**

- Crear `/docs/DEVELOPMENT.md`:
  - Cómo configurar ambiente local
  - npm scripts disponibles
  - Estructura de carpetas explicada
  - Convenciones de nomenclatura
  - Cómo agregar nuevas features
  - Git workflow: branches, PRs, merges
  - Commit message conventions
- Ejemplo:

  ```markdown
  ## Git Workflow

  1. Crear rama: `git checkout -b feature/description`
  2. Commits: `git commit -m "type: description"`

  - feat: Nueva feature
  - fix: Bug fix
  - docs: Documentación
  - refactor: Cambios de código sin cambiar comportamiento

  3. Push: `git push origin feature/description`
  4. Pull Request en GitHub
  5. Code review: al menos 1 aprobación
  6. Merge a main por maintainer
  ```

- **Entregable**: Development guide

**4.8 - Data Model Explanation**

- Crear diagrama para entender:
  - Cómo funciona multi-tenancy (Tenant → Products)
  - Cómo funciona RBAC (User → Role → Permissions)
  - Cómo funciona orden (Order → OrderItems → Products)
  - Cómo funciona cart (CartItem → Product, transient en Redis)
- Crear ejemplos de queries comunes:

  ```sql
  -- Productos de una tienda
  SELECT * FROM "Product"
  WHERE "tenantId" = $1 AND published = true
  ORDER BY "createdAt" DESC

  -- Órdenes de un usuario en este mes
  SELECT * FROM "Order"
  WHERE "userId" = $1
  AND "createdAt" >= now() - interval '1 month'
  ORDER BY "createdAt" DESC

  -- Reviews aprobados para un producto
  SELECT AVG(rating) as avg_rating, COUNT(*) as count
  FROM "Review"
  WHERE "productId" = $1 AND status = 'APPROVED'
  ```

- **Entregable**: Ejemplos de queries comunes

**4.9 - Onboarding Checklist**

- Crear `/docs/ONBOARDING.md` para nuevos desarrolladores:
  - [ ] Clonar repo
  - [ ] Instalar Node 18+
  - [ ] `npm install`
  - [ ] Crear `.env.local` (copiar `.env.example`)
  - [ ] Obtener credentials (database, OAuth, etc.)
  - [ ] `npm run dev`
  - [ ] Abrir localhost:3000
  - [ ] Leer `/docs/ARCHITECTURE.md`
  - [ ] Leer `/docs/DEVELOPMENT.md`
  - [ ] Crear primer feature en rama
  - [ ] Enviar PR
  - [ ] Celebrar! 🎉
- Tempo estimado: 2-3 horas
- **Entregable**: Onboarding checklist

**4.10 - Running Documentation**

- Crear `/docs/DECISIONS.md` - ADRs (Architecture Decision Records):
  - Por qué NextAuth en lugar de auth0
  - Por qué Prisma en lugar de TypeORM
  - Por qué Zustand en lugar de Redux
  - Por qué Tailwind en lugar de styled-components
  - Por qué PostgreSQL en lugar de MongoDB
- Incluir:
  - Contexto
  - Decisión
  - Razones
  - Alternativas consideradas
  - Tradeoffs
  - Consecuencias
- **Entregable**: 10+ ADRs documentados

**4.11 - README Actualizado**

- Mejorar `/README.md`:
  - Descripción del proyecto (1 párrafo)
  - Stack tech (tabla)
  - Quick start (5 comandos)
  - Project structure
  - Key features
  - Development (links a docs)
  - Deployment (links a docs)
  - Contributing
  - License
- Debe ser posible comenzar en 5 minutos
- **Entregable**: README.md profesional

**4.12 - Changelog y Version Management**

- Crear `/CHANGELOG.md` con versiones:

  ```markdown
  ## [0.1.0] - 2025-11-22

  ### Added

  - Sistema de autenticación con Google OAuth
  - Catálogo de productos
  - Carrito de compras
  - Checkout con Stripe
  - Dashboard para vendedores

  ### Fixed

  - TypeScript errors en search-engine.ts
  - Database migration timeout

  ### Security

  - Aislamiento multi-tenant implementado
  - Rate limiting en APIs críticas
  - RBAC validado

  ### Changed

  - Mejorado performance en búsqueda
  - Rediseño de checkout UI
  ```

- Usar semantic versioning: MAJOR.MINOR.PATCH
- **Entregable**: CHANGELOG.md actualizado

### Entregables de la Semana 4

- ✅ `/docs/ARCHITECTURE.md` (2000+ palabras)
- ✅ `/docs/API.md` (30+ endpoints documentados)
- ✅ `/docs/DATABASE.md` (schema completamente documentado)
- ✅ `/docs/SECURITY.md` (seguridad completa)
- ✅ `/docs/DEPLOYMENT.md` (deployment guide)
- ✅ `/docs/TROUBLESHOOTING.md`
- ✅ `/docs/DEVELOPMENT.md`
- ✅ `/docs/DECISIONS.md` (10+ ADRs)
- ✅ `/docs/ONBOARDING.md`
- ✅ `/README.md` mejorado
- ✅ `/CHANGELOG.md` actualizado

### Métricas de Éxito (Semana 4)

- ✅ Toda la documentación en `/docs` carpeta
- ✅ README legible en <5 min para nuevos devs
- ✅ API completamente documentada
- ✅ Database schema explicado
- ✅ Decisiones de arquitectura justificadas
- ✅ Onboarding checklist completado
- ✅ 0 puntos negros en conocimiento del proyecto

---

# RESUMEN FASE 1 (Semanas 1-4)

## Objetivos Cumplidos

✅ Código limpio y validado (0 Type errors)
✅ Seguridad garantizada (RBAC, validación, isolation)
✅ Testing establecido (80%+ coverage)
✅ CI/CD automatizado (GitHub Actions)
✅ Documentación completa

## Estado del Proyecto

- Build: ✅ Limpio, sin errores
- Tests: ✅ 80+ tests pasando (unit, integration, E2E)
- Security: ✅ Auditado y documentado
- Documentation: ✅ Completo
- Performance: ✅ Baseline establecido (Lighthouse >80)

## Métricas Finales Fase 1

- TypeScript errors: 663 → **0** ✅
- Test coverage: 0% → **>80%** ✅
- Documentadas: 0 → **15+ docs** ✅
- Security issues: 663 → **0** ✅
- CI/CD automation: 0% → **100%** ✅

## Próximo: Semana 5 - Transformación UX/UI

---

# SEMANAS 5-8: TRANSFORMACIÓN UX/UI

## SEMANA 5: REDISEÑO DE HOME Y LANDING

### Objetivo Específico

Crear homepage profesional y moderna que convierta visitantes en clientes, con design tokens y componentes reutilizables.

### Tareas Detalladas

**5.1 - Design System y Tokens**

- Crear `/lib/constants/design-tokens.ts`:

  ```typescript
  export const COLORS = {
    primary: "#3B82F6", // Blue
    secondary: "#8B5CF6", // Purple
    success: "#10B981", // Green
    danger: "#EF4444", // Red
    warning: "#F59E0B", // Amber
    neutral: "#6B7280", // Gray
    backgrounds: {
      light: "#F9FAFB",
      dark: "#111827",
    },
  } as const;

  export const SPACING = {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  } as const;

  export const TYPOGRAPHY = {
    h1: { size: "48px", weight: 700, lineHeight: "1.2" },
    h2: { size: "36px", weight: 600, lineHeight: "1.3" },
    h3: { size: "28px", weight: 600, lineHeight: "1.4" },
    body: { size: "16px", weight: 400, lineHeight: "1.6" },
    small: { size: "14px", weight: 400, lineHeight: "1.5" },
  } as const;

  export const SHADOWS = {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px rgba(0,0,0,0.1)",
    lg: "0 10px 15px rgba(0,0,0,0.1)",
    xl: "0 20px 25px rgba(0,0,0,0.1)",
  } as const;
  ```

- Configurar Tailwind config `/tailwind.config.js` con estos tokens
- **Entregable**: Design tokens documentados

**5.2 - Homepage Hero Section**

- Componente `/app/components/home/HeroSection.tsx`:
  - Background: gradient o hero image
  - CTA principal: "Crear mi tienda" button
  - Valor propuesta: 3 bullet points
  - Video o demo (opcional)
  - Responsivo (mobile-first)
- Contenido:
  ```
  Título: "Tu tienda online en minutos"
  Subtitle: "No necesitas conocimiento técnico. Crea tu tienda, vende online."
  CTA: "Comenzar Gratis" (link a signup)
  ```
- Usar hero image de Unsplash de ecommerce
- **Entregable**: Hero section con CTA clara

**5.3 - Features Section**

- Componente `/components/home/FeaturesSection.tsx`:
  - Grid 3x2 de features
  - Ícono + título + descripción por feature
  - Features:
    1. "Fácil de usar" - No code required
    2. "100% Seguro" - PCI DSS compliant
    3. "Pagos integrados" - Stripe & Mercado Pago
    4. "Analytics" - Vendas en tiempo real
    5. "SEO optimizado" - Google ranking
    6. "Soporte 24/7" - Email y chat
  - Iconos de Lucide React
  - Hover effects: shadow, scale
- **Entregable**: Features grid responsivo

**5.4 - Pricing Section**

- Componente `/components/home/PricingSection.tsx`:
  - 3 planes: Starter, Professional, Enterprise
  - Por plan:
    - Nombre
    - Precio mensual
    - Features list (checkmarks/x)
    - CTA button
  - Highlight: Professional es "Most Popular"
  - Comparativa tabla en mobile

  ```
  Starter: $9/mes
  - 100 productos
  - 1 usuario
  - Email support

  Professional: $29/mes ⭐
  - Productos ilimitados
  - 5 usuarios
  - Priority support
  - Análisis avanzado

  Enterprise: Custom
  - Todo incluido
  - API access
  - Onboarding dedicado
  ```

- **Entregable**: Pricing section con 3 planes

**5.5 - Testimonials Section**

- Componente `/components/home/TestimonialsSection.tsx`:
  - Carousel de testimonios (usando shadcn carousel)
  - Por testimonio:
    - Nombre y foto de cliente
    - "Tienda": ej "Electrónica García"
    - Quote: 1-2 frases sobre experiencia
    - Rating: 5 estrellas
  - 5 testimonios preparados (reales o compuestos)
  - Auto-rotate cada 5s
  - Botones manual prev/next
- **Entregable**: Testimonials carousel

**5.6 - FAQ Section**

- Componente `/components/home/FAQSection.tsx`:
  - Accordion con 10 preguntas frecuentes
  - Preguntas:
    1. ¿Qué es Tienda Online?
    2. ¿Necesito conocimiento técnico?
    3. ¿Cuánto cuesta?
    4. ¿Puedo cambiar de plan?
    5. ¿Qué métodos de pago soportan?
    6. ¿Cómo obtengo mis ganancias?
    7. ¿Hay comisión por transacción?
    8. ¿Puedo usar mi dominio personalizado?
    9. ¿Qué pasa si cancelo?
    10. ¿Dónde obtengo soporte?
  - Usar `@radix-ui/react-accordion`
- **Entregable**: FAQ accordion funcional

**5.7 - Call-to-Action Section**

- Componente `/components/home/CTASection.tsx`:
  - Sección antes del footer
  - Título: "¿Listo para crecer?"
  - Subtitle: "Miles de vendedores ya usan Tienda Online"
  - 2 buttons:
    - "Crear Tienda Gratis" (primary)
    - "Ver Demo" (secondary)
  - Background: gradient
- **Entregable**: CTA section con llamado a acción

**5.8 - Footer Professional**

- Componente `/components/layout/Footer.tsx`:
  - 4 columnas:
    - Empresa: About, Blog, Contact
    - Producto: Pricing, Features, Security
    - Legal: Terms, Privacy, Cookie Policy
    - Social: Twitter, Facebook, Instagram
  - Subscripción a newsletter (email input)
  - Copyright y año actual
- **Entregable**: Footer completo y responsivo

**5.9 - Navigation Bar Mejorada**

- Componente `/components/layout/Navbar.tsx`:
  - Logo izquierda (click → home)
  - Menu items: Features, Pricing, Blog (center, desktop)
  - Auth buttons derecha: Login | Signup
  - Mobile: hamburger menu
  - Sticky o scroll-on-demand (sticky si es posible)
  - Active state para current page
- **Entregable**: Navbar sticky con menu responsive

**5.10 - Página de Pricing Completa**

- Crear `/app/pricing/page.tsx`:
  - Reutilizar PricingSection
  - Agregar comparison table detallada
  - Agregar FAQ específica de pricing
  - "Contáctanos" para Enterprise
- **Entregable**: Página de pricing completa

**5.11 - Página de Features Detallada**

- Crear `/app/features/page.tsx`:
  - Hero: "Todo lo que necesitas"
  - Reutilizar FeaturesSection
  - Para cada feature, mostrar:
    - Descrición expandida (200 palabras)
    - Screenshot o demo gif
    - Use cases
  - CTA al final
- **Entregable**: Página de features detallada

**5.12 - SEO y Meta Tags**

- Implementar meta tags en `/app/layout.tsx`:
  ```typescript
  export const metadata: Metadata = {
    title: "Tienda Online - Tu plataforma e-commerce SaaS",
    description: "Crea tu tienda online profesional sin conocimiento técnico...",
    keywords: ["ecommerce", "tienda online", "venta online", "saas"],
    openGraph: {
      title: "Tienda Online",
      description: "...",
      url: "https://tienda-online.com",
      siteName: "Tienda Online",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Tienda Online",
      description: "...",
      creator: "@TiendaOnlineApp",
      images: ["/og-image.png"],
    },
  };
  ```
- Crear sitemap.xml dinámico
- Crear robots.txt
- **Entregable**: SEO meta tags completos

### Entregables de la Semana 5

- ✅ Design tokens en `/lib/constants/design-tokens.ts`
- ✅ Homepage con 7 secciones (hero, features, pricing, etc.)
- ✅ Navbar sticky y responsivo
- ✅ Footer profesional
- ✅ Páginas: /pricing, /features
- ✅ SEO meta tags en home

### Métricas de Éxito (Semana 5)

- ✅ Homepage Lighthouse >85
- ✅ FCP <1s, LCP <2s
- ✅ CLS <0.1
- ✅ Responsive en mobile, tablet, desktop
- ✅ Navegación intuitiva
- ✅ CTA clara y accesible

---

## SEMANA 6: SHOP Y CATÁLOGO PÚBLICO

### Objetivo Específico

Crear experiencia de compra pública: búsqueda, filtros, producto detallado, carrito visible.

### Tareas Detalladas

**6.1 - Página de Shop (/shop)**

- Crear `/app/shop/page.tsx`:
  - Grid de productos: 3 columnas (desktop), 2 (tablet), 1 (mobile)
  - Sidebar izquierda con filtros:
    - Categorías (checkboxes)
    - Rango de precio (range slider)
    - Rating (stars 5-1)
    - Disponibilidad (en stock sí/no)
  - Top bar con:
    - Contador total de resultados
    - Dropdown de ordenamiento: Relevancia, Precio (asc/desc), Rating, Nuevo
    - Botón de vista: grid/list
  - Paginación: números + prev/next
  - Lazy load imágenes
- **Entregable**: Shop page completamente funcional

**6.2 - Componente ProductCard**

- Crear `/components/shop/ProductCard.tsx`:
  - Imagen del producto (hover: ampliar)
  - Nombre truncado (max 2 líneas)
  - Rating (estrellas) + cantidad de reviews
  - Precio normal y con descuento (si aplica)
  - Badge: "EN DESCUENTO" si salePrice existe
  - Badge: "NUEVO" si createdAt < 7 días
  - Badge: "AGOTADO" si stock = 0
  - Botón "Agregar al Carrito" (con loading state)
  - Hover effect: shadow, scale ligero
  - Accesible: alt text en imagen, aria labels
- **Entregable**: ProductCard reutilizable

**6.3 - Página de Detalle Producto (/producto/[slug])**

- Crear `/app/(shop)/producto/[slug]/page.tsx`:
  - Galería de imágenes:
    - Imagen principal grande
    - Thumbnails horizontal debajo
    - Thumbnails swipeable en mobile
    - Zoom en hover (desktop)
  - Información:
    - Nombre
    - Rating + review count + link "Ver reviews"
    - Categoría (link a filtrada)
    - SKU (si es necesario mostrar)
    - Precio normal y descuento (con % de ahorro)
    - Disponibilidad: "X en stock" o "AGOTADO"
    - Descripción completa
    - Especificaciones (si aplica): tabla o bullet points
  - Acciones:
    - Cantidad: spinner +/- (min 1, max stock)
    - "Agregar al Carrito" (deshabilitado si agotado)
    - "Compartir en redes" (Twitter, WhatsApp)
    - "Agregar a favoritos" (requiere login, guardado en BD)
  - Reviews:
    - Top 5 reviews más útiles
    - Link "Ver todos los reviews"
    - Form "Dejar un review" (requiere compra anterior)
  - Productos relacionados:
    - 4 productos de la misma categoría
    - Carrusel swipeable
- **Entregable**: Producto detail page completo

**6.4 - Sistema de Reviews**

- Crear `/components/shop/ReviewsSection.tsx`:
  - Resumen: Rating promedio, total de reviews
  - Distribution: gráfico de barras (5 ⭐: 60%, 4 ⭐: 25%, etc.)
  - Filtros: solo 5 estrellas, solo negativas, etc.
  - Listado de reviews:
    - Autor, fecha, rating (estrellas)
    - Título y contenido
    - "Útil?" contador
    - Respuesta del vendedor (si existe)
  - Formulario para agregar review (auth required):
    - Rating: star selector
    - Título y descripción
    - Upload de fotos (máximo 3)
    - Submit button
- **Entregable**: Reviews system completo

**6.5 - Búsqueda Avanzada**

- Crear `/components/shop/SearchBar.tsx`:
  - Input text con autocomplete
  - Suggestions en dropdown:
    - Productos sugeridos (con imagen pequeña)
    - Categorías sugeridas
    - Trending searches
  - Búsqueda por Enter key
  - Clear button si hay texto
- Crear `/app/search` page con resultados
- Integración con search engine en `/lib/search/engine.ts`
- **Entregable**: Search con autocomplete

**6.6 - Wishlist / Favoritos**

- Crear `/components/shop/WishlistButton.tsx`:
  - Botón corazón (outline no favorito, filled favorito)
  - Click sin login: redirect a login
  - Click con login: agregar/remover de favoritos
  - Guardado en BD (tabla Wishlist)
  - Animación al agregar
- Crear `/app/wishlist/page.tsx`:
  - Grid de productos en favoritos del usuario
  - Botón para quitar de favoritos
  - "Sin favoritos aún" si está vacío
  - Link "Seguir comprando"
- **Entregable**: Wishlist completamente funcional

**6.7 - Carrito Visual**

- Crear `/components/layout/CartSummary.tsx`:
  - Botón en navbar: carrito icon + contador de items
  - Click: abre drawer/modal con resumen:
    - Listar items del carrito
    - Por item: imagen, nombre, cantidad, precio
    - Botones: cantidad +/-, remover item
    - Subtotal, impuestos estimados, total
    - "Ver carrito completo" link
    - "Proceder al pago" button
    - "Continuar comprando" link
- Usar Zustand para state global del carrito
- Persistir en localStorage
- Actualizar contador en navbar
- **Entregable**: Cart drawer en navbar

**6.8 - Filtros Dinámicos**

- Crear `/components/shop/Filters.tsx`:
  - Categorías: cargar desde DB
  - Rango de precio: slider de 0 a max price
  - Rating: seleccionar mín. rating
  - Stock: checkbox "solo disponibles"
  - Aplicar filtros: URL query params
  - Limpiar filtros: button
  - Mobile: collapsible panel
- Integración con search engine
- **Entregable**: Filtros completamente funcionales

**6.9 - Ordenamiento**

- Crear selector de ordenamiento:
  - Relevancia (default)
  - Precio: menor a mayor
  - Precio: mayor a menor
  - Más nuevo primero
  - Mejor valorado
  - Más vendido (si hay data)
- Integración con search engine
- URL query param `sort`
- **Entregable**: Ordenamiento funcional

**6.10 - Paginación Optimizada**

- Crear `/components/shop/Pagination.tsx`:
  - Números de páginas (mostrar 5 alrededor del actual)
  - Botones prev/next
  - Input para ir a página
  - "Mostrando X-Y de Z" resultado
  - URL query param `page`
- Cargar siguiente página en background (prefetch)
- **Entregable**: Paginación con prefetch

**6.11 - Loading y Error States**

- Crear skeleton loaders para:
  - Grid de productos: 6 placeholders
  - Detalle producto: imagen, texto placeholders
  - Filtros: categoría placeholder
- Error states:
  - "No hay productos" si búsqueda vacía
  - "Error al cargar" si API falla con retry button
  - 404 si producto no existe
- **Entregable**: Loading y error UI completa

**6.12 - Analytics Integration**

- Integrar Google Analytics 4:
  - Track pageviews
  - Track product views
  - Track add to cart
  - Track search queries
  - Track filter usage
- Crear `/lib/analytics/events.ts`:
  ```typescript
  export function trackProductView(productId: string) {
    gtag.event("view_item", { items: [{ item_id: productId }] });
  }
  ```
- Dashboard en Google Analytics
- **Entregable**: Analytics tracking implementado

### Entregables de la Semana 6

- ✅ `/app/shop/page.tsx` con filtros y grid
- ✅ `/app/producto/[slug]/page.tsx` completo
- ✅ `/app/search/page.tsx` con resultados
- ✅ `/app/wishlist/page.tsx` para logged users
- ✅ Componentes: ProductCard, ReviewsSection, Filters, CartSummary
- ✅ Google Analytics 4 integrado

### Métricas de Éxito (Semana 6)

- ✅ Shop page carga <2s
- ✅ Búsqueda autocomplete <200ms
- ✅ Filtros aplicar instantáneamente
- ✅ Responsive en all devices
- ✅ Accessibilidad: A11y AA
- ✅ Analytics tracking funcionando

---

## SEMANA 7: CARRITO Y CHECKOUT

### Objetivo Específico

Crear flujo de compra fluido y seguro: carrito persistente, checkout wizard, integración de pagos.

### Tareas Detalladas

**7.1 - Carrito Completo (/cart)**

- Crear `/app/cart/page.tsx`:
  - Tabla de items:
    - Imagen, nombre, precio unitario, cantidad, subtotal
    - Botones: +/-, remover, guardar para después
  - Resumen derecha:
    - Subtotal
    - Impuestos (calculado automático)
    - Envío (seleccionar opción)
    - Cupón: input + validar
    - Total prominente
    - "Proceder al Pago" button
    - "Continuar Comprando" link
  - Sugerencias: "Productos que otros compraron"
  - Cross-sell: productos relacionados
- Zustand store para cart state
- localStorage persistence
- **Entregable**: Carrito page completo

**7.2 - Checkout Wizard (4 pasos)**

- Crear `/app/checkout/page.tsx` con 4 steps:
  1. **Shipping Address**: Formulario de dirección
  2. **Shipping Method**: Opciones y costo
  3. **Payment Method**: Stripe card input
  4. **Review & Confirm**: Resumen + botón pagar

- Step 1 - Shipping Address:
  - Campos: Nombre, teléfono, dirección completa, ciudad, región, código postal
  - Validar con Zod
  - Guardar en BD (Address model)
  - Autocompletar si logged user
  - Checkbox "Usar como dirección de facturación"
  - Siguiente button habilita step 2

- Step 2 - Shipping Method:
  - Cargar opciones desde BD (ShippingZone)
  - Mostrar por región/código postal
  - Radio buttons:
    - Standard: $0-5, 5-7 días
    - Express: $10-15, 2-3 días
    - Overnight: $25-50, next day
  - Cálculo dinámico de costo
  - Actualizar total del carrito
  - Siguiente activa step 3

- Step 3 - Payment Method:
  - Stripe Elements (card input)
  - Mostrar total final
  - Checkbox: Guardar tarjeta para futuro
  - Botón "Pagar $X.XX"
  - Loading durante procesamiento
  - Error display si rechaza

- Step 4 - Review & Confirm:
  - Resumen read-only de:
    - Items (imagen, nombre, cantidad, precio)
    - Dirección de envío
    - Método de envío seleccionado
    - Forma de pago (últimos 4 dígitos)
  - Total final
  - Botón "Confirmar Compra"
  - Nota: "Al confirmar aceptas términos y condiciones"

- Estado global Zustand para wizard
- Progreso visual (4 de 4 pasos)
- Botón back para ir al paso anterior
- **Entregable**: Checkout wizard 4 steps completo

**7.3 - Stripe Integration**

- Crear `/lib/payments/stripe.ts`:

  ```typescript
  import Stripe from "stripe";

  export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
  });

  export async function createPaymentIntent(amount: number, currency: string) {
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // centavos
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }
  ```

- Crear `/app/api/payments/create-intent` endpoint
- Frontend: usar @stripe/react-stripe-js
- Validar amount en backend
- **Entregable**: Stripe integration funciona

**7.4 - Orden Creation**

- Crear API `/app/api/orders/create`:

  ```typescript
  // POST /api/orders
  // Body: { cartItems, shippingAddress, shippingMethod, paymentMethodId }
  // Respuesta: { orderId, clientSecret }

  async function createOrder(req: NextRequest) {
    const session = await requireAuth();
    const { cartItems, shippingAddress, shippingMethod, paymentIntentId } =
      await validateOrderSchema.parse(await req.json());

    // Transacción BD
    const order = await db.$transaction(async (tx) => {
      // 1. Crear Order
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          tenantId: shippingAddress.tenantId,
          status: "PENDING",
          subtotal: calculateSubtotal(cartItems),
          tax: calculateTax(cartItems, shippingAddress),
          shippingCost: shippingMethod.cost,
          total: calculateTotal(subtotal, tax, shipping),
          shippingAddress: { create: shippingAddress },
          items: { createMany: { data: cartItems } },
        },
      });

      // 2. Reduce stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. Linkear payment intent
      await tx.paymentIntent.create({
        data: {
          orderId: order.id,
          stripeId: paymentIntentId,
          amount: order.total,
          status: "PROCESSING",
        },
      });

      return order;
    });

    return { orderId: order.id };
  }
  ```

- Validar stock antes de crear
- Transacción atómica: all or nothing
- **Entregable**: Order creation API

**7.5 - Payment Processing Webhook**

- Crear `/app/api/webhooks/stripe`:

  ```typescript
  // POST /api/webhooks/stripe
  // Stripe envía eventos (payment_intent.succeeded, etc.)

  export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      return new NextResponse("Webhook signature verification failed", { status: 400 });
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // Actualizar orden a status PAID
        await db.order.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: "PAID" },
        });
        // Enviar email de confirmación
        await sendOrderConfirmationEmail(order);
        break;

      case "payment_intent.payment_failed":
        // Actualizar a FAILED, restaurar stock
        break;
    }

    return new NextResponse("OK", { status: 200 });
  }
  ```

- Configurar webhook URL en Stripe dashboard
- Escuchar eventos: succeeded, failed, canceled
- Manejar idempotencia (webhook puede reintentarse)
- **Entregable**: Webhook procesando eventos

**7.6 - Tax Calculation**

- Crear `/lib/payments/tax.ts`:

  ```typescript
  const TAX_RATE = 0.16; // 16% IVA para México

  export function calculateTax(items: CartItem[], address: Address): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    // Simplificado: 16% a todo
    // En producción: validar si address requiere tax, aplicar rates por region
    return Math.round(subtotal * TAX_RATE * 100) / 100;
  }
  ```

- Mostrar desglose en checkout
- **Entregable**: Tax calculation implementado

**7.7 - Cupones y Descuentos**

- Crear `/lib/payments/coupons.ts`:

  ```typescript
  export async function applyCoupon(code: string, cartTotal: number) {
    const coupon = await db.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      throw new ValidationError("Cupón inválido");
    }

    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      throw new ValidationError(`Mínimo de compra: $${coupon.minPurchase}`);
    }

    const discount =
      coupon.discountType === "PERCENT"
        ? (cartTotal * coupon.discountValue) / 100
        : coupon.discountValue;

    return { discount, coupon };
  }
  ```

- API `/api/coupons/validate`
- Validar en checkout
- Mostrar descuento en total
- **Entregable**: Coupons system funciona

**7.8 - Order Confirmation Email**

- Crear `/lib/email/order-confirmation.tsx` con React Email:

  ```typescript
  import { Html, Body, Head, Container, Text, Link, Button, Img, Row, Column } from '@react-email/components'

  export default function OrderConfirmationEmail({ order }: { order: Order }) {
    return (
      <Html>
        <Head />
        <Body style={baseStyles}>
          <Container>
            <Img src={`${process.env.NEXTAUTH_URL}/logo.png`} width={200} />

            <Text fontSize={24} fontWeight={700}>
              ¡Gracias por tu compra!
            </Text>

            <Text>
              Tu orden <strong>#{order.id}</strong> ha sido confirmada.
            </Text>

            {/* Items table */}
            <table>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
              {order.items.map(item => (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price}</td>
                  <td>${item.quantity * item.price}</td>
                </tr>
              ))}
            </table>

            <Text fontSize={18} fontWeight={700}>
              Total: ${order.total}
            </Text>

            <Text>Dirección de envío: {order.shippingAddress}</Text>

            <Button href={`${process.env.NEXTAUTH_URL}/orders/${order.id}`}>
              Ver tu orden
            </Button>

            <Text>
              Contacta a soporte: support@tiendaonline.com
            </Text>
          </Container>
        </Body>
      </Html>
    )
  }
  ```

- Usar Resend para enviar
- **Entregable**: Email template y envío

**7.9 - Order Status Page (/orders/[id])**

- Crear `/app/(auth)/orders/[id]/page.tsx`:
  - Header: "Orden #ABC123"
  - Status badge: "Procesando", "Enviado", "Entregado"
  - Timeline: Order placed → Paid → Shipped → Delivered
  - Items: tabla de productos
  - Totales: subtotal, tax, shipping, total
  - Dirección de envío
  - Tracking: link a carrier (si aplica)
  - Acciones: "Descargar factura", "Contactar soporte", "Reportar problema"
- Solo accessible si usuario es dueño de orden
- **Entregable**: Order detail page

**7.10 - Error Handling en Checkout**

- Validar:
  - Stock disponible
  - Dirección válida
  - Payment method válido
  - Amount matches
- Mostrar errores amigables:
  - "La tarjeta fue rechazada. Por favor intenta otra."
  - "Uno de los productos ya no está disponible"
  - "El envío a esa región no está disponible"
- Recuperar del error: permitir corregir y reintentar
- **Entregable**: Error handling robusto

**7.11 - Guest Checkout**

- Permitir checkout sin cuenta
- Datos: email, dirección, tarjeta
- Crear orden con userId=null pero email registrado
- Enviar tracking por email
- Link temporal para ver orden sin login
- **Entregable**: Guest checkout funciona

**7.12 - Seguridad PCI**

- NO almacenar números de tarjeta
- Usar Stripe Elements para card input
- Todos los pagos a través de Stripe API
- Rate limiting en checkout (máximo 5 intentos/15 min)
- HTTPS solo (enforced by Vercel)
- Documentar en compliance
- **Entregable**: PCI compliance verificado

### Entregables de la Semana 7

- ✅ `/app/cart/page.tsx` con carrito completo
- ✅ `/app/checkout/page.tsx` con 4 steps
- ✅ `/app/api/payments/create-intent` endpoint
- ✅ `/app/api/orders` create endpoint con transacción
- ✅ `/app/api/webhooks/stripe` procesando eventos
- ✅ `/app/(auth)/orders/[id]/page.tsx` detail
- ✅ Email de confirmación enviado
- ✅ Cupones funcionales

### Métricas de Éxito (Semana 7)

- ✅ Checkout completa en <5 min
- ✅ Stripe integration pasando tests
- ✅ Payment success rate >99%
- ✅ Email enviado siempre
- ✅ Order creada incluso si email falla
- ✅ PCI compliance verificado
- ✅ Error handling robusto

---

## SEMANA 8: VALIDACIÓN Y PULIDO

### Objetivo Específico

End-to-end testing, optimización de performance, bug fixes, preparación para MVP público.

### Tareas Detalladas

**8.1 - End-to-End Testing Completo**

- Crear suite de Playwright tests:

  ```typescript
  // tests/e2e/complete-purchase-flow.spec.ts
  test("complete purchase flow", async ({ page }) => {
    // 1. Home y browse
    await page.goto("/");
    await page.click('button:has-text("Crear Tienda")');

    // 2. Signup
    await page.fill('input[name="email"]', "buyer@test.com");
    await page.fill('input[name="password"]', "Password123");
    await page.click('button:has-text("Registrarse")');
    await page.waitForURL("/dashboard");

    // 3. Shop
    await page.click('a:has-text("Shop")');
    await page.fill('input[placeholder="Buscar"]', "laptop");
    await page.press('input[placeholder="Buscar"]', "Enter");

    // 4. Add to cart
    await page.click('button:has-text("Agregar al Carrito")');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText("1");

    // 5. Checkout
    await page.click('a:has-text("Ver Carrito")');
    await page.click('button:has-text("Proceder al Pago")');

    // 6. Fill shipping
    await page.fill('input[name="street"]', "Calle 123");
    await page.fill('input[name="city"]', "Mexico");
    await page.click('button:has-text("Siguiente")');

    // 7. Select shipping method
    await page.click('radio[value="express"]');
    await page.click('button:has-text("Siguiente")');

    // 8. Payment (usar test card)
    await page
      .frameLocator('iframe[title*="card"]')
      .locator('input[placeholder="Card number"]')
      .fill("4242424242424242");
    await page.click('button:has-text("Pagar")');

    // 9. Confirmation
    await page.waitForURL(/\/orders\//);
    await expect(page).toHaveTitle(/Orden/);
  });
  ```

- Mínimo 5 E2E tests:
  1. Complete purchase flow
  2. Login y compra
  3. Multiple items en carrito
  4. Cupón aplicado
  5. Guest checkout
- Ejecutar en staging antes de production
- **Entregable**: 5+ E2E tests pasando

**8.2 - Performance Optimization**

- Image optimization:
  - Usar `next/image` en todos los product images
  - Servir WebP con fallback
  - Lazy load images debajo del fold
  - Responsive srcsets: mobile/tablet/desktop
- Code splitting:
  - Dynamic imports para componentes grandes
  - Route-level code splitting (Next.js automático)
  - Verificar bundle size: `npm run build` → .next/static
- Caching:
  - Redis para catálogo (TTL 1 hora)
  - HTTP caching headers (Cache-Control)
  - Browser caching (1 año para assets)
- Database queries:
  - Verificar no hay N+1 queries
  - Usar Select apropiado (no traer campos innecesarios)
  - Crear índices para queries lentas
- Ejecutar Lighthouse:
  - Performance: >90
  - Accessibility: >95
  - Best Practices: >90
  - SEO: >90
- **Entregable**: Lighthouse scores >90 en todas las métricas

**8.3 - Bug Bounty / QA Testing**

- Crear test plan comprensivo:

  ```markdown
  # QA Test Plan - MVP Semana 8

  ## Smoke Tests (críticos)

  - [ ] Home carga sin errores
  - [ ] Signup funciona
  - [ ] Login funciona
  - [ ] Shop carga productos
  - [ ] Producto detail muestra info
  - [ ] Carrito suma correctamente
  - [ ] Checkout se puede completar
  - [ ] Orden se crea
  - [ ] Email se envía

  ## Functionality Tests

  - [ ] Filtros funcionan correctamente
  - [ ] Búsqueda es precisa
  - [ ] Ordenamiento correcto
  - [ ] Paginación navega bien
  - [ ] Wishlist agrega/remueve
  - [ ] Cupones aplican descuento
  - [ ] Cálculo de tax correcto
  - [ ] Envío seleccionable

  ## Security Tests

  - [ ] No puedo acceder /admin sin permisos
  - [ ] No veo datos de otro tenant
  - [ ] CSRF protegido
  - [ ] Rate limit funciona
  - [ ] XSS intentos se bloquean

  ## Compatibility Tests

  - [ ] Chrome latest
  - [ ] Firefox latest
  - [ ] Safari latest
  - [ ] Edge latest
  - [ ] Mobile (iPhone, Android)
  - [ ] Tablet

  ## Performance Tests

  - [ ] Home <1.5s FCP
  - [ ] Shop <2s LCP
  - [ ] Checkout responsive
  - [ ] Búsqueda autocomplete <200ms
  ```

- Ejecutar manualmente o con testing tool
- Documentar bugs encontrados en GitHub issues
- Priorizar: Critical → High → Medium → Low
- **Entregable**: Test plan completado, bugs documentados

**8.4 - Mobile Responsiveness Check**

- Verificar en:
  - iPhone SE (375px)
  - iPhone 12 (390px)
  - Pixel 4 (412px)
  - iPad (768px)
  - iPad Pro (1024px)
- Checklist:
  - Texto legible sin zoom
  - Botones clickeables (>44px)
  - Imágenes se escalan
  - Formularios usables
  - Modales/drawers adaptan
  - Menú mobile hamburger
  - Keyboard navigation funciona
- **Entregable**: Mobile testing completado

**8.5 - Accessibility Audit (WCAG AA)**

- Usar axe DevTools Chrome extension
- Verificar:
  - Color contrast >4.5:1 para texto
  - Headings (h1 > h2 > h3) en order
  - Images tienen alt text
  - Links tienen text descriptivo (no "click here")
  - Form labels linked a inputs
  - Buttons accesibles por keyboard
  - Focus visible
  - ARIA roles apropiados
- Herramienta: Wave WebAIM, Lighthouse accessibility audit
- Fix issues, retest
- **Entregable**: WCAG AA compliance verificado

**8.6 - SEO Final Check**

- Verificar:
  - Title tags: <60 chars, keyword presente
  - Meta descriptions: <160 chars
  - H1 por página: 1 solo
  - Image alt texts: descriptivos
  - Internal links: text relevante
  - sitemap.xml: generado y válido
  - robots.txt: permite crawling
  - Open Graph tags: para social sharing
  - Schema.org JSON-LD: product, organization, breadcrumb
- Herramienta: Google Search Console, Lighthouse
- **Entregable**: SEO checklist completado

**8.7 - Deployment Checklist**

- [ ] Todos los tests pasando
- [ ] Build sin warnings
- [ ] Lighthouse >90 en 3 página clave
- [ ] No hay console errors
- [ ] Secrets NOT en código
- [ ] .env.example actualizado
- [ ] Database backups configurados
- [ ] Error tracking (Sentry) habilitado
- [ ] Analytics (GA4) funcionando
- [ ] Email (Resend) en production
- [ ] Stripe en production (no test keys)
- [ ] HTTPS certificado válido
- [ ] DNS apuntando correctamente
- [ ] Rate limiting activo
- [ ] Monitoring alertas configuradas
- **Entregable**: Deployment checklist completado

**8.8 - Monitoring y Alerting**

- Configurar Sentry (error tracking):

  ```typescript
  // app/layout.tsx
  import * as Sentry from "@sentry/nextjs";

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
  ```

- Configurar alertas:
  - Error rate >5% → alert
  - Response time >5s → alert
  - Disk space >80% → alert
  - Database errors → alert
- Dashboard de monitoreo
- **Entregable**: Monitoring habilitado con alertas

**8.9 - Documentation Final**

- Actualizar:
  - `/docs/API.md` - con endpoints finales
  - `/docs/DEPLOYMENT.md` - pasos exactos para deploy
  - `/docs/TROUBLESHOOTING.md` - problemas encontrados en QA
  - `/CHANGELOG.md` - cambios de la semana
  - `/README.md` - estado final
- Crear `/docs/KNOWN-ISSUES.md`:

  ```markdown
  # Problemas Conocidos

  ## Sem 8

  - Safari <14: CSS grid tiene issues (workaround: usar flex)
  - Teléfono: pago Stripe falla en algunos navegadores (usar modal)
  - Envío: no disponible a Puerto Rico (documented)
  ```

- **Entregable**: Documentación actualizada

**8.10 - Backup y Disaster Recovery**

- Configurar:
  - Database backups diarios (Neon auto)
  - Upload backups a S3 (automation)
  - Test restore: puedo restaurar una backup?
  - RTO (Recovery Time Objective): <1 hora
  - RPO (Recovery Point Objective): <1 día
- Documentar proceso de recovery
- **Entregable**: Disaster recovery plan

**8.11 - Launch Preparation**

- Crear launch checklist:
  - [ ] Marketing assets listos (hero image, copy)
  - [ ] Social media posts prepared (Twitter, LinkedIn, Facebook)
  - [ ] Press release redactado
  - [ ] Team training completado
  - [ ] Support team listo para preguntas
  - [ ] FAQ actualizado
  - [ ] Términos y Condiciones
  - [ ] Política de Privacidad
  - [ ] Contacto de soporte visible
- Coordinar lanzamiento para mañana temprano (peak traffic)
- **Entregable**: Launch plan documentado

**8.12 - Post-Launch Monitoring (24hrs)**

- Monitorear 24 horas:
  - Error rate (debe ser <1%)
  - Response times (debe ser <2s)
  - User signups
  - Transaction volume
  - Payment success rate
  - Email delivery rate
- Daily report
- Quick fix hotline: si hay issues críticos
- **Entregable**: 24hr monitoring completado

### Entregables de la Semana 8

- ✅ 5+ E2E tests pasando
- ✅ Lighthouse scores >90 todas las métricas
- ✅ QA test plan completado, bugs reportados
- ✅ Accessibility WCAG AA verificado
- ✅ SEO checklist completado
- ✅ Deployment checklist completado
- ✅ Sentry monitoring activo
- ✅ Backup y DR plan documentado
- ✅ Launch plan listo

### Métricas de Éxito (Semana 8)

- ✅ 0 critical bugs reportados
- ✅ Lighthouse: 90+ todas las métricas
- ✅ Core Web Vitals: good
- ✅ WCAG AA compliant
- ✅ Todos tests pasando (E2E, unit, integration)
- ✅ <2s average response time
- ✅ 99.9% availability ready
- ✅ MVP listo para launch

---

# RESUMEN FASE 2 (Semanas 5-8)

## Objetivos Cumplidos

✅ Homepage profesional y convertidor
✅ Shop público completamente funcional
✅ Carrito y checkout fluido
✅ Pagos con Stripe integrados
✅ Órdenes creadas y confirmadas

## Resultados Clave

- Website Lighthouse >90 en todas métricas
- Conversión funnel: Home → Shop → Cart → Checkout
- Payment success rate >99%
- User experience fluida y moderna
- Mobile-first responsive design

## Próximo: Semana 9 - Catálogo Profesional (Admin)

---

# SEMANAS 9-12: CATÁLOGO PROFESIONAL

[Continuará en siguiente sección...]

# SEMANAS 13-20: PAGOS, ÓRDENES Y LOGÍSTICA

[Continuará según el mismo patrón de detalle...]

# SEMANAS 21-56: ADMIN, ANALYTICS, PERFORMANCE, MARKETING, ESCALABILIDAD

[Continuará según el mismo patrón de detalle...]

---

## NOTA IMPORTANTE

Debido a limitaciones de tokens, este documento continúa con las secciones de Semanas 9-12, 13-20, y 21-56 utilizando el mismo nivel de detalle que Semanas 1-8.

El documento está estructurado para que el Arquitecto de IA pueda:

1. Leer fase por fase
2. Ejecutar tareas semana por semana
3. Entregar features en sprints de 1 semana
4. Mantener calidad y documentación
5. Coordinar con equipo

---

# ESTRUCTURA COMPLETA 56 SEMANAS

```
FASE 1: AUDITORÍA Y FUNDAMENTOS (Semanas 1-4)
├─ Semana 1: Auditoría de código y seguridad ✅
├─ Semana 2: Fixes de código y seguridad ✅
├─ Semana 3: Testing y CI/CD ✅
└─ Semana 4: Documentación ✅

FASE 2: TRANSFORMACIÓN UX/UI (Semanas 5-8)
├─ Semana 5: Homepage y Landing ✅
├─ Semana 6: Shop y Catálogo Público ✅
├─ Semana 7: Carrito y Checkout ✅
└─ Semana 8: Validación y Pulido ✅

FASE 3: CATÁLOGO PROFESIONAL (Semanas 9-12)
├─ Semana 9: Admin Dashboard Setup
├─ Semana 10: CRUD de Productos
├─ Semana 11: Búsqueda Avanzada
└─ Semana 12: Analytics e Inventario

FASE 4: PAGOS, ÓRDENES Y LOGÍSTICA (Semanas 13-20)
├─ Semana 13: Stripe Pro Features
├─ Semana 14: Mercado Pago Integration
├─ Semana 15: Gestión de Órdenes
├─ Semana 16: Integración con Couriers
├─ Semana 17: Reembolsos y Devoluciones
├─ Semana 18: Notificaciones y Emails
├─ Semana 19: Dashboard Operacional
└─ Semana 20: Testing E2E Flujos

FASE 5: ADMIN Y ANALÍTICA (Semanas 21-28)
├─ Semana 21-24: Admin Dashboard Avanzado
└─ Semana 25-28: Reportes y Analytics

FASE 6: RENDIMIENTO, SEO Y PWA (Semanas 29-36)
├─ Semana 29-32: Performance Optimization
└─ Semana 33-36: SEO, A11y, PWA

FASE 7: MARKETING Y AUTOMATIZACIÓN (Semanas 37-44)
├─ Semana 37-40: Email Marketing
└─ Semana 41-44: Automaciones

FASE 8: ESCALABILIDAD E INFRAESTRUCTURA (Semanas 45-52)
├─ Semana 45-48: Infrastructure
└─ Semana 49-52: Security & Observability

FASE 9: DOCUMENTACIÓN FINAL (Semanas 53-56)
├─ Semana 53-54: Knowledge Transfer
└─ Semana 55-56: Roadmap 2.0
```

---

## CÓMO USAR ESTE DOCUMENTO

**Para el Arquitecto de IA:**

1. **Lee la fase completa** antes de empezar (contexto)
2. **Ejecuta una semana a la vez** (1 semana = máximo productividad)
3. **Sigue el orden exacto** de tareas (hay dependencias)
4. **Entrega al final de cada semana**:
   - Código funcional en main branch
   - Tests pasando
   - Documentación actualizada
   - Changelog con cambios

5. **Cada tarea es independiente pero relacionada**:
   - Puedes hacer tareas en paralelo si no hay dependencia
   - Si bloqueas en una tarea, anota el bloqueador

6. **Métricas de éxito al final de cada semana**:
   - ¿Todos los entregables están listos?
   - ¿Los tests pasan?
   - ¿Se puede mergear a main sin issues?

---

## PRÓXIMAS SEMANAS (Resumen Ejecutivo)

**Semana 9-12: Catálogo Profesional**

- Admin dashboard funcional
- CRUD completo de productos
- Búsqueda avanzada (full-text)
- Analytics de inventario

**Semana 13-20: Pagos y Logística**

- Stripe y Mercado Pago avanzados
- Gestión de órdenes (estados, tracking)
- Integración con couriers
- Sistema de reembolsos

**Semana 21-28: Admin y Reportes**

- Dashboard avanzado para gerentes
- Reportes y exportación de datos
- Análisis de vendas
- Predicciones básicas

**Semana 29-36: Performance y SEO**

- Optimización de imágenes
- Minificación de assets
- Full-text search en BD
- SEO completamente optimizado
- PWA (offline access)

**Semana 37-44: Marketing**

- Email marketing automático
- Newsletter
- Automaciones de carrito abandonado
- Programa de referrals

**Semana 45-52: Infraestructura**

- Caché distribuido (Redis Cluster)
- Database replication
- Load balancing
- Disaster recovery

**Semana 53-56: Documentación**

- Handoff completo a equipo
- Roadmap 2.0 definido
- Formación completada

---

## CONTACTO Y ESCALONAMIENTO

**Si hay bloqueos:**

1. Documentar en GitHub issue
2. Marcar como blokeador
3. Escalar a PM/Tech Lead
4. No esperar más de 24 horas

**Si descubres deuda técnica:**

1. Documentar en `/docs/TECHNICAL-DEBT.md`
2. Crear issue en backlog
3. Continuar con tareas planeadas
4. Revisar en refinamiento semanal

**Cambios de scope:**

1. Documentar en CHANGELOG.md
2. Actualizar plan de siguiente semana
3. Informar a stakeholders
4. No cambiar tareas en ejecución

---

# FIN DEL DOCUMENTO SEMANAS 1-8

El documento continúa con el mismo nivel de detalle para Semanas 9-56.
Cada semana sigue la estructura:

- Objetivo Específico (1 párrafo)
- 12 Tareas Detalladas
- Entregables de la Semana
- Métricas de Éxito
- Dependencias Previas

**Versión completa con todas las 56 semanas disponible en:**
`/docs/PLAN-ARQUITECTO-56-SEMANAS-COMPLETO.md` (generado posteriormente)

**Resumen ejecutivo disponible en:**
`/docs/PLAN-ARQUITECTO-56-SEMANAS-SUMMARY.md`

---

**Documento Preparado para:** Arquitecto de IA
**Confidencialidad:** Interna
**Licencia:** Proyecto Tienda Online 2025
