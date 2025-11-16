# 🚀 SPRINT 0: CONFIGURACIÓN Y CIMIENTOS - CHECKLIST EJECUTABLE

**Fecha:** 15 de Noviembre, 2025
**Propósito:** Configurar el repositorio, proyecto Next.js, base de datos y herramientas necesarias para que Arquitecto A y B comiencen en paralelo
**Estimado:** 2-3 horas de trabajo secuencial
**Status:** 🟢 LISTO PARA COMENZAR

---

## 📋 TAREA 0.1: CONFIGURACIÓN DE REPOSITORIO (Conjunta - 20 min)

### Paso 1: Crear repositorio en GitHub
```bash
# En GitHub.com:
1. Click "New Repository"
2. Repository name: "tienda-online-2025"
3. Description: "Multi-tenant e-commerce SaaS platform with banking-level security"
4. Visibility: Private
5. Initialize with: README
6. .gitignore: Node
7. License: MIT
8. Click "Create Repository"

# Copiar URL: https://github.com/YOUR_USERNAME/tienda-online-2025.git
```

### Paso 2: Clonar repositorio localmente
```bash
# En tu máquina:
git clone https://github.com/YOUR_USERNAME/tienda-online-2025.git
cd tienda-online-2025
```

### Paso 3: Configurar rama main como protegida
```bash
# En GitHub Settings → Branches:
1. Branch protection rules → Add rule
2. Pattern: main
3. ✅ Require pull request reviews before merging
4. ✅ Dismiss stale pull request approvals when new commits are pushed
5. ✅ Include administrators
6. ✅ Require status checks to pass
7. Save
```

### Paso 4: Crear rama de desarrollo
```bash
git checkout -b develop
git push -u origin develop

# Establecer develop como rama por defecto (temporal, para desarrollo)
# GitHub Settings → Default branch → develop
```

---

## 🏗️ TAREA 0.2: INICIALIZACIÓN DE NEXT.JS (Arquitecto A + B Conjunta - 15 min)

### Paso 1: Crear proyecto Next.js 14+ con TypeScript
```bash
# En la raíz del repositorio clonado:
npx create-next-app@latest . --typescript --app --no-tailwind --no-git

# Seleccionar (cuando pregunte):
? Would you like to use TypeScript? › (Y/n) → YES
? Would you like to use ESLint? › (Y/n) → YES
? Would you like to use Tailwind CSS? › (Y/n) → NO (lo instalamos por separado)
? Would you like to use `src/` directory? › (Y/n) → YES
? Would you like to use App Router? › (Y/n) → YES
? Would you like to customize the import alias? › (Y/n) → NO (usaremos defaults)
? Would you like to use Turbopack for next dev? › (Y/n) → NO
? Would you like to enable Incremental Static Regeneration (ISR) with next export? › (Y/n) → NO
```

### Paso 2: Instalar dependencias principales
```bash
# Base de datos y ORM
npm install -D prisma @prisma/client

# Autenticación
npm install next-auth@beta @auth/prisma-adapter

# Validación
npm install zod

# UI y Styling
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npx shadcn-ui@latest init

# Payments
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

### Paso 3: Crear archivo .env.local
```bash
# .env.local (NUNCA commitear este archivo)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/tienda_online?schema=public"

NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

GOOGLE_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_SECRET=YOUR_GOOGLE_CLIENT_SECRET

STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY

RESEND_API_KEY=re_YOUR_KEY

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paso 4: Crear .gitignore actualizado
```bash
# .gitignore
.env.local
.env.*.local
node_modules/
.next/
dist/
build/
.vercel/
*.log
.DS_Store
.idea/
.vscode/
prisma/dev.db
```

### Paso 5: Configurar TypeScript
```bash
# tsconfig.json - Verificar que tenga:
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## 🗄️ TAREA 0.3: BASE DE DATOS EN NEON (Arquitecto A - 20 min)

### Paso 1: Crear proyecto en Neon
```bash
# En neon.tech:
1. Sign up / Login
2. Create new project
3. Name: tienda-online-2025
4. Region: US East (o más cercano a ti)
5. Postgres version: 15 (o latest)
6. Click "Create project"
```

### Paso 2: Obtener DATABASE_URL
```bash
# En Neon Dashboard:
1. Click tu proyecto
2. Click "Connection string"
3. Copy "Password required"
4. Reemplazar en .env.local:
   DATABASE_URL="postgresql://neon_user:PASSWORD@NEON_HOST/tienda_online?schema=public"
```

### Paso 3: Crear carpeta prisma/ y schema.prisma inicial
```bash
# Crear archivo prisma/schema.prisma:
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modelos iniciales (completos en ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md)
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  password      String?
  role          UserRole  @default(CUSTOMER)
  tenantId      String?
  tenant        Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)
  accounts      Account[]
  sessions      Session[]
  orders        Order[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([tenantId])
  @@index([email])
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?
  user               User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id        String   @id @default(cuid())
  sessionToken String @unique
  userId    String
  expires   DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Tenant {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  domain        String?   @unique
  logo          String?
  primaryColor  String    @default("#0A1128")
  accentColor   String    @default("#D4AF37")
  featureFlags  Json      @default("{}")
  users         User[]
  products      Product[]
  categories    Category[]
  orders        Order[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([slug])
  @@index([domain])
}

model Category {
  id          String    @id @default(cuid())
  tenantId    String
  name        String
  slug        String
  description String?
  image       String?
  parent      Category? @relation("CategoryParent", fields: [parentId], references: [id])
  parentId    String?
  children    Category[] @relation("CategoryParent")
  products    Product[]
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([parentId])
}

model Product {
  id                    String    @id @default(cuid())
  tenantId              String
  categoryId            String
  name                  String
  slug                  String
  description           String    @db.Text
  shortDescription      String?
  sku                   String
  basePrice             Decimal   @db.Decimal(10, 2)
  salePrice             Decimal?  @db.Decimal(10, 2)
  stock                 Int       @default(0)
  published             Boolean   @default(false)
  featured              Boolean   @default(false)
  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category              Category  @relation(fields: [categoryId], references: [id])
  variants              ProductVariant[]
  images                ProductImage[]
  orderItems            OrderItem[]
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([tenantId, sku])
  @@index([tenantId])
  @@index([categoryId])
}

model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  name      String
  sku       String
  price     Decimal @db.Decimal(10, 2)
  stock     Int
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, sku])
  @@index([productId])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String
  alt       String?
  sort      Int     @default(0)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model Order {
  id                String    @id @default(cuid())
  tenantId          String
  userId            String
  status            OrderStatus @default(PENDING)
  subtotal          Decimal   @db.Decimal(10, 2)
  tax               Decimal   @db.Decimal(10, 2)
  shipping          Decimal   @db.Decimal(10, 2)
  total             Decimal   @db.Decimal(10, 2)
  paymentMethod     PaymentMethod?
  paymentId         String?
  paymentStatus     PaymentStatus @default(PENDING)
  notes             String?
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  user              User      @relation(fields: [userId], references: [id])
  items             OrderItem[]
  shippingAddress   Address?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([tenantId])
  @@index([userId])
  @@index([status])
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  priceAtPurchase Decimal @db.Decimal(10, 2)
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model Address {
  id        String  @id @default(cuid())
  orderId   String  @unique
  firstName String
  lastName  String
  email     String
  phone     String
  street    String
  city      String
  state     String
  postalCode String
  country   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
}

enum UserRole {
  SUPER_ADMIN
  STORE_OWNER
  CUSTOMER
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  PAYPAL
  STRIPE
  MERCADO_PAGO
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

### Paso 4: Ejecutar primera migración
```bash
npx prisma migrate dev --name init

# Esto:
# 1. Crea schema.prisma si no existe
# 2. Ejecuta migración en BD Neon
# 3. Genera Prisma Client
# 4. Crea carpeta prisma/migrations/
```

### Paso 5: Verificar conexión
```bash
npx prisma studio

# Se abre interfaz web en http://localhost:5555
# Verifica que las tablas fueron creadas correctamente
# Cierra con Ctrl+C
```

---

## 🎨 TAREA 0.4: CONFIGURACIÓN DE TAILWIND Y SHADCN/UI (Arquitecto B - 15 min)

### Paso 1: Inicializar Tailwind
```bash
npx tailwindcss init -p

# Editar tailwind.config.ts:
```

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A1128',
        accent: '#D4AF37',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

### Paso 2: Crear archivo globals.css
```bash
# src/app/globals.css
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #0A1128;
  --accent: #D4AF37;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Source Sans Pro',
    sans-serif;
}
```

### Paso 3: Configurar shadcn/ui
```bash
npx shadcn-ui@latest init

# Seleccionar:
? Which style would you like to use? › New York
? Which color would you like as base color? › Slate
? Would you like to use CSS variables for colors? › yes
```

### Paso 4: Agregar componentes base de shadcn/ui
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add navigation-menu
```

---

## 📁 TAREA 0.5: ESTRUCTURA DE CARPETAS (Arquitecto B - 10 min)

### Crear estructura de directorios
```bash
# Desde raíz del proyecto:

# Carpetas principales
mkdir -p src/app/{(auth),(dashboard),(store),api}
mkdir -p src/components/{ui,shared,features}
mkdir -p src/lib/{auth,db,security,payments,shipping,email}
mkdir -p src/styles
mkdir -p src/types
mkdir -p src/config
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p public/{images,documents}

# Crear archivo de índice en cada carpeta importante
touch src/lib/auth/index.ts
touch src/lib/db/index.ts
touch src/lib/security/index.ts
touch src/config/env.ts
```

### Crear carpeta auth routes (protegidas)
```bash
mkdir -p src/app/\(auth\)/{login,signup,forgot-password,reset-password}
touch src/app/\(auth\)/layout.tsx
touch src/app/\(auth\)/login/page.tsx
touch src/app/\(auth\)/signup/page.tsx
```

### Crear carpeta dashboard (admin)
```bash
mkdir -p src/app/\(dashboard\)/[tenantId]/{products,orders,analytics,settings}
touch src/app/\(dashboard\)/layout.tsx
touch src/app/\(dashboard\)/\[tenantId\]/layout.tsx
```

### Crear carpeta store (públicas)
```bash
mkdir -p src/app/\(store\)/{cart,checkout,search,\[category\]/\[product\]}
touch src/app/\(store\)/layout.tsx
```

---

## ✅ TAREA 0.6: VALIDACIÓN Y TEST (Conjunta - 10 min)

### Paso 1: Verificar instalación
```bash
npm run dev

# Debe mostrar:
# ▲ Next.js 14.0.0
# - Local:        http://localhost:3000
#
# ✓ Ready in 3.2s
```

### Paso 2: Acceder a aplicación
```bash
# En navegador:
# http://localhost:3000
#
# Debe mostrar página de bienvenida de Next.js
```

### Paso 3: Validar Prisma
```bash
npx prisma generate
npx prisma validate

# Debe mostrar: ✓ Validated Prisma schema
```

### Paso 4: Validar TypeScript
```bash
npm run build

# Debe completar sin errores de compilación
```

### Paso 5: Crear archivo de status
```bash
# Create SPRINT-0-COMPLETED.txt
echo "✅ Sprint 0 Configuración completada exitosamente
Fecha: $(date)
Servidor: http://localhost:3000
Base de datos: Neon PostgreSQL
Framew: Next.js 14+
ORM: Prisma" > SPRINT-0-COMPLETED.txt
```

---

## 🎯 CHECKLIST FINAL

```
Sprint 0 Completado: ___________

☐ Repositorio creado en GitHub
☐ Rama main protegida
☐ Rama develop creada
☐ Proyecto Next.js inicializado
☐ TypeScript configurado
☐ Dependencias principales instaladas
☐ .env.local creado (NO commiteado)
☐ Base de datos Neon creada
☐ DATABASE_URL en .env.local
☐ Prisma schema.prisma creado
☐ Primera migración ejecutada
☐ Prisma Studio verificado
☐ Tailwind CSS configurado
☐ shadcn/ui inicializado
☐ Componentes base instalados
☐ Estructura de carpetas creada
☐ npm run dev funciona
☐ http://localhost:3000 accesible
☐ npm run build exitoso (sin errores)
☐ SPRINT-0-COMPLETED.txt creado

TOTAL: ___/22 items
Status: LISTO PARA SPRINT 1
```

---

## 📝 PRÓXIMOS PASOS (Sprint 1)

Una vez completado Sprint 0, comenzar Sprint 1 en paralelo:

- **Arquitecto A (Backend):**
  - Implementar NextAuth.js con Google OAuth
  - Crear DAL (Data Access Layer) en `src/lib/db/`
  - Crear rutas API: `/api/auth/`, `/api/products/`, `/api/orders/`

- **Arquitecto B (Frontend):**
  - Crear login/signup pages
  - Crear dashboard layout
  - Crear páginas públicas de tienda (catalog, product detail)
  - Integrar components UI

---

**Generado:** 15 de Noviembre, 2025
**Para:** Arquitectos 1 y 2 - Proyecto Tienda Online 2025
**Status:** 🟢 LISTO PARA EJECUCIÓN

