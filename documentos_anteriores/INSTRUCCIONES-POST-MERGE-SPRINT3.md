# 📋 INSTRUCCIONES POST-MERGE SPRINT 3

**Fecha**: 16 de Noviembre, 2025
**Status**: ✅ DEVELOP ACTUALIZADO - BUILD PASANDO
**Próximo Sprint**: Sprint 2 Frontend (Productos UI) - Sprint 4 Backend (Reviews & Inventory)

---

## 🎯 ESTADO ACTUAL

```
Branch: develop
Status: ✅ LIMPIO - Sin errores de build
Build: ✅ npm run build PASANDO
Commits:
  - 206e112: merge: Fix build errors from Sprint 3 & NextAuth integration
  - adfd537: merge: Fix NextAuth type conflicts
  - 27beec0: merge: Sprint 3 - Cart, Checkout & Orders API
```

---

## 📌 PASO 1: AMBOS ARQUITECTOS - SINCRONIZAR LOCAL

### Arquitecto A (Backend)

```bash
cd "C:\03_Tienda digital"

# 1. Traer todos los cambios del remoto
git fetch origin

# 2. Ir a develop
git checkout develop

# 3. Sincronizar con remoto
git pull origin develop

# 4. Verificar que todo está ok
git log --oneline -3

# Esperado:
#   206e112 merge: Fix build errors from Sprint 3 & NextAuth integration
#   adfd537 merge: Fix NextAuth type conflicts
#   27beec0 merge: Sprint 3 - Cart, Checkout & Orders API

# 5. Instalar dependencias
npm install

# 6. Generar Prisma Client
npx prisma generate

# 7. Verificar que build pasa
npm run build

# ✅ Deberías ver: "Compiled successfully"
```

### Arquitecto B (Frontend)

```bash
cd "C:\03_Tienda digital"

# 1. Traer todos los cambios del remoto
git fetch origin

# 2. Ir a develop
git checkout develop

# 3. Sincronizar con remoto
git pull origin develop

# 4. Verificar que todo está ok
git log --oneline -3

# Esperado: mismo que Arquitecto A

# 5. Instalar dependencias
npm install

# 6. Generar Prisma Client
npx prisma generate

# 7. Verificar que build pasa
npm run build

# ✅ Deberías ver: "Compiled successfully"
```

---

## ✅ CHECKLIST POST-MERGE

- [ ] Ejecuté `git pull origin develop`
- [ ] Ejecuté `npm install`
- [ ] Ejecuté `npx prisma generate`
- [ ] Ejecuté `npm run build` y pasó ✅
- [ ] Verifiqué que el codigo compiló sin errores
- [ ] Leí el archivo CAMBIOS-MERGE-SPRINT-3.md

---

## 📌 PASO 2: ARQUITECTO A - SIGUIENTE SPRINT (Sprint 4)

### Crear rama para Sprint 4

```bash
cd "C:\03_Tienda digital"

# Crear rama nueva para Sprint 4
git checkout -b claude/backend-sprint-4-reviews-inventory

# Verificar que estás en la rama correcta
git branch

# Deberías ver:
#   * claude/backend-sprint-4-reviews-inventory
#     develop
#     main
```

### Sprint 4: Reviews & Inventory Management

**Duración estimada**: 4-5 días

**Responsabilidades**:

1. **Review System DAL** (src/lib/db/reviews.ts)
   - `createReview(productId, userId, rating, comment)`
   - `getProductReviews(productId)`
   - `updateReview(reviewId, data)`
   - `deleteReview(reviewId)`
   - `getReviewStats(productId)`

2. **Review API Endpoints**
   - `POST /api/products/[id]/reviews` - Crear review
   - `GET /api/products/[id]/reviews` - Listar reviews con pagination
   - `PATCH /api/reviews/[id]` - Actualizar review del usuario
   - `DELETE /api/reviews/[id]` - Eliminar review

3. **Inventory Management DAL** (src/lib/db/inventory.ts)
   - `updateStock(productId, variantId, quantity)`
   - `reserveStock(productId, variantId, quantity)` - Para órdenes
   - `releaseReservedStock(orderId)` - Si orden es cancelada
   - `getLowStockProducts(tenantId, threshold)`
   - `getInventoryReport(tenantId)`

4. **Inventory API Endpoints**
   - `PATCH /api/products/[id]/stock` - Actualizar stock
   - `GET /api/inventory/low-stock` - Productos con stock bajo
   - `POST /api/inventory/adjust` - Ajuste manual de inventario

5. **Validations** (src/lib/security/schemas/review-schemas.ts)
   - CreateReviewSchema (rating 1-5, comment max 500 chars)
   - UpdateReviewSchema
   - ReviewFilterSchema

**Puntos críticos**:

- ✅ RBAC: Solo STORE_OWNER puede ver/ajustar inventario
- ✅ RBAC: Solo autor de review puede editar su propio review
- ✅ Multi-tenant: Filtrar por tenantId en todas las queries
- ✅ Transacciones: reserveStock debe ser atómico
- ✅ Validaciones Zod en TODOS los endpoints

**Documentación requerida**:

- Crear `SPRINT-4-REVIEWS-INVENTORY-BACKEND.md`
- Documentar todas las funciones DAL
- Documentar todos los endpoints API
- Incluir ejemplos de uso

---

## 📌 PASO 3: ARQUITECTO B - SIGUIENTE SPRINT (Sprint 2)

### Crear rama para Sprint 2

```bash
cd "C:\03_Tienda digital"

# Crear rama nueva para Sprint 2 (o continuar si ya existe)
git checkout -b claude/frontend-sprint-2-products

# Verificar que estás en la rama correcta
git branch

# Deberías ver:
#   * claude/frontend-sprint-2-products
#     develop
#     main
```

### Sprint 2: Products UI & Shopping

**Duración estimada**: 4-5 días

**Responsabilidades**:

1. **Shop Layout & Navigation** (src/app/(shop)/layout.tsx)
   - Header responsivo con búsqueda
   - Sidebar con categorías y filtros
   - Footer
   - Mobile menu dropdown

2. **Products Listing Page** (src/app/(shop)/products/page.tsx)
   - Llamada a `GET /api/products?page=1&limit=20`
   - Grid de productos 2/3/4 columnas
   - Filtros: categoría, precio, stock
   - Paginación
   - Loading skeleton

3. **Product Detail Page** (src/app/(shop)/products/[id]/page.tsx)
   - Llamada a `GET /api/products/[id]`
   - Galería de imágenes (thumbnails + main)
   - Información del producto
   - Selector de variantes (si existen)
   - Cantidad y botón "Agregar al carrito"
   - Reviews/rating display
   - Breadcrumbs

4. **Shopping Cart Store** (src/lib/store/useCart.ts)
   - ✅ YA ESTÁ DOCUMENTADO EN INSTRUCCIONES
   - Usar Zustand con persistencia
   - Calcular: subtotal, tax (16%), shipping
   - localStorage para persistencia

5. **Cart Page** (src/app/(shop)/cart/page.tsx)
   - Listar items del carrito
   - Botones para aumentar/disminuir/eliminar
   - Resumen de precios (subtotal, tax, shipping)
   - Botón "Proceder al Checkout"
   - Link a "Continuar Comprando"

6. **Checkout Page** (src/app/(shop)/checkout/page.tsx)
   - Paso 1: Dirección de envío (selector o nueva)
   - Paso 2: Método de pago
   - Paso 3: Revisión de orden
   - Integración Stripe Elements
   - Llamada a `POST /api/checkout`

7. **Components Reutilizables** (src/components/shop/)
   - ProductCard
   - ProductGallery
   - PriceDisplay
   - StockBadge
   - RatingStars
   - VariantSelector
   - QuantitySelector
   - AddToCartButton
   - CheckoutForm

**Puntos críticos**:

- ✅ SEO: Usar metadata en páginas dinámicas
- ✅ Performance: Lazy loading de imágenes
- ✅ Mobile first: Diseño responsive desde desktop
- ✅ Accesibility: alt text, ARIA labels
- ✅ Estado global: Zustand para cart
- ✅ Error handling: Try/catch en API calls
- ✅ Loading states: Skeleton, spinners

**APIs que usarás** (todas ya implementadas por Arquitecto A):

```
GET    /api/products                    # Listar productos con filtros
GET    /api/products/[id]               # Detalle de producto
GET    /api/categories?format=tree       # Categorías
GET    /api/cart                        # Obtener carrito del usuario
POST   /api/cart                        # Agregar item
PATCH  /api/cart/items/[itemId]         # Actualizar cantidad
DELETE /api/cart/items/[itemId]         # Eliminar item
POST   /api/checkout                    # Procesar checkout
```

**Documentación requerida**:

- Crear `SPRINT-2-PRODUCTS-UI-FRONTEND.md`
- Documentar todas las páginas
- Documentar store de Zustand
- Incluir capturas de pantalla del diseño
- Documentar integración con APIs

---

## 🎓 LECCIONES DEL MERGE SPRINT 3

### Para Arquitecto A (Backend) 🔧

**Errores principales cometidos**:

1. ❌ Usar `findUnique` con campos que no son `@unique @id`
   - ✅ SOLUCIÓN: Usar `findFirst` para composite unique constraints

2. ❌ Referenciar campos del schema que no existen
   - ✅ SOLUCIÓN: Siempre verificar Prisma schema antes de usar campos

3. ❌ Intentar hacer `upsert` con composite unique que incluye nullable
   - ✅ SOLUCIÓN: Separar en `findFirst` + condicional `update/create`

4. ❌ No convertir tipos Decimal a Number
   - ✅ SOLUCIÓN: `Number(decimalValue)` antes de retornar

**Checklist para futuro**:

- [ ] Reviso schema.prisma antes de cada query
- [ ] Uso `findFirst` para campos no unique
- [ ] Convierto Decimal → Number en precios
- [ ] Ejecuto `npm run build` antes de push
- [ ] Documento todos los cambios de schema

### Para Arquitecto B (Frontend) 💻

**Lo que estaba bien**:
✅ NextAuth integration correcta
✅ Type assertions bien implementadas
✅ Import paths actualizados

**Para el futuro**:

- Espera a que Backend haga push antes de empezar
- Verifica que `npm run build` pase antes de hacer PR
- Sincroniza develop regularmente para evitar conflictos

---

## 🔗 API CONTRACTS CONFIRMADOS

Estos endpoints están **LISTOS Y TESTADOS**:

### Authentication ✅

```
POST   /api/auth/signup                # Registro con email/password
POST   /api/auth/google                # Login con Google OAuth
POST   /api/auth/logout                # Logout
GET    /api/auth/me                    # Info del usuario actual
```

### Products ✅

```
GET    /api/products                   # Listar con pagination/filtros
GET    /api/products/[id]              # Detalle
POST   /api/products                   # Crear (STORE_OWNER only)
PATCH  /api/products/[id]              # Actualizar (STORE_OWNER only)
DELETE /api/products/[id]              # Eliminar (STORE_OWNER only)
```

### Categories ✅

```
GET    /api/categories?format=tree      # Árbol de categorías
GET    /api/categories/[id]             # Detalle de categoría
```

### Cart & Checkout ✅

```
GET    /api/cart                        # Obtener carrito
POST   /api/cart                        # Agregar item
PATCH  /api/cart/items/[itemId]         # Actualizar cantidad
DELETE /api/cart/items/[itemId]         # Eliminar item
POST   /api/checkout                    # Procesar checkout
```

### Orders ✅

```
GET    /api/orders                      # Órdenes del usuario
GET    /api/orders/[id]                 # Detalle de orden
PATCH  /api/orders/[id]                 # Actualizar status (STORE_OWNER)
GET    /api/admin/orders                # Dashboard admin
```

---

## 📊 ESTADO DE SPRINTS

```
Sprint 0: Setup ................................ ✅ COMPLETADO
Sprint 1: Auth + Tenants ...................... ✅ COMPLETADO
Sprint 2: Catálogo (Backend) .................. ✅ COMPLETADO
Sprint 3: Cart + Checkout (Backend) .......... ✅ COMPLETADO
           NextAuth Fixes (Frontend) ......... ✅ COMPLETADO

PRÓXIMO:
Sprint 2: Productos UI (Frontend) ........... ⏳ COMENZAR AHORA
Sprint 4: Reviews + Inventory (Backend) ... ⏳ COMENZAR AHORA
```

---

## ⚠️ RECORDATORIOS CRÍTICOS

### ANTES DE HACER CUALQUIER COMMIT:

```bash
# 1. Siempre compilar
npm run build

# 2. Siempre revisar tipos
npm run lint

# 3. Si hay tests
npm test

# 4. Si falla algo, NO hagas push. Arréglalo primero.
```

### GIT WORKFLOW:

```bash
# 1. Pull develop antes de empezar
git checkout develop
git pull origin develop

# 2. Crear rama feature
git checkout -b claude/backend-sprint-4-... (Arquitecto A)
git checkout -b claude/frontend-sprint-2-... (Arquitecto B)

# 3. Hacer commits pequeños y descriptivos
git commit -m "feat: [descripción clara]"

# 4. Push solo tu rama
git push origin claude/...

# 5. Crear PR a develop (NO a main)
```

### SINCRONIZACIÓN:

```bash
# Cada mañana/antes de empezar
git fetch origin
git checkout develop
git pull origin develop

# Si hay conflictos, resuelve localmente
# NO hagas merge fuerza a menos que sepas qué haces
```

---

## 📞 SOPORTE & PREGUNTAS

Si encuentras errores similares a los del merge Sprint 3:

1. **Consulta CAMBIOS-MERGE-SPRINT-3.md** - Tiene la solución
2. **Revisa el schema en prisma/schema.prisma** - Antes de usar campos
3. **Usa findFirst en lugar de findUnique** - Para composite constraints
4. **Ejecuta npm run build** - Antes de push

---

## 🎯 PRÓXIMA REUNIÓN

**Fecha recomendada**: 17 de Noviembre, 2025 (mañana)
**Duración**: 15-30 minutos

**Temas**:

1. ¿Todos sincronizados con develop?
2. ¿Build pasa en ambas máquinas?
3. Confirmar que comienzan Sprint 2 y 4
4. Coordinar horarios de trabajo

**Enlace de reunión**: [Será proporcionado]

---

## ✅ CHECKLIST FINAL

- [ ] Leí CLAUDE.md - Contexto del proyecto
- [ ] Leí CAMBIOS-MERGE-SPRINT-3.md - Qué se arregló
- [ ] Sincronizé con `git pull origin develop`
- [ ] Ejecuté `npm install` y `npm run build`
- [ ] Cree rama para mi próximo sprint
- [ ] Estoy listo para comenzar Sprint 2/4

---

**Documento creado**: 16 de Noviembre, 2025
**Última actualización**: 16 de Noviembre, 2025
**Status**: ✅ LISTO PARA SPRINT 2 & 4

¡Adelante con los próximos sprints! 🚀
