# 📋 INSTRUCCIONES SPRINT 2 - ARQUITECTO B

## Frontend: Products UI & Shopping

**Directora**: Sistema de instrucciones precisas
**Arquitecto**: B (Frontend - Implementación independiente)
**Sprint**: 2 - Products UI & Shopping
**Duración**: 4-5 días
**Rama**: `claude/frontend-sprint-2-products`

---

## 🎯 MISIÓN

Crear la experiencia completa de compra para el cliente final:

1. **Shop Layout** - Estructura base con header, sidebar, footer
2. **Listado de Productos** - Grid con filtros y paginación
3. **Detalle de Producto** - Vista completa con galería
4. **Carrito de Compras** - Persistencia en localStorage
5. **Página del Carrito** - Editar cantidades, revisar
6. **Checkout** - Flujo con Stripe Elements

---

## 📊 REQUISITOS TÉCNICOS

### Frontend Stack

- Next.js 14+ (App Router)
- React 18+ (Hooks)
- TypeScript strict mode
- Tailwind CSS para estilos
- shadcn/ui para componentes base
- zustand para estado (carrito)
- @stripe/react-stripe-js para pagos

### APIs Disponibles (Arquitecto A ya las implementó)

```
GET    /api/products?page=1&limit=20&category=slug&minPrice=0&maxPrice=1000
GET    /api/products/[id]
GET    /api/categories?format=tree
GET    /api/cart
POST   /api/cart
PATCH  /api/cart/items/[itemId]
DELETE /api/cart/items/[itemId]
POST   /api/checkout
GET    /api/orders
```

---

## 📁 ARCHIVOS A CREAR

### 1️⃣ src/lib/store/useCart.ts

**Propósito**: Zustand store para carrito

**Estado necesario**:

```
items: CartItem[] (array de items)
  - productId (string)
  - variantId (string | null, opcional)
  - quantity (number)
  - price (number - precio actual)
  - name (string)
  - image (string - URL)
  - sku (string)
```

**Acciones**:

1. `addItem(item)` - Agregar item o aumentar cantidad si existe
2. `removeItem(productId, variantId?)` - Eliminar item completamente
3. `updateQuantity(productId, variantId?, qty)` - Cambiar cantidad
4. `clear()` - Vaciar carrito

**Computed (getters)**:

1. `itemCount()` - Total de items (suma de quantities)
2. `subtotal()` - Suma de (price × quantity)
3. `tax()` - Subtotal × 0.16 (16%)
4. `shipping()` - $9.99 si subtotal < $100, sino $0
5. `total()` - subtotal + tax + shipping

**Persistencia**:

- Guardar en localStorage con nombre 'cart-storage'
- Hidratar correctamente en SSR (useEffect para hidratación)

**Comportamiento**:

- Si item ya existe (mismo productId + variantId): aumentar cantidad
- Si cantidad llega a 0: eliminar item automáticamente
- Redondear a 2 decimales en cálculos de dinero

---

### 2️⃣ src/app/(shop)/layout.tsx

**Propósito**: Layout principal de la tienda

**Estructura**:

- Header fijo en top
  - Logo con link a /shop
  - Buscador (Form con método GET a /shop/search)
  - Carrito con badge contador
  - Links: Productos, Ingresar/Mi Cuenta
  - Menu mobile (hamburguesa) en pantallas pequeñas

- Main content (grid 1 col | 4 cols desktop)
  - Sidebar (desktop solo)
    - Categorías
    - Filtro de precio (range slider)
    - Filtro de disponibilidad (checkbox)
  - Contenido principal (children)

- Footer
  - Links: Productos, Ayuda, Legal
  - Copyright

**Responsive**:

- Mobile: 1 columna, menu hamburguesa
- Tablet: 2 columnas, sidebar colapsable
- Desktop: 4 columnas, sidebar fijo

**Funcionalidades**:

- Badge en carrito muestra cantidad de items
- Links navegables (Next.js Link)
- Mobile menu toggle con estado local
- Sidebar sticky en desktop

---

### 3️⃣ src/app/(shop)/page.tsx

**Propósito**: Listado de productos con filtros

**Funcionalidades**:

1. Fetch de /api/products?page=page&limit=12&filters
2. Grid 2 cols (mobile) | 3 cols (tablet) | 4 cols (desktop)
3. Para cada producto:
   - Imagen con hover zoom
   - Badge "descuento %" si hay salePrice
   - Nombre (link a detalle)
   - Rating (estrellas) + contador de reseñas
   - Precio actual + precio tachado (si hay descuento)
   - Stock badge (Verde "En stock" o Rojo "Agotado")
   - Botón "Agregar" (deshabilitado si sin stock)

4. Paginación
   - Botones Anterior/Siguiente
   - Indicador "Página X"
   - Deshabilitado cuando no hay más productos

5. Estado
   - Loading skeleton mientras carga
   - Error message si falla API
   - Empty state si no hay productos

**Interactividad**:

- Click en "Agregar" → addItem al carrito con quantity 1
- Toast/notificación "Agregado al carrito"

---

### 4️⃣ src/app/(shop)/products/[id]/page.tsx

**Propósito**: Detalle completo del producto

**Secciones**:

1. **Breadcrumb**: Inicio > Productos > [Nombre]

2. **Galería de imágenes**
   - Imagen principal (aspect-square)
   - Botones anterior/siguiente (si hay múltiples)
   - Thumbnails en grid debajo
   - Click en thumbnail → cambiar principal

3. **Información del producto**
   - Título grande
   - Rating (estrellas) + "(X reseñas)"
   - Precio actual GRANDE + precio tachado (si hay desc)
   - Porcentaje de descuento en rojo (si aplica)
   - Descripción larga
   - Stock badge
   - SKU y Categoría

4. **Selector de cantidad**
   - Input número + botones -/+
   - Max = stock disponible
   - Botón "Agregar al carrito" (grande, azul)

5. **Reviews section** (básico)
   - Mostrar rating promedio
   - Link a ver todas las reseñas (opcional para Sprint 2)

**Fetch**:

- GET /api/products/[id]
- Usar useParams() para obtener ID

**Errores**:

- Si producto no existe: "Producto no encontrado"
- Si falla fetch: mostrar error

---

### 5️⃣ src/app/(shop)/cart/page.tsx

**Propósito**: Página del carrito

**Layout** (2 columnas desktop | 1 mobile):

- **Columna izquierda** (2/3):
  - Título "Carrito de Compras"
  - Tabla/lista de items
    - Imagen thumbnail
    - Nombre, SKU
    - Precio unitario
    - Selector cantidad (con -/+ botones)
    - Subtotal (price × qty)
    - Botón eliminar (icono trash)
  - Link "Continuar comprando" (← volver)

- **Columna derecha** (1/3) - Sticky en desktop:
  - Resumen de orden
    - Subtotal: $XXX
    - Impuesto (16%): $XXX
    - Envío: "Gratis" o "$X.XX"
    - **Total**: $XXX (grande, bold)
  - Botón "Ir al Checkout" (verde, grande, ancho completo)

**Comportamiento**:

- Si carrito vacío: mostrar mensaje + link "Continuar comprando"
- Actualizar totales en tiempo real al cambiar cantidades
- Click -: disminuir cantidad (si llega a 0, eliminar)
- Click +: aumentar cantidad
- Click trash: eliminar item con confirmación?

**Sincronización**:

- Leer de zustand store
- Acciones (remove, updateQuantity) actualizan store
- Store persiste en localStorage

---

### 6️⃣ src/app/(shop)/checkout/page.tsx

**Propósito**: Flujo de checkout con Stripe

**Estructura de pasos** (wizard):

**Paso 1: Dirección de Envío**

- Campos:
  - Nombre completo (required)
  - Dirección (required)
  - Ciudad (required)
  - Código postal (required)
  - País (default MX, editable)
  - Teléfono (required)
- Botones: "Siguiente" para ir a Paso 2

**Paso 2: Método de Pago**

- Mostrar Stripe CardElement
- Campos para datos de tarjeta (integrado en CardElement)
- Botones: "Atrás", "Revisar Orden"

**Paso 3: Revisión**

- Resumen de items del carrito
- Dirección de envío confirmada
- Resumen de montos (subtotal, tax, shipping, total)
- Botones: "Atrás", "Confirmar Pago $XXX"

**Flujo técnico**:

1. Usuario llena direccion (Paso 1)
2. Usuario ingresa tarjeta (Paso 2)
3. Usuario confirma (Paso 3)
4. Frontend POST /api/checkout
   - Body: { cartId, shippingAddressId, paymentMethod: 'STRIPE' }
   - Response: { clientSecret, paymentIntentId }
5. Frontend confirma pago con Stripe
   - `stripe.confirmCardPayment(clientSecret, {...})`
6. Si success: redirect a /shop/order-confirmation
7. Si error: mostrar error en Paso 2

**Seguridad**:

- Requiere autenticación (redirect a /login si no sesión)
- Validar cartId existe
- Validar shippingAddressId pertenece al usuario

**Estados**:

- Loading mientras procesa pago
- Error message si falla

---

## 🎨 DISEÑO & UX

### Paleta de colores

- Azul principal: `#0066CC` (links, botones primarios)
- Gris: `#6B7280` (textos secundarios)
- Verde: `#10B981` ("En stock", éxito)
- Rojo: `#EF4444` (descuentos, "Agotado", errores)
- Blanco: `#FFFFFF` (fondo)
- Gris claro: `#F3F4F6` (backgrounds secundarios)

### Tipografía

- Headings: Bold
- Body text: Regular
- Links: Underline on hover

### Spacing

- Usar Tailwind defaults (m-4, p-6, gap-4, etc.)
- Margin horizontal: max-w-7xl mx-auto
- Padding: px-4 sm:px-6 lg:px-8

### Imágenes

- Placeholder: /placeholder.jpg
- Lazy loading en grids
- Aspect ratio: square para thumbnails
- Object-fit: cover

---

## 🔐 SEGURIDAD

**Autenticación**:

- Checkout requiere sesión (useSession())
- Si no hay sesión: redirect a /login

**Validación de entrada**:

- Validar emails en checkout
- Validar teléfono (formato básico)
- No confiar en datos del cliente para precios

**Stripe**:

- Usar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (no secret)
- Nunca mandar token a tu backend directamente
- Usar clientSecret del backend
- Mantener conversión de centavos ↔ dólares correcta

---

## 📦 COMPONENTES REUTILIZABLES

Considera crear componentes para:

- ProductCard (usado en listado)
- ProductGallery (usado en detalle)
- PriceDisplay (mostrando precio + desc)
- StockBadge (verde/rojo)
- RatingStars (evaluación visual)
- QuantitySelector (-/+ buttons)
- CheckoutStep (para wizard)

---

## 📱 RESPONSIVIDAD

**Mobile First**:

- Diseñar para mobile primero
- Luego mejorar para tablet/desktop

**Breakpoints**:

- sm: 640px
- md: 768px
- lg: 1024px

**Ejemplos**:

- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Layout: `grid-cols-1 md:grid-cols-2`
- Sidebar: `hidden md:block`

---

## ✅ CHECKLIST DE FINALIZACIÓN

Antes de hacer commit:

- [ ] 6 archivos .tsx creados en rutas correctas
- [ ] src/lib/store/useCart.ts implementado con Zustand
- [ ] Todos los componentes renderan sin errores
- [ ] Responsive en mobile (375px), tablet (768px), desktop (1024px)
- [ ] Zustand persiste en localStorage
- [ ] APIs se llaman correctamente
- [ ] Loading y error states implementados
- [ ] Stripe CardElement integrado en checkout
- [ ] AuthSession guard en checkout
- [ ] Todos los links navegan correctamente
- [ ] Buttons tienen disabled states cuando aplique
- [ ] Estilos Tailwind aplicados (sin CSS customizado innecesario)
- [ ] npm run build PASA ✅
- [ ] npm run lint PASA ✅
- [ ] Sin console.log en producción

---

## 🚀 PASOS FINALES

1. Crea rama: `git checkout -b claude/frontend-sprint-2-products`
2. Implementa todo según especificaciones
3. Verifica compilación: `npm run build`
4. Commit: `git add . && git commit -m "feat: Implement Products UI & Shopping - Sprint 2"`
5. Push: `git push origin claude/frontend-sprint-2-products`
6. Notifica cuando termines para code review

---

## 🎯 NOTAS IMPORTANTES

**DEBES HACER**:

- ✅ Componentes funcionales con hooks
- ✅ TypeScript con tipos explícitos
- ✅ Manejo de errores (try/catch)
- ✅ Estados de carga (loading, error, empty)
- ✅ Responsivo móvil-first
- ✅ Zustand correctamente configurado
- ✅ Validaciones básicas en inputs

**NO DEBES HACER**:

- ❌ Componentes de clase (solo funcionales)
- ❌ CSS-in-JS (solo Tailwind)
- ❌ Hardcodear URLs de API
- ❌ Confiar en datos del cliente para precios
- ❌ Deixar console.log en código final
- ❌ Hacer commit sin pasar npm run build

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Cómo llamo la API?**
R: Usa `fetch('/api/products')` en useEffect. Captura errores con try/catch.

**P: ¿Zustand con localStorage?**
R: Usa middleware `persist` de zustand. Maneja hidratación con useEffect.

**P: ¿Cómo valido un email?**
R: Usa librería `zod` en el frontend también. O simple regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**P: ¿Qué es SSR y por qué importa?**
R: Next.js renderiza en server. Por eso localStorage falla sin useEffect. Siempre hidrata en cliente.

**P: ¿Cómo manejo sesión?**
R: Usa `useSession()` de next-auth. Si status='unauthenticated', redirect a /login.
