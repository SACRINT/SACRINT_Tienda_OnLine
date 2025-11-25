# 📋 INSTRUCCIONES PARA ARQUITECTO A - Backend y Datos

**Fecha**: 15 de Noviembre, 2025
**Responsabilidad**: Backend, APIs, Base de datos, Seguridad
**Rama de trabajo**: `feature/backend-arquitecto-a`
**Duración Sprint 0**: 2-3 horas

---

## 🎯 OBJETIVO INMEDIATO

Completar **SPRINT 0** (Configuración y Cimientos) para que tanto tú como Arquitecto B tengáis un proyecto funcional desde el cual trabajar en paralelo.

---

## 📚 PASO 1: LEER TODA LA DOCUMENTACIÓN (1 hora)

**OBLIGATORIO** - Sin excepciones. La documentación contiene patrones de seguridad críticos.

### Lectura obligatoria (en este orden):

1. **README-PROYECTO-TIENDA-ONLINE.md** (20 min)
   - Entiende la visión general
   - Revisa el stack tecnológico
   - Lee "Quick Start en 10 pasos"

2. **ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md** (40 min)
   - Sección 1: Stack Tecnológico
   - Sección 2: Principios Fundamentales (CRÍTICO para seguridad)
   - Sección 3: Database Schema (COMPLETO - memoriza los modelos)
   - Sección 4: Estructura de carpetas
   - Sección 5: Sprint 0 - Configuración Exacta
   - Sección 6: Sprint 1 - Autenticación + Tenants

3. **SPRINT-0-SETUP-CHECKLIST.md** (20 min)
   - Lee TAREA 0.1 a 0.6
   - Entiende cada paso

4. **DIVISION-TRABAJO-PARALELO.md** (15 min)
   - Sección "ARQUITECTO A: Backend y Datos"
   - Sección "Puntos de Integración" (API Contracts)
   - Sección "Git Workflow"

5. **CLAUDE.md** (10 min)
   - Contexto rápido del proyecto

**Después de leer**: ✅ Confirma que entiendes:

- El Prisma schema con los 20+ modelos
- Los 3 roles (SUPER_ADMIN, STORE_OWNER, CUSTOMER)
- El concepto de Tenant Isolation
- Las 3 capas de seguridad (Zod validations, RBAC, CSP headers)

---

## 🚀 PASO 2: EJECUTAR SPRINT 0 (2-3 horas)

**Ubicación de trabajo**: Tu máquina local (NO GitHub todavía)

Sigue **EXACTAMENTE** los pasos en `SPRINT-0-SETUP-CHECKLIST.md`:

### TAREA 0.1: Configuración de Repositorio (20 min) - **SALTAR ESTE PASO**

```
❌ NO HAGAS ESTO - Ya fue hecho por Director del Proyecto
✅ El repo ya existe en GitHub
✅ Ya hay ramas creadas (main, develop, feature/backend-arquitecto-a)
```

### TAREA 0.2: Inicialización Next.js (15 min)

```bash
# 1. Clonar el repositorio
git clone https://github.com/SACRINT/SACRINT_Tienda_OnLine.git
cd SACRINT_Tienda_OnLine

# 2. Checkout a tu rama
git checkout feature/backend-arquitecto-a

# 3. Crear proyecto Next.js
# OJO: Estamos en la raíz del repositorio, no crear subcarpeta
npx create-next-app@latest . --typescript --app --no-tailwind --no-git

# Responder a las preguntas:
# Would you like to use TypeScript? → YES
# Would you like to use ESLint? → YES
# Would you like to use Tailwind CSS? → NO
# Would you like to use `src/` directory? → YES
# Would you like to use App Router? → YES
# Would you like to customize the import alias? → NO
# Would you like to use Turbopack? → NO
# Would you like to enable ISR? → NO
```

### TAREA 0.3: Instalar dependencias principales

```bash
# Base de datos y ORM
npm install -D prisma @prisma/client

# Autenticación
npm install next-auth@beta @auth/prisma-adapter

# Validación
npm install zod

# UI (Backend no necesita mucho, pero shadcn-ui es requerido para Arquitecto B)
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npx shadcn-ui@latest init --yes

# Pagos
npm install stripe

# Email
npm install resend

# State Management
npm install zustand
npm install @tanstack/react-query

# Otros
npm install dotenv-cli
npm install axios
```

### TAREA 0.4: Configurar variables de entorno

Crea archivo `.env.local` en raíz:

```bash
# .env.local (NUNCA commitear este archivo)

# Database (Crear en Neon primero - ver TAREA 0.5)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/tienda_online?schema=public"

# Auth.js
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Conseguir en Google Cloud Console)
GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# Stripe (Modo test por ahora)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY

# Resend (Opcional por ahora)
RESEND_API_KEY=re_YOUR_KEY

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

**⚠️ IMPORTANTE**: No commites este archivo. Git lo ignorará automáticamente.

### TAREA 0.5: Base de datos Neon (20 min)

```bash
# 1. Ir a https://neon.tech
# 2. Sign up / Login
# 3. Create new project
#    - Name: tienda-online-2025
#    - Region: US East (o más cercano)
#    - Postgres: 15 o latest
# 4. Copiar CONNECTION STRING en formato:
#    postgresql://neon_user:PASSWORD@neon_host/tienda_online?schema=public
# 5. Pegar en .env.local como DATABASE_URL

# 6. Crear archivo prisma/schema.prisma
mkdir -p prisma
```

Copiar el **Prisma schema COMPLETO** de `ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md` (Sección 3).

```bash
# 7. Ejecutar migración inicial
npx prisma migrate dev --name init

# 8. Verificar conexión
npx prisma studio
# Se abre en http://localhost:5555
# Verifica que las 20+ tablas fueron creadas correctamente
# Cierra con Ctrl+C
```

### TAREA 0.6: Configurar TypeScript y linting

```bash
# Verificar tsconfig.json tenga strict: true
# Debe estar configurado automáticamente por create-next-app

# Validar build
npm run build

# Validar tipos
npx tsc --noEmit

# Validar lint
npm run lint
```

### TAREA 0.7: Validar proyecto corriendo

```bash
npm run dev

# Debe abrir en http://localhost:3000
# Verifica que no hay errores en consola
```

---

## 📊 PASO 3: CREAR ESTRUCTURA DE CARPETAS (30 min)

Después que Next.js esté listo, crea esta estructura:

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── categories/route.ts
│   │   ├── cart/route.ts
│   │   ├── checkout/route.ts
│   │   ├── orders/route.ts
│   │   ├── coupons/route.ts
│   │   ├── users/route.ts
│   │   ├── tenants/route.ts
│   │   └── webhooks/
│   │       ├── stripe/route.ts
│   │       └── mercado-pago/route.ts
│   ├── middleware.ts
│   └── layout.tsx
│
├── lib/
│   ├── auth/
│   │   ├── auth.config.ts
│   │   ├── roles.ts
│   │   ├── middleware.ts
│   │   └── session.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   ├── tenant.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   └── seed.ts
│   │
│   ├── security/
│   │   ├── csp.ts
│   │   ├── rate-limit.ts
│   │   ├── validation.ts
│   │   ├── encryption.ts
│   │   └── sanitize.ts
│   │
│   ├── payments/
│   │   ├── stripe.ts
│   │   └── mercado-pago.ts
│   │
│   ├── email/
│   │   ├── client.ts
│   │   ├── templates/
│   │   │   ├── OrderConfirmation.tsx
│   │   │   ├── OrderShipped.tsx
│   │   │   └── WelcomeEmail.tsx
│   │   └── send.ts
│   │
│   ├── utils/
│   │   ├── format.ts
│   │   ├── currency.ts
│   │   ├── dates.ts
│   │   └── constants.ts
│   │
│   └── hooks/
│       └── (estos serán creados por Frontend, pero Backend puede crear utilidades)
│
├── prisma/
│   ├── schema.prisma (COPIAR DE ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md)
│   └── migrations/
│
└── tests/
    ├── unit/
    │   └── lib/validation.test.ts
    └── integration/
        └── api/products.test.ts
```

**Comando para crear estructura**:

```bash
# Crear carpetas
mkdir -p src/app/api/auth src/app/api/products src/app/api/categories
mkdir -p src/app/api/cart src/app/api/checkout src/app/api/orders
mkdir -p src/app/api/coupons src/app/api/users src/app/api/tenants
mkdir -p src/app/api/webhooks

mkdir -p src/lib/auth src/lib/db src/lib/security src/lib/payments
mkdir -p src/lib/email/templates src/lib/utils src/lib/hooks

mkdir -p tests/unit/lib tests/integration/api
```

---

## ✅ PASO 4: VALIDACIÓN DE SPRINT 0

Antes de commits, verifica:

```bash
# ✅ Proyecto compila sin errores
npm run build

# ✅ TypeScript strict mode OK
npx tsc --noEmit

# ✅ Base de datos conectada
npx prisma db push

# ✅ Dev server arranca
npm run dev
```

---

## 📤 PASO 5: PRIMER COMMIT Y PUSH (10 min)

```bash
# 1. Asegúrate estar en tu rama
git checkout feature/backend-arquitecto-a

# 2. Ver cambios
git status

# 3. Agregar archivos (EXCEPTO .env.local)
git add .
# Verificar que NO incluye .env.local
git status

# 4. Commit
git commit -m "feat(backend): Initialize Next.js 14, Prisma schema, and project structure

- Setup Next.js 14 with TypeScript
- Configure Prisma with PostgreSQL (Neon)
- Create complete database schema (20+ models)
- Setup folder structure for APIs and utilities
- Configure environment variables
- Install core dependencies

Sprint 0 configuration step 1-6 complete"

# 5. Push a tu rama (NO a main)
git push -u origin feature/backend-arquitecto-a

# 6. Verificar en GitHub
# https://github.com/SACRINT/SACRINT_Tienda_OnLine
```

---

## 🔗 PASO 6: COORDINAR CON ARQUITECTO B

Después que hagas push, avisa al Arquitecto B que puede empezar.

**Arquitecto B necesita**:

- ✅ El proyecto Next.js creado (YA lo haces)
- ✅ Las dependencias instaladas (YA lo haces)
- ✅ Tailwind + shadcn/ui configurado (YA lo hace Tarea 0.4)

---

## 🚨 CHECKLIST SPRINT 0 - ARQUITECTO A

```
TAREA 0.1: Configuración de repositorio
□ Ya existe, NO hacer nada

TAREA 0.2: Inicialización Next.js
□ Clonar repositorio
□ Checkout a feature/backend-arquitecto-a
□ Ejecutar create-next-app
□ Instalar dependencias principales
□ Verificar npm run dev funciona

TAREA 0.3: Configurar variables de entorno
□ Crear .env.local
□ Llenar todas las variables (algunos valores temporales OK por ahora)

TAREA 0.4: Base de datos Neon
□ Crear cuenta en Neon.tech
□ Crear proyecto
□ Obtener DATABASE_URL
□ Crear prisma/schema.prisma (COPIAR de ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md)
□ Ejecutar npx prisma migrate dev --name init
□ Verificar en Prisma Studio que todas las tablas existen

TAREA 0.5: TypeScript y Linting
□ Verificar tsconfig.json tiene strict: true
□ npm run build sin errores
□ npx tsc --noEmit sin errores
□ npm run lint sin warnings críticos

TAREA 0.6: Crear estructura de carpetas
□ Crear todas las carpetas en src/lib/ y src/app/api/
□ Estructura lista para próximos pasos

TAREA 0.7: Validación final
□ npm run dev arranca sin errores
□ Acceso a http://localhost:3000 OK
□ Prisma Studio accesible
□ Base de datos conectada

TAREA 0.8: Git - Primer commit
□ git checkout feature/backend-arquitecto-a
□ git add . (sin .env.local)
□ git commit
□ git push origin feature/backend-arquitecto-a
□ Verificar en GitHub

COMPLETADO: Sprint 0 ✅
```

---

## 📞 PRÓXIMOS PASOS (DESPUÉS DE SPRINT 0)

Después que Sprint 0 esté completo, tú (Arquitecto A) comenzarás:

### Sprint 1 - Semana 1:

1. **NextAuth.js Configuration** (sección 6 de ARQUITECTURA)
   - Configurar Google OAuth
   - Crear auth routes
   - JWT + Session management

2. **Tenant API** (CRÍTICO)
   - GET /api/tenants (traer tenant del usuario)
   - POST /api/tenants (crear nuevo tenant)

3. **Testing** con NextAuth

### Con Arquitecto B:

Él hará login/signup UI mientras tú haces backend.
Se conectan mediante los **API Contracts** en DIVISION-TRABAJO-PARALELO.md

---

## 🎓 RECURSOS IMPORTANTES

**Documentación en el proyecto**:

- `ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md` - Tu biblia técnica
- `DIVISION-TRABAJO-PARALELO.md` - Cómo coordinar con Arquitecto B
- `SPRINT-0-SETUP-CHECKLIST.md` - Pasos exactos
- `CLAUDE.md` - Contexto rápido

**External links**:

- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
- NextAuth.js: https://next-auth.js.org
- Stripe docs: https://stripe.com/docs

---

## ⚠️ PUNTOS CRÍTICOS

1. **NUNCA commitees .env.local** - Contiene secretos
2. **Sigue EXACTAMENTE el Prisma schema** - No improvises modelos
3. **Tenant isolation en TODA query** - No es opcional
4. **Validaciones Zod en TODOS los endpoints** - Backend + frontend
5. **TypeScript strict mode** - No `any` types
6. **Tests para código crítico** - Auth, payments, DB access

---

## 💬 COMUNICACIÓN

**Diaria**:

- Standup 9am y 5pm con Arquitecto B
- Reportar blockers inmediatamente
- Sincronizar API contracts

**Semanal**:

- Code review viernes 4pm
- Retrospectiva de sprint

**Por Git**:

- Commits claros y descriptivos
- PRs a `develop` (NO a main)
- Mínimo 1 aprobación antes de mergear

---

**¡LOS TIENES! Adelante con SPRINT 0. Cuando termines, avisa al Arquitecto B para que comience.**

**Duración esperada**: 2-3 horas
**Entrega esperada**: Hoy (antes de 5pm para que B comience)

💪 ¡A por ello!
