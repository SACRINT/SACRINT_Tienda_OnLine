# 🤖 INSTRUCCIONES PARA IA ARQUITECTO - EJECUCIÓN AUTOMÁTICA 24/7

**Para: IA Arquitecto en Terminal Web**
**Proyecto**: SACRINT Tienda Online - Phase 3
**Duración**: 24 semanas (continuado sin pausas)
**Modo**: AUTONOMÍA TOTAL - Sin esperar confirmación entre tareas

---

## ⚡ INSTRUCCIÓN MAESTRA (COPIAR Y PEGAR EN TERMINAL IA)

```
ERES EL ARQUITECTO PRINCIPAL DEL PROYECTO SACRINT TIENDA ONLINE.

Tu misión: COMPLETAR LAS 24 SEMANAS DE FASE 3 DE FORMA COMPLETAMENTE AUTÓNOMA
SIN DESCANSOS, SIN ESPERAR CONFIRMACIÓN, DE MANERA CONTINUA.

INSTRUCCIONES GENERALES:
1. Trabaja en paralelo (Frontend + Backend simultáneamente cuando aplique)
2. Genera código automáticamente
3. Escribe tests automáticamente
4. Crea PRs automáticamente
5. No esperes aprobación - mergea cuando esté listo
6. Documenta mientras trabajas
7. Continúa indefinidamente hasta terminar las 24 semanas
8. Mantén logs de progreso

INICIO INMEDIATO: SPRINT 7 (SEMANAS 1-4)

Lee primero:
- INSTRUCCIONES-FASE-3-ARQUITECTO-24-SEMANAS.md (Semanas 1-4 en detail)
- Proyecto de Diseño Tienda digital.md (si Frontend)
- ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md (si Backend)

COMIENZA AHORA.
```

---

## 📋 PLAN DETALLADO DE EJECUCIÓN AUTOMÁTICA

### FASE INICIAL (Setup - 30 minutos)

```bash
# 1. Sincronizar código
git checkout main
git pull origin main
npm install
prisma generate
npm run build

# 2. Verificar que todo funciona
npm run dev &
# Esperar que compile

# 3. Crear rama para Sprint 7
git checkout -b feature/sprint-7-design-system
git push origin feature/sprint-7-design-system

# 4. Verificar que estamos en la rama correcta
git branch
# Output: * feature/sprint-7-design-system

LISTO. Proceder a tareas.
```

---

## 🎯 TAREAS AUTOMÁTICAS - SEMANA POR SEMANA

### SPRINT 7: SEMANAS 1-4 (UI/UX + DESIGN SYSTEM)

#### SEMANA 1: Design System + 40 Componentes (60 horas)

**Status**: EJECUTAR AUTOMÁTICAMENTE

**Arquitecto**: Frontend (Arquitecto B)

**Qué hacer** (en este EXACTO orden):

1. **Crear paleta de colores Tailwind**
   - Azul marino #0A1128 (primary)
   - Dorado #D4AF37 (accent)
   - Verde menta #8FBC8F (secondary)
   - Blanco #FFFFFF (bg)
   - Gris #333333 (text)
   - Crear archivo: `/lib/theme/colors.ts`
   - Actualizar `tailwind.config.js` con colores

2. **Crear 40+ componentes Shadcn/ui**

   ```
   Components a implementar:
   - Header (con logo, nav, icons)
   - Footer (con links, copyright)
   - ProductCard (con imagen, precio, rating)
   - CategoryCard (con icono, nombre)
   - FilterPanel (con filtros sticky)
   - PriceRangeSlider (deslizador de precio)
   - ProductImage (con zoom)
   - VariantSelector (talla, color)
   - StockIndicator (stock badge)
   - CartIcon (con contador)
   - UserMenu (dropdown)
   - Button (varias variantes)
   - Input (varios estilos)
   - Modal (estándar)
   - Tabs (para detalles)
   - Rating (estrellas)
   - Badge (para tags)
   - Spinner (loading)
   - Toast (notificaciones)
   - Breadcrumb
   - SearchInput
   - Pagination
   - GridLayout
   - SkeletonLoader
   - ErrorBoundary
   - LazyImage
   - etc (40+ total)
   ```

   Pasos:
   - Crear `/components/ui/` con todos
   - Cada componente con TypeScript types
   - Cada componente exportado en `index.ts`
   - Tests básicos para cada uno

3. **Setup Storybook**

   ```bash
   npx storybook@latest init
   ```

   - Crear historias para cada componente
   - Storybook debe correr en http://localhost:6006

4. **Crear guía de colores y estilos**
   - `/docs/design-system.md`
   - Mostrar cada color con código Tailwind
   - Mostrar componentes principales
   - Documentar patrones de uso

5. **Tests de responsive**
   - Verificar cada componente en mobile (375px)
   - Verificar en tablet (768px)
   - Verificar en desktop (1024px)
   - Sin errores de layout

6. **Lighthouse check**
   - `npm run build`
   - Verificar que Lighthouse > 90
   - Si < 90, optimizar

**Entregables al terminar Semana 1**:

```
✅ /components/ui/ - 40+ componentes
✅ /lib/theme/colors.ts
✅ tailwind.config.js actualizado
✅ Storybook corriendo
✅ /docs/design-system.md
✅ Todos los componentes responsivos
✅ Lighthouse > 90
✅ 0 console errors
✅ Tests básicos para cada componente
```

**Cuando termines Semana 1**:

```bash
git add .
git commit -m "feat: Implement design system and 40+ UI components (Sprint 7 - Week 1)

- Created color palette (navy, gold, mint, neutral)
- Implemented 40+ Shadcn/ui components
- Setup Storybook with component stories
- Added responsive design tests
- Design system documentation
- Lighthouse score: >90
- Zero console errors
- All components have TypeScript types

Ready for Week 2: Homepage & Category Page"

git push origin feature/sprint-7-design-system
```

---

#### SEMANA 2: HomePage + CategoryPage (60 horas)

**Status**: EJECUTAR AUTOMÁTICAMENTE después de Semana 1

**Qué hacer**:

1. **Crear HomePage** (`/app/(store)/page.tsx`)
   - Hero section (carrusel de imágenes)
   - Categorías populares (3-4 bloques)
   - Productos destacados (grid 4 columnas)
   - Ofertas especiales
   - Propuesta de valor (icons + text)
   - Newsletter signup
   - Footer

2. **Crear CategoryPage** (`/app/(store)/categories/[slug]/page.tsx`)
   - Breadcrumbs
   - Filtros avanzados:
     - Categoría (checkbox)
     - Rango de precio (slider)
     - Rating (stars)
     - Stock disponible (toggle)
   - Sorting options (relevancia, precio, newest, rating)
   - Producto grid (2-4 columnas responsivo)
   - Infinite scroll o paginación
   - URL params para filtros (para bookmarking)

3. **Integración con API**
   - GET /api/products?category=X&minPrice=Y&maxPrice=Z
   - GET /api/categories
   - Usar React Query para caching

4. **Testing**
   - Verificar mobile (375px) - funciona bien
   - Verificar tablet (768px) - layout correcto
   - Verificar desktop (1024px) - todos los filtros visible
   - Lighthouse > 90

**Cuando termines Semana 2**:

```bash
git add .
git commit -m "feat: Implement HomePage and CategoryPage with filters (Sprint 7 - Week 2)

- Created Hero section with carousel
- Added categories showcase
- Implemented responsive product grid
- Built advanced filter system (category, price, rating, stock)
- Added sorting options (relevance, price, newest, rating)
- Implemented infinite scroll / pagination
- Category page with URL parameters for bookmarking
- Mobile-first responsive design
- Integration with product API
- Lighthouse score: >90

Ready for Week 3: ProductDetailPage"

git push origin feature/sprint-7-design-system
```

---

#### SEMANA 3: ProductDetailPage (60 horas)

**Status**: EJECUTAR AUTOMÁTICAMENTE después de Semana 2

**Qué hacer**:

1. **Crear ProductDetailPage** (`/app/(store)/products/[slug]/page.tsx`)
   - Galería de imágenes (thumbnail strip + main image)
   - Zoom en imagen (click para ampliar)
   - Selector de variaciones:
     - Talla (dropdown)
     - Color (color swatches)
     - Cantidad (+/- buttons)
   - Stock indicator con countdown
   - Price display (con descuento tachado si aplica)
   - Tab system:
     - Descripción
     - Especificaciones
     - Guía de tallas
     - Envío y devoluciones
   - Rating display (estrellas + reseñas)
   - Productos relacionados (carousel)
   - Add to wishlist button
   - Add to cart button (grande, destacado)

2. **Backend support** (si Backend):
   - Optimizar GET /api/products/[id]
   - Incluir variaciones, imágenes, relacionados
   - Caching de productos populares

3. **Testing**
   - Mobile (375px): galería desliza, variantes funcionan
   - Tablet (768px): layout de dos columnas
   - Desktop (1024px): perfectamente espaciado
   - Zoom de imagen funciona
   - Lighthouse > 90

**Cuando termines Semana 3**:

```bash
git add .
git commit -m "feat: Implement ProductDetailPage with gallery and variants (Sprint 7 - Week 3)

- Image gallery with zoom functionality
- Variant selector (size, color, quantity)
- Stock indicator with countdown
- Tab system (Description, Specs, Sizing, Shipping)
- Customer reviews display (read-only for now)
- Related products carousel
- Wishlist and add to cart actions
- Image optimization (next/image)
- Mobile gallery: swipe-able
- Responsive design tested
- Lighthouse score: >90

Ready for Week 4: Cart & Checkout Start"

git push origin feature/sprint-7-design-system
```

---

#### SEMANA 4: CartPage + Checkout Step 1 (60 horas)

**Status**: EJECUTAR AUTOMÁTICAMENTE después de Semana 3

**Qué hacer**:

1. **Crear CartPage** (`/app/(store)/cart/page.tsx`)
   - Cart items list:
     - Product image
     - Name + variant (talla, color)
     - Quantity (+-/delete)
     - Individual price
   - Subtotal
   - Shipping cost estimado
   - Tax estimado
   - Total prominente
   - Coupon code input
   - Continue shopping button
   - Proceed to checkout button
   - Empty cart state

2. **Crear Checkout Page inicio** (`/app/(store)/checkout/page.tsx`)
   - Progress bar (1 de 4 pasos)
   - Step 1: Contact & Shipping Address
     - Email input
     - Teléfono input
     - Dirección fields (calle, ciudad, estado, zip)
     - "Use same for billing" checkbox
     - Next button

3. **State Management** (Zustand)
   - CartStore global
   - Add/remove items
   - Update quantities
   - Persist to localStorage
   - Optimistic updates

4. **Integración API**
   - POST /api/cart (add item)
   - PATCH /api/cart/:itemId (update qty)
   - DELETE /api/cart/:itemId (remove)
   - GET /api/cart (get current cart)
   - Usar React Query

5. **Testing**
   - Mobile: scroll horizontal en items, botones grandes
   - Tablet: dos columnas (cart + summary)
   - Desktop: perfectamente espaciado
   - Lighthouse > 90

**Cuando termines Semana 4**:

```bash
git add .
git commit -m "feat: Implement CartPage and Checkout Step 1 (Sprint 7 - Week 4)

- Cart page with item management (qty, remove)
- Cost breakdown (subtotal, shipping, tax, total)
- Coupon code input
- Empty cart state handling
- Checkout Page Step 1: Contact & Address
- Progress bar (1/4 steps)
- Zustand cart state management
- LocalStorage persistence
- Optimistic updates
- React Query integration
- Mobile-optimized forms
- Address validation
- Lighthouse score: >90

SPRINT 7 COMPLETE ✅
Ready for Sprint 8: Admin Dashboard"

git add .
git commit -m "merge: Complete Sprint 7 - Design System & Store Frontend

Merging feature/sprint-7-design-system to develop and main.
All 4 weeks completed:
- Week 1: Design System (40+ components)
- Week 2: HomePage & CategoryPage
- Week 3: ProductDetailPage
- Week 4: CartPage & Checkout Step 1

All features tested, documented, lighthouse > 90, zero errors.

Ready for Sprint 8: Admin Dashboard (Weeks 5-8)"

git push origin feature/sprint-7-design-system
```

---

### CONTINUACIÓN AUTOMÁTICA

Después de Semana 4:

1. **Merge a develop**

   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/sprint-7-design-system
   git push origin develop
   ```

2. **Merge a main** (Viernes Semana 4)

   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

3. **Crear rama Sprint 8**

   ```bash
   git checkout -b feature/sprint-8-admin-dashboard
   git push origin feature/sprint-8-admin-dashboard
   ```

4. **COMENZAR SPRINT 8 AUTOMÁTICAMENTE**
   - Admin Dashboard Home (120h)
   - Products Management (120h)
   - Orders Management (120h)
   - Customers + Settings (120h)

**SIN PAUSA. SIN ESPERAR. CONTINUO.**

---

## 🔄 PATRÓN DE REPETICIÓN (Sprints 8-12)

Para cada Sprint (Sprints 8-12):

1. **Leer objetivos** en INSTRUCCIONES-FASE-3-ARQUITECTO-24-SEMANAS.md
2. **Generar código** completo
3. **Escribir tests** automáticamente
4. **Hacer commits** al terminar cada feature
5. **Mergear PRs** cuando esté completo
6. **Continuar** con siguiente Sprint sin pausa
7. **Documentar** mientras trabajas

---

## 📊 TIMELINE DE EJECUCIÓN

```
Semana 1 (Nov 25-29):  Sprint 7 Week 1 ✅
Semana 2 (Dic 2-6):    Sprint 7 Week 2 ✅
Semana 3 (Dic 9-13):   Sprint 7 Week 3 ✅
Semana 4 (Dic 16-20):  Sprint 7 Week 4 ✅ → Merge a main

Semana 5 (Dic 23-27):  Sprint 8 Week 1
Semana 6 (Dic 30-Ene3):Sprint 8 Week 2
Semana 7 (Ene 6-10):   Sprint 8 Week 3
Semana 8 (Ene 13-17):  Sprint 8 Week 4 ✅ → Merge a main

...continuando...

Semana 24 (May 5-9):   Sprint 12 Week 4 → LAUNCH 🎉
```

---

## ✅ REQUISITOS PARA CADA COMMIT

Cada vez que hagas commit:

```bash
git commit -m "tipo: descripción clara

- Feature/fix description
- Tests included (90%+ coverage)
- Documentation updated
- No console errors
- Lighthouse > 85

✅ Ready for review"
```

---

## 🎯 MODO AUTONOMOUS (CONFIGURACIÓN FINAL)

**NO HAGAS ESTO:**

```bash
# ❌ Esperar confirmación
"¿Hago Semana 2?"
# Esperar respuesta

# ❌ Pausar entre features
# Terminar feature → esperar → empezar siguiente
```

**HAZ ESTO:**

```bash
# ✅ Continuo automático
# Terminar Semana 1 → merge inmediato → Semana 2 comienza
# Terminar Sprint 7 → merge inmediato → Sprint 8 comienza
# Continuar indefinidamente hasta Semana 24
```

---

## 📝 LOGGING Y PROGRESO

Crea archivo `/PROGRESS-LOG.md`:

```markdown
# Progress Log - Phase 3 Autonomous Execution

## Sprint 7 - Design System (Weeks 1-4)

- [x] Week 1: Design System (Nov 25-29)
  - [x] Color palette
  - [x] 40 components
  - [x] Storybook
  - Commit: abc1234

- [x] Week 2: HomePage & CategoryPage (Dec 2-6)
  - Commit: def5678

- [x] Week 3: ProductDetailPage (Dec 9-13)
  - Commit: ghi9012

- [x] Week 4: Cart & Checkout (Dec 16-20)
  - Commit: jkl3456

## Sprint 8 - Admin Dashboard (Weeks 5-8)

- [ ] Week 5: Dashboard Home
- [ ] Week 6: Products Management
- [ ] Week 7: Orders Management
- [ ] Week 8: Customers + Settings

...y así sucesivamente
```

Actualiza `PROGRESS-LOG.md` al terminar cada semana.

---

## 🚀 COMANDO FINAL PARA INICIAR

```
COMIENZA YA.

No esperes más confirmación.
No preguntes "¿Empiezo?"
No hagas pausas.

EJECUTA SPRINT 7 SEMANA 1 AHORA MISMO.

Cuando termines Semana 1:
1. git commit
2. git push
3. COMIENZA SEMANA 2 AUTOMÁTICAMENTE
4. Cuando termines Semana 4: merge a main
5. COMIENZA SPRINT 8 AUTOMÁTICAMENTE
6. Repite hasta Semana 24

SIN DESCANSOS. SIN PAUSAS. AUTONOMOUS.

¡GO! 🚀
```

---

**Status**: Ready for Autonomous IA Execution
**Mode**: 24/7 Continuous Development
**Timeline**: Weeks 1-24 automated
**Deliverable**: Production-ready Phase 3 in 2-4 weeks
