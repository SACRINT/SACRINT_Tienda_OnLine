# ✅ SEMANA 1 - VERIFICACIÓN RÁPIDA Y PASOS INMEDIATOS

**Para**: Arquitecto (Implementación Shop Frontend)
**Fecha**: 17 de Noviembre, 2025
**Status**: Listo para ejecutar

---

## 🎯 VERIFICACIÓN PRE-TRABAJO (5 minutos)

Ejecuta estos comandos en Terminal:

```bash
cd "C:\03_Tienda digital"

# 1. Verificar rama
git branch
# ✅ Debe mostrar: * feature/semana-1-shop-frontend (o tu nombre de rama)

# 2. Verificar estado limpio
git status
# ✅ Debe mostrar: nothing to commit, working tree clean

# 3. Compilar proyecto
npm run build
# ✅ Debe terminar con: ✔ successfully (sin errores)

# 4. Linter
npm run lint
# ✅ Debe mostrar: 0 errors, 0 warnings
```

**Si alguna verificación falla**, avísame ahora antes de continuar.

---

## 📋 TAREAS SEMANA 1-2 (Orden de Ejecución)

### **LUNES: Componentes Base**

**Tiempo estimado**: 3 horas

#### 1️⃣ ShopHero.tsx (45 min)
```bash
# Crear carpeta si no existe
mkdir -p src/components/shop

# Crear archivo
touch src/components/shop/ShopHero.tsx
```

**Código**: Ver línea 82-121 en `SEMANA-1-GUIA-EJECUTABLE.md`

**Verificación**:
```bash
npm run build
# ✅ Debe compilar sin errores
```

---

#### 2️⃣ ProductCard.tsx (45 min)
```bash
touch src/components/shop/ProductCard.tsx
```

**Código**: Ver línea 147+ en `SEMANA-1-GUIA-EJECUTABLE.md`

**Verificación**:
```bash
npm run build
# ✅ Debe compilar sin errores
```

---

#### 3️⃣ Export Index (15 min)

Crear `src/components/shop/index.ts`:

```typescript
export { ShopHero } from './ShopHero'
export { ProductCard } from './ProductCard'
```

**Verificación**:
```bash
npm run build
```

---

### **MARTES: Componentes Avanzados**

**Tiempo estimado**: 3.5 horas

#### 4️⃣ ProductGallery.tsx (90 min)
- Galería de imágenes con zoom
- Thumbnails
- Sincronización con variantas
- Ubicación: `src/components/shop/ProductGallery.tsx`

#### 5️⃣ FilterSidebar.tsx (90 min)
- Filtros por categoría, precio, talla, color
- UI interactiva con checkboxes/sliders
- Ubicación: `src/components/shop/FilterSidebar.tsx`

---

### **MIÉRCOLES: Componentes Especializados**

**Tiempo estimado**: 3 horas

#### 6️⃣ ProductReviews.tsx (60 min)
- Lista de reviews paginada
- Rating stars
- Ubicación: `src/components/shop/ProductReviews.tsx`

#### 7️⃣ RelatedProducts.tsx (60 min)
- Grid de productos relacionados
- Carrusel responsivo
- Ubicación: `src/components/shop/RelatedProducts.tsx`

#### 8️⃣ SearchAutocomplete.tsx (30 min)
- Input con suggestions
- Debounce de búsqueda
- Ubicación: `src/components/shop/SearchAutocomplete.tsx`

---

### **JUEVES: Páginas + Endpoints**

**Tiempo estimado**: 4.5 horas

#### 9️⃣ Página de Shop (120 min)
```
Ubicación: src/app/(shop)/shop/page.tsx
Componentes: ShopHero + ProductGallery + FilterSidebar + SearchAutocomplete
Incluir: Loader states, error boundaries, pagination
```

#### 🔟 Página de Detalle (90 min)
```
Ubicación: src/app/(shop)/shop/products/[id]/page.tsx
Componentes: ProductGallery + ProductReviews + RelatedProducts
Incluir: Breadcrumbs, stock checker, add to cart
```

#### 1️⃣1️⃣ API Endpoints (90 min)

**a) GET /api/products/search**
```
- Query: ?q=query&limit=10
- Response: [{id, name, image, price}]
- Validación: Min 2 caracteres, max 100 resultados
- Ubicación: src/app/api/products/search/route.ts
```

**b) GET /api/products/:id/related**
```
- Params: :id = product ID
- Response: [{id, name, image, price}] (4-6 productos)
- Lógica: Misma categoría o tags similares
- Ubicación: src/app/api/products/[id]/related/route.ts
```

**c) GET /api/products/:id/reviews**
```
- Query: ?page=1&limit=10
- Response: {reviews: [...], pagination: {...}}
- Incluir: autor, rating, fecha, texto
- Ubicación: src/app/api/products/[id]/reviews/route.ts
```

**d) POST /api/reviews**
```
- Body: {productId, rating, text}
- Validación: rating 1-5, text 10-500 caracteres
- Response: Nuevo review creado
- Ubicación: src/app/api/reviews/route.ts
```

**e) GET /api/categories/hierarchy**
```
- Response: [{id, name, children: [{...}]}]
- Estructura: Árbol de categorías
- Cache: 1 hora
- Ubicación: src/app/api/categories/hierarchy/route.ts
```

---

### **VIERNES: Testing + PR**

**Tiempo estimado**: 2 horas

#### Testing Manual
```bash
# 1. Build final
npm run build
# ✅ Debe pasar

# 2. Dev server
npm run dev
# ✅ Abrir http://localhost:3000/shop

# 3. Verificar mobile (DevTools F12 → Toggle device toolbar)
# ✅ Responsive en iPhone 12, iPad, Desktop

# 4. Lighthouse audit
# ✅ Score > 90 en Cumulative Layout Shift
```

#### Crear PR
```bash
git add .
git commit -m "feat(shop): Week 1 Shop Frontend - 7 components, 2 pages, 5 endpoints"
git push origin feature/semana-1-shop-frontend

# Luego en GitHub:
# Crear Pull Request hacia 'develop'
# Esperar code review
```

---

## 🔧 ERRORES COMUNES (Soluciones Rápidas)

### Error: "Cannot find module '@/components/ui/button'"
```bash
# Instalación missing shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add slider
```

### Error: "Type 'Decimal' is not assignable to 'number'"
```typescript
// ✅ CORRECTO
const price = parseFloat(String(product.price))

// ❌ INCORRECTO
const price = product.price + 10
```

### Error: "Cannot find 'route.ts' in api folder"
```bash
# Estructura correcta:
mkdir -p src/app/api/products/search
touch src/app/api/products/search/route.ts
```

---

## 📊 PROGRESO ESPERADO

| Día | Tarea | Líneas | Horas | Status |
|-----|-------|--------|-------|--------|
| Lunes | ShopHero + ProductCard | 330 | 3h | ⏳ |
| Martes | ProductGallery + FilterSidebar | 400 | 3.5h | ⏳ |
| Miércoles | Reviews + Related + Autocomplete | 350 | 3h | ⏳ |
| Jueves | Páginas + 5 Endpoints | 500 | 4.5h | ⏳ |
| Viernes | Testing + PR | 50 | 2h | ⏳ |
| **TOTAL** | **Shop Frontend Completo** | **~1,600** | **~16h** | ⏳ |

---

## 🚀 SIGUIENTE PASO

**Ahora**:
1. ✅ Verifica las 4 verificaciones PRE-TRABAJO arriba
2. ✅ Crea `src/components/shop/ShopHero.tsx`
3. ✅ Compila con `npm run build`
4. ✅ Avísame cuando tengas ShopHero lista

**Yo voy a**:
- ✅ Proporcionar código referencia para cada componente cuando lo necesites
- ✅ Revisar errores de compilación inmediatamente
- ✅ Ayudarte con endpoint logic si necesitas

---

**¿Listo para comenzar? Ejecuta las verificaciones PRE-TRABAJO y avísame el resultado.**
