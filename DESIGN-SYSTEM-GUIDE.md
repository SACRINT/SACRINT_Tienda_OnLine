# Design System Guide - Tienda Online 2025

**Versión**: 1.0.0
**Sprint**: 7 - Semana 1
**Fecha**: 2025-11-19

---

## Paleta de Colores

### Colores Principales

| Color | Valor | Uso |
|-------|-------|-----|
| Primary (Azul Marino) | `#0A1128` | Textos principales, botones primarios, headers |
| Accent (Dorado) | `#D4AF37` | CTAs destacados, elementos interactivos, badges |
| Mint (Verde Menta) | `#8FBC8F` | Estados de éxito, confirmaciones, badges positivos |

### Colores de Estado

| Estado | Color | Uso |
|--------|-------|-----|
| Success | `#22c55e` | Confirmaciones, mensajes de éxito |
| Warning | `#f59e0b` | Alertas, advertencias |
| Error | `#ef4444` | Errores, mensajes críticos |
| Info | `#3b82f6` | Información, tooltips |

### Escala de Grises

```css
neutral-50:  #fafafa
neutral-100: #f5f5f5
neutral-200: #e5e5e5
neutral-300: #d4d4d4
neutral-400: #a3a3a3
neutral-500: #737373
neutral-600: #525252
neutral-700: #404040
neutral-800: #262626
neutral-900: #171717
```

---

## Tipografía

### Fuentes

- **Títulos**: Montserrat (weights: 400, 500, 600, 700)
- **Cuerpo**: Open Sans (weights: 400, 500, 600)

### Escala Tipográfica

```css
text-xs:   0.75rem  (12px)
text-sm:   0.875rem (14px)
text-base: 1rem     (16px)
text-lg:   1.125rem (18px)
text-xl:   1.25rem  (20px)
text-2xl:  1.5rem   (24px)
text-3xl:  1.875rem (30px)
text-4xl:  2.25rem  (36px)
```

---

## Componentes UI (40+)

### Componentes Base (Shadcn/ui)

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Accordion | `accordion.tsx` | Paneles expandibles |
| Alert | `alert.tsx` | Mensajes de alerta |
| Alert Dialog | `alert-dialog.tsx` | Diálogos de confirmación |
| Aspect Ratio | `aspect-ratio.tsx` | Contenedor con ratio fijo |
| Avatar | `avatar.tsx` | Imágenes de usuario |
| Badge | `badge.tsx` | Etiquetas y tags |
| Breadcrumb | `breadcrumb.tsx` | Navegación de migas de pan |
| Button | `button.tsx` | Botones con variantes |
| Card | `card.tsx` | Tarjetas contenedoras |
| Carousel | `carousel.tsx` | Carrusel de contenido |
| Checkbox | `checkbox.tsx` | Casillas de verificación |
| Collapsible | `collapsible.tsx` | Contenido colapsable |
| Dialog | `dialog.tsx` | Modales |
| Dropdown Menu | `dropdown-menu.tsx` | Menús desplegables |
| Form | `form.tsx` | Formularios con React Hook Form |
| Hover Card | `hover-card.tsx` | Tarjetas al hover |
| Input | `input.tsx` | Campos de entrada |
| Label | `label.tsx` | Etiquetas de formulario |
| Navigation Menu | `navigation-menu.tsx` | Menú de navegación |
| Popover | `popover.tsx` | Popovers |
| Progress | `progress.tsx` | Barras de progreso |
| Radio Group | `radio-group.tsx` | Grupos de radio |
| Scroll Area | `scroll-area.tsx` | Áreas scrollables |
| Select | `select.tsx` | Selectores |
| Separator | `separator.tsx` | Separadores |
| Sheet | `sheet.tsx` | Paneles laterales |
| Skeleton | `skeleton.tsx` | Estados de carga |
| Slider | `slider.tsx` | Sliders |
| Switch | `switch.tsx` | Toggles |
| Table | `table.tsx` | Tablas |
| Tabs | `tabs.tsx` | Pestañas |
| Textarea | `textarea.tsx` | Áreas de texto |
| Toast | `toast.tsx` | Notificaciones |
| Toaster | `toaster.tsx` | Contenedor de toasts |
| Tooltip | `tooltip.tsx` | Tooltips |

### Componentes E-commerce

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| Checkout Progress | `checkout-progress.tsx` | Barra de progreso del checkout |
| Color Selector | `color-selector.tsx` | Selector de colores de producto |
| Empty State | `empty-state.tsx` | Estados vacíos (carrito, búsqueda) |
| Loading | `loading.tsx` | Spinners y estados de carga |
| Price Range | `price-range.tsx` | Slider de rango de precios |
| Quantity Selector | `quantity-selector.tsx` | Selector de cantidad |
| Rating Stars | `rating-stars.tsx` | Estrellas de calificación |
| Size Selector | `size-selector.tsx` | Selector de tallas |
| Stats Card | `stats-card.tsx` | Tarjetas de estadísticas |

---

## Uso de Componentes

### Importación

```tsx
// Importar componentes individuales
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Importar desde índice (todos los componentes)
import { Button, Card, RatingStars, PriceRange } from '@/components/ui'
```

### Ejemplo: Botones

```tsx
import { Button } from '@/components/ui/button'

// Variantes
<Button>Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamaños
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

### Ejemplo: Rating Stars

```tsx
import { RatingStars } from '@/components/ui/rating-stars'

// Display only
<RatingStars rating={4.5} showValue />

// Interactive
<RatingStars
  rating={rating}
  interactive
  onRatingChange={setRating}
/>
```

### Ejemplo: Price Range

```tsx
import { PriceRange } from '@/components/ui/price-range'

<PriceRange
  min={0}
  max={10000}
  value={[100, 5000]}
  onValueChange={handleChange}
/>
```

### Ejemplo: Checkout Progress

```tsx
import { CheckoutProgress } from '@/components/ui/checkout-progress'

const steps = [
  { id: 'shipping', label: 'Envío' },
  { id: 'payment', label: 'Pago' },
  { id: 'review', label: 'Revisar' },
  { id: 'confirm', label: 'Confirmar' },
]

<CheckoutProgress steps={steps} currentStep={2} />
```

### Ejemplo: Toast Notifications

```tsx
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

// En layout.tsx
<Toaster />

// En componentes
const { toast } = useToast()

toast({
  title: 'Producto agregado',
  description: 'El producto fue agregado al carrito',
  variant: 'success',
})
```

---

## Espaciado

Usar la escala de Tailwind:

```css
spacing-1:  0.25rem (4px)
spacing-2:  0.5rem  (8px)
spacing-3:  0.75rem (12px)
spacing-4:  1rem    (16px)
spacing-6:  1.5rem  (24px)
spacing-8:  2rem    (32px)
spacing-12: 3rem    (48px)
spacing-16: 4rem    (64px)
```

---

## Sombras

```css
shadow-soft:   0 2px 15px -3px rgba(0, 0, 0, 0.07)
shadow-medium: 0 4px 25px -5px rgba(0, 0, 0, 0.1)
shadow-hard:   0 10px 40px -10px rgba(0, 0, 0, 0.15)

shadow-glow-primary: 0 0 20px rgba(10, 17, 40, 0.3)
shadow-glow-accent:  0 0 20px rgba(212, 175, 55, 0.3)
shadow-glow-mint:    0 0 20px rgba(143, 188, 143, 0.3)
```

---

## Animaciones

```css
animate-accordion-down: accordion-down 0.2s ease-out
animate-accordion-up:   accordion-up 0.2s ease-out
animate-fade-in:        fade-in 0.2s ease-out
animate-fade-out:       fade-out 0.2s ease-out
animate-slide-in-*:     slide-in-from-* 0.3s ease-out
animate-shimmer:        shimmer 2s infinite
animate-spin:           spin 1s linear infinite
animate-pulse:          pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite
```

---

## Responsive Design

### Breakpoints

```css
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */
```

### Mobile-First Approach

```tsx
// Siempre diseñar mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</div>
```

---

## Accesibilidad (a11y)

### Checklist

- [ ] Contraste de color mínimo 4.5:1
- [ ] Focus visible en todos los elementos interactivos
- [ ] Aria labels en iconos y botones sin texto
- [ ] Keyboard navigation funcional
- [ ] Skip links en el header
- [ ] Alt text en todas las imágenes

### Ejemplo

```tsx
<Button aria-label="Agregar al carrito">
  <ShoppingCart className="h-4 w-4" />
</Button>
```

---

## Dark Mode

El design system soporta dark mode usando la clase `.dark`:

```tsx
// En layout.tsx
<html className="dark">
  ...
</html>

// O con toggle
document.documentElement.classList.toggle('dark')
```

---

## Performance

### Optimizaciones

1. **Lazy loading de componentes**
```tsx
const ProductGallery = dynamic(() => import('@/components/shop/ProductGallery'), {
  loading: () => <Skeleton className="h-96" />
})
```

2. **Image optimization**
```tsx
import Image from 'next/image'

<Image
  src={product.image}
  alt={product.name}
  width={400}
  height={400}
  priority={isAboveFold}
/>
```

3. **Code splitting por ruta**
- Cada página es un chunk separado
- Componentes pesados con lazy loading

---

## Próximos Pasos (Semana 2-4)

- [ ] Homepage con Hero y categorías
- [ ] CategoryPage con filtros
- [ ] ProductDetailPage con galería
- [ ] CartPage y Checkout
- [ ] Storybook completo
- [ ] Tests de componentes

---

**Última actualización**: 2025-11-19
**Autor**: Arquitecto IA Autónomo
**Sprint**: 7 - Semana 1
