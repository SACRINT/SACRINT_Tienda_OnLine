# 🔧 SEMANA 1 - TROUBLESHOOTING RÁPIDO

**Para**: Resolución rápida de errores durante implementación
**Uso**: Cuando `npm run build` falle, consulta esto primero

---

## 🚨 ERROR #1: Cannot find module '@/components/ui/X'

**Síntoma**:

```
Cannot find module '@/components/ui/button'
Cannot find module '@/components/ui/checkbox'
Cannot find module '@/components/ui/slider'
```

**Solución**:

```bash
# Instala los componentes que falten
npx shadcn-ui@latest add button
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add loader

# Luego compila
npm run build
```

**Componentes necesarios para Week 1**:

- `button` ← CRÍTICO
- `checkbox` ← Para filtros
- `slider` ← Para price range
- `loader` ← Para loading states

---

## 🚨 ERROR #2: "Type 'Decimal' is not assignable to 'number'"

**Síntoma**:

```typescript
Type 'Decimal' is not assignable to type 'number'
  Product.basePrice is 'Decimal' but value is 'number'
```

**Ubicaciones donde ocurre**:

- `src/components/shop/ProductCard.tsx` - línea 160 (price prop)
- `src/components/shop/RelatedProducts.tsx` - línea X
- Pages y endpoints cuando acceden a basePrice

**Solución**:

```typescript
// ❌ MALO
price={product.basePrice}

// ✅ BUENO
price={Number(product.basePrice)}
```

**Patrón general**:

```typescript
// Siempre que tengas un Decimal de Prisma:
const price = Number(product.basePrice);
const total = parseFloat(String(product.salePrice));

// Ambos funcionan, pero `Number()` es más limpio
```

---

## 🚨 ERROR #3: "Cannot use 'async' in component body"

**Síntoma**:

```
Cannot use 'async' in component body.
Use 'use client' at the top of the file to mark it as a Client Component
```

**Ubicaciones donde ocurre**:

- Component accidental async (non-server component)

**Solución**:

```typescript
// ❌ MALO - Componente async sin ser Server Component
'use client'

export async function ProductCard() {
  const data = await fetch(...)
  // ...
}

// ✅ BUENO - Server Component (sin 'use client')
export async function ProductCard() {
  const data = await db.product.findMany()
  return (...)
}

// ✅ BUENO - Client Component (no async, usa useEffect)
'use client'

import { useEffect, useState } from 'react'

export function ProductCard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(...).then(d => setData(d))
  }, [])

  return (...)
}
```

**Regla simple**:

- **Pages** (`page.tsx`) → SIEMPRE `async` (Server Components por defecto)
- **Components en app/**: Decidir caso a caso
  - Si necesita `fetch` → NO agregar `'use client'`, será Server Component
  - Si necesita `useState/useEffect` → Agregar `'use client'` al top

---

## 🚨 ERROR #4: "Next.js Image component requires explicit width/height"

**Síntoma**:

```
Image with src "..." must use "width" and "height" properties
```

**Ubicaciones donde ocurre**:

- ProductCard.tsx - imagen de producto
- ProductGallery.tsx - imágenes principales y thumbnails

**Soluciones según tipo**:

### Caso 1: Imagen con tamaño fijo conocido

```typescript
// ✅ Thumbnail (fijo 80x80)
<Image
  src={img.url}
  alt="Thumbnail"
  width={80}
  height={80}
  className="w-full h-full object-cover"
/>
```

### Caso 2: Imagen responsive (fill)

```typescript
// ✅ Imagen principal que llena contenedor
<div className="relative w-full h-96">
  <Image
    src={img.url}
    alt="Product"
    fill
    className="object-cover"
  />
</div>
```

### Caso 3: Imagen con aspecto ratio conocido

```typescript
// ✅ Cards de producto (16:9 = 4:2.25)
<div className="relative h-48 overflow-hidden">
  <Image
    src={img.url}
    alt="Product card"
    fill
    className="object-cover"
  />
</div>
```

---

## 🚨 ERROR #5: "Route parameters could not be parsed"

**Síntoma**:

```
Route parameters could not be parsed with getRouteParamName
Error: Segment does not contain valid characters
```

**Ubicación**: `src/app/(shop)/shop/products/[id]/page.tsx`

**Causa**: Ruta debe seguir Next.js conventions

**Solución**:

```typescript
// ✅ CORRECTO - Estructura de carpetas
src / app / shop / shop / products / [id] / page.tsx;

// Dentro del archivo:
interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const productId = params.id;
  // ...
}
```

---

## 🚨 ERROR #6: "Prism: Unable to load client (400 Bad Request)"

**Síntoma**:

```
Error: Prisma Client could not be loaded
400 Bad Request
```

**Solución**:

```bash
# 1. Limpiar
rm -rf node_modules/.prisma

# 2. Regenerar
npx prisma generate

# 3. Recompilar
npm run build
```

---

## 🚨 ERROR #7: "Dynamic route segment cannot be optional"

**Síntoma**:

```
Dynamic route segment cannot be optional.
Remove brackets from [[id]] or make it required
```

**Solución**:

```typescript
// ❌ MALO
src / app / products / [[id]] / page.tsx;

// ✅ BUENO - Required
src / app / products / [id] / page.tsx;

// ✅ BUENO - Optional usando catch-all
src / app / products / [...slug] / page.tsx;
```

---

## 🚨 ERROR #8: "Session is required"

**Síntoma**:

```
Cannot read property 'user' of null
session?.user?.tenantId is null
```

**Ubicación**: Pages y endpoints que leen `session`

**Solución**:

```typescript
// En pages:
const session = await auth()

if (!session?.user?.tenantId) {
  return <div>Please log in</div>
}

// En endpoints:
const session = await auth()

if (!session?.user?.tenantId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Ahora puedes usar:
const tenantId = session.user.tenantId
```

---

## 📋 CHECKLIST DE COMPILACIÓN DIARIA

**Ejecuta esto al final de cada día**:

```bash
cd "C:\03_Tienda digital"

# 1. Verificar estado git limpio
git status
# ✅ Debe mostrar: nothing to commit, working tree clean

# 2. Full build
npm run build
# ✅ Debe mostrar: ✔ successfully in XXs

# 3. Linter
npm run lint
# ✅ Debe mostrar: 0 errors, 0 warnings

# 4. Dev server check (opcional, pero recomendado)
npm run dev &
sleep 5
curl http://localhost:3000/shop
# ✅ Debe devolver HTML, no error

# 5. Kill dev server
pkill -f "next dev"
```

---

## 🚀 COMANDOS ÚTILES

**Ver todos los archivos modificados**:

```bash
git diff --name-only
```

**Ver cambios en archivo específico**:

```bash
git diff src/components/shop/ProductCard.tsx
```

**Agregar y commitear cambios de un día**:

```bash
git add src/components/shop/
git commit -m "feat(shop): Add ProductCard and ShopHero components"
```

**Revertir cambios en archivo**:

```bash
git checkout -- src/components/shop/BrokenComponent.tsx
```

**Ver log de commits**:

```bash
git log --oneline -10
```

---

## 📊 ERRORES MÁS COMUNES ESTA SEMANA

| #   | Error                     | Causa                   | Solución                          |
| --- | ------------------------- | ----------------------- | --------------------------------- |
| 1   | Cannot find module        | Component no instalado  | `npx shadcn-ui@latest add X`      |
| 2   | Type mismatch (Decimal)   | Prisma type vs JS type  | `Number(value)`                   |
| 3   | async in client component | 'use client' + async    | Mover a server component          |
| 4   | Image width/height        | next/image required     | Agregar `width`/`height` o `fill` |
| 5   | Route parsing error       | Ruta invalida           | Revisar estructura carpetas       |
| 6   | Prisma Client load fail   | Binary corrupted        | `npx prisma generate`             |
| 7   | Session null              | No autenticado          | Agregar `if (!session)` check     |
| 8   | Category not found        | Relacionamiento missing | Verificar `categoryId` existe     |

---

## 💡 CONSEJOS PARA EVITAR ERRORES

### Antes de cada commit:

```bash
npm run build  # Siempre, sin excepción
npm run lint    # Verifica style issues
```

### Al copiar código del SEMANA-1-CODIGOS-LISTOS.md:

1. ✅ Copia línea por línea (no copy-paste entero)
2. ✅ Verifica imports al top del archivo
3. ✅ Verifica `'use client'` o no según corresponda
4. ✅ Compila inmediatamente: `npm run build`

### Estructura de componentes mínima:

```typescript
'use client'  // Solo si necesita interactividad

import { imports }

interface Props {
  // Types
}

export function Component({ props }: Props) {
  // Código
  return (
    // JSX
  )
}
```

---

## 🆘 CUANDO NADA FUNCIONA

**Nuclear option** (limpieza total):

```bash
# 1. Limpiar todo
rm -rf node_modules .next .turbo
rm package-lock.json

# 2. Reinstalar
npm install

# 3. Regenerar Prisma
npx prisma generate

# 4. Intentar build
npm run build

# Si sigue fallando, contacta con error completo:
npm run build 2>&1 | tee error-log.txt
```

---

**Última actualización**: 17 de Noviembre, 2025
**Estado**: Production Ready
