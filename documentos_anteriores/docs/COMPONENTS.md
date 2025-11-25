# Component Catalog

## Overview

All components follow the design system colors and use Tailwind CSS with shadcn/ui primitives.

## Design System Colors

```css
--primary: #0a1128 /* Navy blue - main brand */ --accent: #d4af37 /* Gold - highlights */
  --mint: #8fbc8f /* Mint green - secondary */ --success: #10b981 /* Green - success states */
  --warning: #f59e0b /* Orange - warnings */ --error: #ef4444 /* Red - errors */;
```

---

## UI Components

### Product Components

#### ProductCard

Product grid item with image, pricing, and actions.

```tsx
import { ProductCard } from "@/components/product/ProductCard";

<ProductCard
  product={{
    id: "1",
    name: "Producto",
    price: 299.99,
    image: "/product.jpg",
  }}
  showQuickView={true}
  showWishlist={true}
/>;
```

#### ProductGallery

Image gallery with thumbnails and zoom.

```tsx
import { ProductGallery } from "@/components/product/ProductGallery";

<ProductGallery images={["/img1.jpg", "/img2.jpg"]} productName="Producto" />;
```

---

### Checkout Components

#### ShippingCalculator

Calculate shipping rates by postal code.

```tsx
import { ShippingCalculator } from "@/components/shipping/ShippingCalculator";

<ShippingCalculator cartTotal={500} onRateSelect={(rate) => setShippingRate(rate)} />;
```

#### ShippingTracker

Track order shipment status.

```tsx
import { ShippingTracker } from "@/components/shipping/ShippingTracker";

<ShippingTracker trackingNumber="EST1234567890" carrier="estafeta" events={trackingEvents} />;
```

#### PaymentForm

Multi-method payment form.

```tsx
import { PaymentForm } from "@/components/checkout/PaymentForm";

<PaymentForm amount={599.98} onPaymentComplete={(result) => handleComplete(result)} />;
```

**Supported methods:** Card, MercadoPago, OXXO, Bank Transfer

---

### Marketing Components

#### NewsletterForm

Newsletter subscription form with variants.

```tsx
import { NewsletterForm } from "@/components/marketing/NewsletterForm";

// Variants: inline, card, footer
<NewsletterForm
  variant="card"
  title="Suscríbete"
  onSubscribe={async (email) => await subscribe(email)}
/>;
```

#### SocialShare

Social media sharing popover.

```tsx
import { SocialShare } from "@/components/marketing/SocialShare";

<SocialShare
  url="https://sacrint.com/producto/1"
  title="Producto Increíble"
  image="/product.jpg"
/>;
```

#### PromoBanner

Promotional announcement banner.

```tsx
import { PromoBanner, CountdownBanner, FlashSaleBanner } from '@/components/marketing/PromoBanner'

<PromoBanner
  title="¡20% de descuento!"
  description="En toda la tienda"
  ctaLink="/ofertas"
  variant="accent"
/>

<CountdownBanner
  title="Oferta termina en:"
  endDate={new Date('2025-12-31')}
/>

<FlashSaleBanner
  discount={50}
  productCount={100}
/>
```

#### CountdownTimer

Countdown timer with variants.

```tsx
import { CountdownTimer } from "@/components/marketing/CountdownTimer";

// Variants: default, compact, card, inline
<CountdownTimer endDate={new Date("2025-12-31")} title="Oferta termina en:" variant="card" />;
```

---

### Wishlist Components

#### WishlistButton

Add to wishlist button.

```tsx
import { WishlistButton } from "@/components/wishlist/WishlistButton";

// Variants: icon, button, text
<WishlistButton
  product={{
    productId: "1",
    name: "Producto",
    price: 299.99,
  }}
  variant="icon"
/>;
```

#### WishlistIndicator

Header wishlist counter.

```tsx
import { WishlistIndicator } from "@/components/wishlist/WishlistIndicator";

<WishlistIndicator />;
```

---

### Coupon Components

#### CouponInput

Coupon code input with validation.

```tsx
import { CouponInput } from "@/components/coupons/CouponInput";

<CouponInput
  onApply={(result) => {
    if (result.valid) {
      setDiscount(result.discount);
    }
  }}
/>;
```

#### CouponBadge

Display applied coupon details.

```tsx
import { CouponBadge, CouponTag, CouponApplied } from '@/components/coupons/CouponBadge'

<CouponBadge
  code="DESCUENTO10"
  type="percentage"
  value={10}
/>

<CouponApplied
  code="DESCUENTO10"
  discount={50}
  onRemove={() => removeCoupon()}
/>
```

---

### Notification Components

#### NotificationCenter

Notification dropdown with management.

```tsx
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

<NotificationCenter />;
```

#### Toast

Toast notifications.

```tsx
import { ToastProvider, useToast } from "@/components/notifications/Toast";

// Wrap app
<ToastProvider>
  <App />
</ToastProvider>;

// Use in components
function MyComponent() {
  const { success, error, warning, info } = useToast();

  return <button onClick={() => success("¡Guardado!")}>Guardar</button>;
}
```

#### NotificationPreferences

Notification settings panel.

```tsx
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";

<NotificationPreferences />;
```

---

### Analytics Components

#### SalesChart

Sales over time visualization.

```tsx
import { SalesChart } from "@/components/analytics/SalesChart";

<SalesChart data={salesData} />;
```

#### ConversionFunnel

Conversion funnel visualization.

```tsx
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";

<ConversionFunnel data={funnelData} />;
```

#### TopProducts

Best selling products list.

```tsx
import { TopProducts } from "@/components/analytics/TopProducts";

<TopProducts products={topProducts} />;
```

---

### Image Components

#### OptimizedImage

Next.js Image with loading states.

```tsx
import { OptimizedImage, ProductImage, AvatarImage } from '@/components/image/OptimizedImage'

<OptimizedImage
  src="/image.jpg"
  alt="Description"
  width={400}
  height={400}
/>

<ProductImage
  src="/product.jpg"
  alt="Product"
  fill
/>

<AvatarImage
  src="/avatar.jpg"
  name="Juan Pérez"
  size={48}
/>
```

#### ImageGallery

Image gallery with lightbox.

```tsx
import { ImageGallery } from "@/components/image/ImageGallery";

<ImageGallery
  images={[
    { src: "/img1.jpg", alt: "Image 1" },
    { src: "/img2.jpg", alt: "Image 2" },
  ]}
/>;
```

---

### SEO Components

#### Breadcrumbs

Navigation breadcrumbs with Schema.org.

```tsx
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

<Breadcrumbs
  items={[
    { label: "Categoría", href: "/categoria" },
    { label: "Producto", href: "/producto" },
  ]}
/>;
```

#### JsonLd

Structured data injection.

```tsx
import { JsonLd } from "@/components/seo/JsonLd";
import { generateProductSchema } from "@/lib/seo/structured-data";

<JsonLd data={generateProductSchema(product)} />;
```

---

### Performance Components

#### LoadingSkeletons

Loading placeholder skeletons.

```tsx
import {
  ProductCardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  PageLoadingSkeleton
} from '@/components/performance/LoadingSkeletons'

<ProductCardSkeleton />
<TableSkeleton rows={5} columns={4} />
```

#### ErrorBoundary

Error boundary with retry.

```tsx
import { ErrorBoundary, ErrorDisplay } from '@/components/performance/ErrorBoundary'

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Inline error display
<ErrorDisplay
  error="Something went wrong"
  onRetry={() => refetch()}
/>
```
