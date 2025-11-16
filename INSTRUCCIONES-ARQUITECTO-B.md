# 📋 INSTRUCCIONES PARA ARQUITECTO B - Frontend y UX

**Fecha**: 15 de Noviembre, 2025
**Responsabilidad**: Frontend, UI/UX, Componentes, Experiencia del usuario
**Rama de trabajo**: `feature/frontend-arquitecto-b`
**Duración Sprint 0**: 2-3 horas (después que Arquitecto A termine)

---

## 🎯 OBJETIVO INMEDIATO

**Espera** a que **Arquitecto A termine SPRINT 0**, luego completa tu parte de Sprint 0 (Tailwind + shadcn/ui).

Después, construirá la interfaz de usuario para que los usuarios autenticados tengan UX profesional.

---

## 📚 PASO 1: LEER TODA LA DOCUMENTACIÓN (1 hora)

**OBLIGATORIO** - Sin excepciones. La documentación contiene patrones y pautas de diseño.

### Lectura obligatoria (en este orden):

1. **README-PROYECTO-TIENDA-ONLINE.md** (20 min)
   - Entiende la visión general
   - Revisa el stack tecnológico
   - Lee la sección de "Notas para Arquitecto B"

2. **Proyecto de Diseño Tienda digital.md** (30 min) ⭐ **IMPORTANTE PARA TI**
   - Sección 1: Identidad de marca (Logo, Colores, Tipografía)
   - Sección 2: Estructura del sitio y páginas clave
   - Sección 3: Diseño para móviles (Responsive Design)
   - Esto es tu **guía de diseño visual**

3. **ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md** (30 min)
   - Sección 1: Stack Tecnológico (entiende frontend)
   - Sección 4: Estructura de carpetas (CRÍTICO para ti)
   - Sección 6-9: NextAuth.js, APIs - entiende contratos
   - Sección 12: Testing Strategy (para E2E tests)

4. **DIVISION-TRABAJO-PARALELO.md** (15 min)
   - Sección "ARQUITECTO B: Frontend y UX"
   - Sección "Puntos de Integración" (API Contracts)
   - Sección "Git Workflow"
   - Sección "Tecnologías por Arquitecto"

5. **SPRINT-0-SETUP-CHECKLIST.md** (10 min)
   - Lee TAREA 0.4 (Tailwind + shadcn/ui)

6. **CLAUDE.md** (10 min)
   - Contexto rápido del proyecto

**Después de leer**: ✅ Confirma que entiendes:
- Los 3 roles de usuarios (SUPER_ADMIN, STORE_OWNER, CUSTOMER)
- Las páginas principales que debes crear
- Los API contracts (Autenticación, Productos, Órdenes)
- El diseño responsive mobile-first
- La paleta de colores (Azul #0A1128, Dorado #D4AF37)

---

## 🚀 PASO 2: ESPERAR A ARQUITECTO A (⏰ ~2-3 horas)

**📌 NO HAGAS NADA TODAVÍA**

Espera a que Arquitecto A:
1. Clone el repositorio
2. Cree el proyecto Next.js
3. Configure Prisma y BD
4. Haga el primer push a `feature/backend-arquitecto-a`
5. Te avise: "Sprint 0 Backend completado ✅"

Entonces tú empiezas.

---

## 🎨 PASO 3: COMPLETAR SPRINT 0 - TU PARTE (1-2 horas)

### PASO 3.1: Clonar repositorio y checkout a tu rama

```bash
# 1. Clonar el repositorio
git clone https://github.com/SACRINT/SACRINT_Tienda_OnLine.git
cd SACRINT_Tienda_OnLine

# 2. Checkout a tu rama (NO a develop, NO a main)
git checkout feature/frontend-arquitecto-b

# 3. Traer cambios de Arquitecto A
git pull origin feature/backend-arquitecto-a
```

En este punto, el proyecto Next.js ya debe estar creado por Arquitecto A.

### PASO 3.2: Instalar dependencias adicionales para Frontend

```bash
# Ya están instaladas por Arquitecto A, pero verifica
npm install

# Si hay errores, instala manualmente:
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
npm install zustand
npm install @tanstack/react-query
```

### PASO 3.3: Configurar Tailwind CSS

Arquiteco A ya creó `tailwind.config.ts` básico. Actualízalo con tu paleta de colores:

```typescript
// tailwind.config.ts
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
        primary: {
          DEFAULT: '#0A1128', // Azul Marino
          light: '#1a2a4a',
          dark: '#050812',
        },
        accent: {
          DEFAULT: '#D4AF37', // Dorado
          light: '#e8c547',
          dark: '#a68828',
        },
        neutral: {
          light: '#F8F8F8',
          DEFAULT: '#FFFFFF',
          dark: '#333333',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'], // Títulos
        body: ['Open Sans', 'sans-serif'],   // Cuerpo
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

### PASO 3.4: Configurar shadcn/ui

```bash
# Inicializar shadcn/ui
npx shadcn-ui@latest init

# Seleccionar:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Instalar componentes base necesarios
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add label
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add modal
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add image
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
```

### PASO 3.5: Crear archivo globals.css

Arquictecto A ya creó uno básico. Actualízalo:

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #0A1128;
  --accent: #D4AF37;
  --neutral-light: #F8F8F8;
  --neutral-dark: #333333;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Open Sans', sans-serif;
  color: var(--neutral-dark);
  background-color: #FFFFFF;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
}

a {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: var(--accent);
}

/* Accesibilidad */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### PASO 3.6: Crear Layout Principal

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tienda Online 2025 - E-commerce SaaS',
  description: 'Plataforma multi-tenant de e-commerce con seguridad de nivel bancario',
  keywords: 'ecommerce, tienda online, shopping, productos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="min-h-screen flex flex-col bg-white">
          {/* Header irá aquí */}
          <main className="flex-grow">
            {children}
          </main>
          {/* Footer irá aquí */}
        </div>
      </body>
    </html>
  )
}
```

### PASO 3.7: Crear página HOME básica

```typescript
// src/app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Bienvenido a Tienda Online 2025
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Plataforma e-commerce SaaS multi-tenant con seguridad de nivel bancario
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border-2 border-primary rounded-lg">
            <h2 className="text-2xl font-bold text-primary mb-3">Seguridad</h2>
            <p className="text-gray-600">Protección de nivel bancario con PCI DSS compliance</p>
          </div>
          <div className="p-6 bg-white border-2 border-accent rounded-lg">
            <h2 className="text-2xl font-bold text-accent mb-3">Escalable</h2>
            <p className="text-gray-600">Arquitectura multi-tenant completamente aislada</p>
          </div>
          <div className="p-6 bg-white border-2 border-primary rounded-lg">
            <h2 className="text-2xl font-bold text-primary mb-3">Moderno</h2>
            <p className="text-gray-600">Construido con Next.js 14, React 18 y TypeScript</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### PASO 3.8: Validación

```bash
# Verificar que compila sin errores
npm run build

# Iniciar dev server
npm run dev

# Acceder a http://localhost:3000
# Debe mostrar la página HOME sin errores
```

---

## 📤 PASO 4: PRIMER COMMIT Y PUSH (10 min)

```bash
# 1. Asegúrate estar en tu rama
git checkout feature/frontend-arquitecto-b

# 2. Ver cambios
git status

# 3. Agregar archivos
git add .

# 4. Commit
git commit -m "feat(frontend): Configure Tailwind CSS, shadcn/ui, and basic layout

- Setup Tailwind with custom color palette (primary #0A1128, accent #D4AF37)
- Initialize shadcn/ui with base components
- Configure typography (Montserrat, Open Sans)
- Create root layout with responsive structure
- Create home page landing
- Configure globals.css with design system
- Verify build and dev server

Sprint 0 Frontend configuration complete"

# 5. Push a tu rama
git push -u origin feature/frontend-arquitecto-b

# 6. Verificar en GitHub
# https://github.com/SACRINT/SACRINT_Tienda_OnLine
```

---

## 🔗 PASO 5: SINCRONIZAR CON ARQUITECTO A

Ambas ramas ahora tienen Sprint 0 completo:
- ✅ `feature/backend-arquitecto-a` - Backend + BD + APIs skeleton
- ✅ `feature/frontend-arquitecto-b` - Frontend + UI base

**Próximo paso**: Director del Proyecto mergeará ambas ramas a `develop`.

---

## 🚀 PASO 6: PRÓXIMOS PASOS - SPRINT 1

Cuando Sprint 0 esté completamente Done:

### Semana 1-2: Crear Login/Signup UI

Mientras Arquitecto A implementa NextAuth.js backend, tú crearás:

1. **Página de Login** (`src/app/(auth)/login/page.tsx`)
   - Formulario con email/password
   - Botón "Sign in with Google"
   - Link a signup
   - Validación frontend con React Hook Form + Zod

2. **Página de Signup** (`src/app/(auth)/signup/page.tsx`)
   - Formulario de registro
   - Crear tienda (tenant)
   - Términos de servicio
   - Validación frontend

3. **Componentes de Auth**
   - `LoginForm.tsx` - Formulario reutilizable
   - `SignupForm.tsx` - Formulario reutilizable
   - `AuthLayout.tsx` - Layout protegido

4. **Hooks personalizados**
   - `useAuth.ts` - Obtener usuario actual
   - `useLogin.ts` - Ejecutar login
   - `useSignup.ts` - Ejecutar signup

### Consumir APIs del Arquitecto A:

Cuando Arquitecto A haya hecho:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/tenants

Tú conectarás el frontend.

---

## ✅ CHECKLIST SPRINT 0 - ARQUITECTO B

```
PREPARACIÓN (mientras Arquitecto A trabaja):
□ Leer toda la documentación (1 hora)
□ Entender guía de diseño
□ Entender API contracts

EJECUCIÓN (después que Arquitecto A termine):
□ Clonar repositorio
□ Checkout a feature/frontend-arquitecto-b
□ Traer cambios de Arquitecto A (git pull)

TAILWIND + SHADCN/UI:
□ Instalar dependencias frontend
□ Actualizar tailwind.config.ts con paleta de colores
□ Inicializar shadcn/ui
□ Instalar componentes base (button, input, card, form, etc)

ESTILOS Y LAYOUT:
□ Crear/actualizar globals.css con design system
□ Crear layout.tsx principal
□ Crear página home.tsx básica
□ Importar fuentes (Montserrat, Open Sans)

VALIDACIÓN:
□ npm run build sin errores
□ npm run dev arranca
□ http://localhost:3000 carga correctamente
□ Colores y tipografía visible en home

GIT:
□ git checkout feature/frontend-arquitecto-b
□ git add .
□ git commit
□ git push origin feature/frontend-arquitecto-b
□ Verificar en GitHub

COMPLETADO: Sprint 0 ✅
```

---

## 🎓 RECURSOS IMPORTANTES

**Documentación en el proyecto**:
- `Proyecto de Diseño Tienda digital.md` - **Tu biblia de diseño** 📌
- `ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md` - Especificaciones técnicas
- `DIVISION-TRABAJO-PARALELO.md` - Cómo coordinar con Arquitecto A
- `CLAUDE.md` - Contexto rápido

**External links**:
- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- React Hook Form: https://react-hook-form.com
- Zod: https://zod.dev

---

## 🎨 PALETA DE COLORES FINAL

```
Primario (Dominante):
- Color: Azul Marino Profundo
- Hex: #0A1128
- Uso: Headers, títulos, buttons principales, border emphasis

Acento (Highlight):
- Color: Dorado Suave
- Hex: #D4AF37
- Uso: Buttons secundarios, hover states, decorative accents, CTAs

Neutro - Claro (Base):
- Color: Blanco Puro
- Hex: #FFFFFF
- Uso: Fondos principales, cards, espacios en blanco

Neutro - Gris Claro:
- Color: Gris muy claro
- Hex: #F8F8F8
- Uso: Fondos secundarios, separadores sutiles

Texto:
- Color: Gris Oscuro
- Hex: #333333
- Uso: Body text, normal content
```

### Uso en Tailwind:

```css
text-primary      /* #0A1128 */
text-accent       /* #D4AF37 */
bg-white          /* #FFFFFF */
bg-neutral-light  /* #F8F8F8 */
text-neutral-dark /* #333333 */

border-primary
border-accent

hover:bg-primary
hover:text-accent
```

---

## 📱 RESPONSIVE DESIGN PRINCIPS

**Mobile-first approach**:
1. Diseña para móvil PRIMERO (pantalla pequeña)
2. Luego adapta para tablet
3. Finalmente enriquece para desktop

```
Breakpoints (Tailwind):
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

Ejemplo:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 columna móvil, 2 tablet, 3 desktop */}
</div>
```

---

## ⚠️ PUNTOS CRÍTICOS

1. **NUNCA commites .env.local** - Contiene secretos
2. **TypeScript strict mode** - No `any` types
3. **Accesibilidad WCAG AA** - ARIA labels, semantic HTML
4. **Performance** - Lazy load imágenes, optimize bundles
5. **Tests E2E** - Playwright para flows críticos
6. **Responsive design** - Mobile-first always
7. **Sigue guía de diseño** - Usa paleta de colores exactamente

---

## 💬 COMUNICACIÓN

**Diaria**:
- Standup 9am y 5pm con Arquitecto A
- Reportar blockers inmediatamente
- Sincronizar sobre API changes

**Semanal**:
- Code review viernes 4pm
- Retrospectiva de sprint

**Por Git**:
- Commits claros y descriptivos
- PRs a `develop` (NO a main)
- Mínimo 1 aprobación antes de mergear

---

## 🔔 ESPERA A ARQUITECTO A

**⏰ Duración de Sprint 0 (Arquitecto A)**: ~2-3 horas

Cuando recibas el mensaje: **"Sprint 0 Backend completado ✅"**

ENTONCES empiezas PASO 3.

---

**¡ESTÁ LISTO! Espera a que Arquitecto A termine Sprint 0, luego tú completarás tu parte.**

**Duración esperada (tu parte)**: 1-2 horas
**Entrega esperada**: Mismo día (después que A termine)

💪 ¡A por ello!
