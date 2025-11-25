# Plan de Auditoría Lighthouse - Semana 8

## Optimización de Performance para 5 Páginas Clave

**Fecha**: 25 Noviembre 2025
**Responsable**: Frontend Performance Team
**Objetivo**: Validar que todas las páginas cumplen con targets de performance
**ETA**: 3 horas (audits + optimizaciones si es necesario)
**Prioridad**: 🔴 CRÍTICA

---

## 🎯 TARGETS DE ÉXITO

| Métrica                            | Target | Mínimo Aceptable |
| ---------------------------------- | ------ | ---------------- |
| **Performance**                    | > 90   | ≥ 85             |
| **Accessibility**                  | > 90   | ≥ 85             |
| **Best Practices**                 | > 90   | ≥ 85             |
| **SEO**                            | > 90   | ≥ 85             |
| **LCP (Largest Contentful Paint)** | < 2.5s | ≤ 2.5s           |
| **FCP (First Contentful Paint)**   | < 1.5s | ≤ 1.5s           |
| **CLS (Cumulative Layout Shift)**  | < 0.1  | ≤ 0.1            |

---

## 📄 PÁGINA 1: HOMEPAGE (`/`)

### 1.1 Ejecutar Audit

**Pasos**:

```bash
# Opción A: Con DevTools de Chrome
1. Abre https://localhost:3000/ (o tu dominio)
2. DevTools → Lighthouse
3. Selecciona:
   - Device: Desktop
   - Categories: ✓Performance ✓Accessibility ✓Best Practices ✓SEO
   - Throttling: Slow 4G + 4x CPU slowdown (simulación realista)
4. Haz clic en "Analyze page load"
5. Espera 1-2 minutos

# Opción B: Con npm command
npm install -g @lhci/cli@latest
lhci autorun --config=lighthouserc.json
```

### 1.2 Resultados Esperados - Homepage

| Métrica        | Actual | Target |
| -------------- | ------ | ------ |
| Performance    | ?      | 90+    |
| Accessibility  | ?      | 90+    |
| Best Practices | ?      | 90+    |
| SEO            | ?      | 90+    |
| LCP            | ?      | <2.5s  |
| FCP            | ?      | <1.5s  |
| CLS            | ?      | <0.1   |

### 1.3 Áreas Típicas de Mejora en Homepage

**Si Performance < 85**, revisar:

- [ ] Imágenes optimizadas (uso de WebP, lazy loading)
- [ ] Bundle size (18F del CSS/JS)
- [ ] Critical rendering path (eliminar render-blocking resources)
- [ ] Fonts no utilizados
- [ ] Third-party scripts (Google Analytics, etc.)

**Si Accessibility < 85**, revisar:

- [ ] Alt text en imágenes
- [ ] Contrast ratio del texto
- [ ] Heading hierarchy (h1, h2, h3 en orden)
- [ ] ARIA labels si es necesario
- [ ] Navegación con teclado

**Si SEO < 85**, revisar:

- [ ] Meta title (única y descriptiva)
- [ ] Meta description
- [ ] H1 presentes
- [ ] Robots.txt y sitemap.xml
- [ ] Mobile-friendly (viewport meta tag)

---

## 🛍️ PÁGINA 2: SHOP (`/shop`)

### 2.1 Ejecutar Audit

```
Repite mismo procedimiento que Página 1
URL: https://localhost:3000/shop
```

### 2.2 Resultados Esperados - Shop

| Métrica        | Actual | Target |
| -------------- | ------ | ------ |
| Performance    | ?      | 90+    |
| Accessibility  | ?      | 90+    |
| Best Practices | ?      | 90+    |
| SEO            | ?      | 90+    |
| LCP            | ?      | <2.5s  |
| FCP            | ?      | <1.5s  |
| CLS            | ?      | <0.1   |

### 2.3 Áreas Típicas de Mejora en Shop

**Si Performance < 85**, revisar:

- [ ] Cantidad de productos en viewport (prueba pagination/virtual scrolling)
- [ ] Product card images (lazy load)
- [ ] Filtros/búsqueda (debouncing)
- [ ] Loading states
- [ ] Bundle size

**Si Accessibility < 85**, revisar:

- [ ] Product cards accesibles con teclado
- [ ] Alt text en imágenes de productos
- [ ] Filtros navegables con teclado
- [ ] Live regions para actualizaciones dinámicas

---

## 📦 PÁGINA 3: PRODUCT DETAIL (`/shop/producto/[slug]`)

### 3.1 Ejecutar Audit

```
URL: https://localhost:3000/shop/producto/[cualquier-slug]
Ejemplo: /shop/producto/test-product-1
```

### 3.2 Resultados Esperados - Product Detail

| Métrica        | Actual | Target |
| -------------- | ------ | ------ |
| Performance    | ?      | 90+    |
| Accessibility  | ?      | 90+    |
| Best Practices | ?      | 90+    |
| SEO            | ?      | 90+    |
| LCP            | ?      | <2.5s  |
| FCP            | ?      | <1.5s  |
| CLS            | ?      | <0.1   |

### 3.3 Áreas Típicas de Mejora en Product Detail

**Si Performance < 85**, revisar:

- [ ] Galería de imágenes (lazy load, preload LCP image)
- [ ] Zoom functionality (no debería cargar imagen full size)
- [ ] Reviews section (paginated, lazy load)
- [ ] Related products (carrusel, lazy load)

**Si CLS > 0.1**, revisar:

- [ ] Image placeholders (mantener aspect ratio)
- [ ] Dynamic content (reviews, ratings) aparece sin shift
- [ ] Add to cart button position (no se mueve)

---

## 🛒 PÁGINA 4: CARRITO (`/cart`)

### 4.1 Ejecutar Audit

```
Precondición: Agrega algunos productos al carrito primero
URL: https://localhost:3000/cart
```

### 4.2 Resultados Esperados - Cart

| Métrica        | Actual | Target |
| -------------- | ------ | ------ |
| Performance    | ?      | 90+    |
| Accessibility  | ?      | 90+    |
| Best Practices | ?      | 90+    |
| SEO            | ?      | 90+    |
| LCP            | ?      | <2.5s  |
| FCP            | ?      | <1.5s  |
| CLS            | ?      | <0.1   |

### 4.3 Áreas Típicas de Mejora en Cart

**Si Performance < 85**, revisar:

- [ ] Cantidad de items renderizados (virtualization si hay muchos)
- [ ] Update quantity debouncing
- [ ] Stripe checkout button loading

**Si Accessibility < 85**, revisar:

- [ ] Quantity inputs accesibles con teclado
- [ ] Remove button tiene label clara
- [ ] Toast notifications anunciadas
- [ ] Totals actualizado anunciado a screen readers

---

## 💳 PÁGINA 5: CHECKOUT (`/checkout`)

### 5.1 Ejecutar Audit

```
Precondición: Carrito no vacío
URL: https://localhost:3000/checkout
```

### 5.2 Resultados Esperados - Checkout

| Métrica        | Actual | Target |
| -------------- | ------ | ------ |
| Performance    | ?      | 90+    |
| Accessibility  | ?      | 90+    |
| Best Practices | ?      | 90+    |
| SEO            | ?      | 90+    |
| LCP            | ?      | <2.5s  |
| FCP            | ?      | <1.5s  |
| CLS            | ?      | <0.1   |

### 5.3 Áreas Típicas de Mejora en Checkout

**Si Performance < 85**, revisar:

- [ ] Stripe.js loading (async script tag)
- [ ] Form validation debouncing
- [ ] Step transitions smooth (sin re-render innecesarios)

**Si Accessibility < 85**, revisar:

- [ ] Campos de formulario tienen labels
- [ ] Error messages asociados a campos
- [ ] Step indicator tiene ARIA
- [ ] Form submit button tiene estado (disabled durante processing)

**Si Best Practices < 85**, revisar:

- [ ] Stripe webhook handling (no envía datos sensibles)
- [ ] HTTPS (todas las transacciones)
- [ ] CSP headers correctos

---

## 🔧 OPTIMIZACIONES COMUNES

### Si Performance < 85

#### A. Image Optimization

```typescript
// ✅ CORRECTO: Next.js Image con lazy loading
import Image from 'next/image'

<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  height={400}
  loading="lazy"  // ← Lazy load excepto LCP image
  priority={isLCP} // ← Preload si es Largest Contentful Paint
  quality={75}
  placeholder="blur"
  blurDataURL={base64}
/>

// ❌ INCORRECTO: img tag sin optimización
<img src="/product.jpg" alt="Product" />
```

#### B. Bundle Size Reduction

```bash
# Analizar bundle
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer

# Verificar imports innecesarios
# - ¿Se puede usar tree-shaking?
# - ¿Hay dependencias duplicadas?
# - ¿Se puede usar dynamic imports?
```

#### C. Font Optimization

```html
<!-- Preload critical fonts -->
<link rel="preload" as="font" href="/font.woff2" type="font/woff2" crossorigin />

<!-- system-ui fallback -->
<style>
  body {
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
</style>
```

#### D. Script Optimization

```html
<!-- Critical scripts inline -->
<script>
  // Inline critical JS
</script>

<!-- Non-critical scripts async/defer -->
<script src="/analytics.js" async></script>
<script src="/tracking.js" defer></script>

<!-- Third-party con facade pattern -->
<button onclick="loadThirdParty()">Load Reviews</button>
```

---

## 📊 REGISTRO DE RESULTADOS

### Audit 1: Homepage

```
Performance: __/100
Accessibility: __/100
Best Practices: __/100
SEO: __/100
LCP: ____ms
FCP: ____ms
CLS: ____
Status: ☐ PASADO ☐ REQUIERE FIXES
```

### Audit 2: Shop

```
Performance: __/100
Accessibility: __/100
Best Practices: __/100
SEO: __/100
LCP: ____ms
FCP: ____ms
CLS: ____
Status: ☐ PASADO ☐ REQUIERE FIXES
```

### Audit 3: Product Detail

```
Performance: __/100
Accessibility: __/100
Best Practices: __/100
SEO: __/100
LCP: ____ms
FCP: ____ms
CLS: ____
Status: ☐ PASADO ☐ REQUIERE FIXES
```

### Audit 4: Cart

```
Performance: __/100
Accessibility: __/100
Best Practices: __/100
SEO: __/100
LCP: ____ms
FCP: ____ms
CLS: ____
Status: ☐ PASADO ☐ REQUIERE FIXES
```

### Audit 5: Checkout

```
Performance: __/100
Accessibility: __/100
Best Practices: __/100
SEO: __/100
LCP: ____ms
FCP: ____ms
CLS: ____
Status: ☐ PASADO ☐ REQUIERE FIXES
```

---

## ⚠️ SI ALGUNA PÁGINA < 85

### Acción Requerida:

1. ✓ Documentar qué métrica falla
2. ✓ Revisar "Opportunities" en Lighthouse report
3. ✓ Implementar fix más impactante primero
4. ✓ Re-audit para confirmar mejora
5. ✓ Repetir hasta llegar a 85+

### Prioridad de Fixes (en orden de impacto):

1. Eliminar render-blocking resources
2. Optimizar imágenes (LCP image)
3. Code splitting / lazy loading
4. Minify CSS/JS
5. Enable compression (gzip/brotli)

---

## ✅ CHECKLIST DE ACEPTACIÓN

```
PÁGINA 1 - HOMEPAGE
[ ] Performance ≥ 85
[ ] Accessibility ≥ 85
[ ] Best Practices ≥ 85
[ ] SEO ≥ 85

PÁGINA 2 - SHOP
[ ] Performance ≥ 85
[ ] Accessibility ≥ 85
[ ] Best Practices ≥ 85
[ ] SEO ≥ 85

PÁGINA 3 - PRODUCT DETAIL
[ ] Performance ≥ 85
[ ] Accessibility ≥ 85
[ ] Best Practices ≥ 85
[ ] SEO ≥ 85

PÁGINA 4 - CART
[ ] Performance ≥ 85
[ ] Accessibility ≥ 85
[ ] Best Practices ≥ 85
[ ] SEO ≥ 85

PÁGINA 5 - CHECKOUT
[ ] Performance ≥ 85
[ ] Accessibility ≥ 85
[ ] Best Practices ≥ 85
[ ] SEO ≥ 85

MÉTRICAS WEB VITALS:
[ ] LCP < 2.5s (todas las páginas)
[ ] FCP < 1.5s (todas las páginas)
[ ] CLS < 0.1 (todas las páginas)
```

---

## 👤 SIGNOFF

**Auditado por**: ******\_\_\_\_******
**Fecha**: ******\_\_\_\_******
**Resultado General**: ☐ PASADO ☐ FALLIDO (especificar cuál)
**Próximos pasos**: ******\_\_\_\_******

---

## 📌 NOTAS ADICIONALES

```
[Espacio para notas, problemas encontrados, etc.]
```

---

**IMPORTANTE**: Si alguna página no llega a 85, crear **ISSUE de optimización** antes de proceder con Task 1.3 (Security Validation)
