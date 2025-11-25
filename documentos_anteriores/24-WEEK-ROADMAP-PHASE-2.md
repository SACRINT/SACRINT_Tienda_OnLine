# 🚀 ROADMAP 24 SEMANAS - PHASE 2 (Post-MVP)

## Tienda Digital E-commerce SaaS

**Versión**: 2.0.0 (Post-MVP - Crecimiento & Escalabilidad)
**Fecha**: 17 de Noviembre, 2025
**Duración**: 24 semanas (6 meses)
**Equipo**: 1 Arquitecto (Frontend + Backend dividido)
**Horas Estimadas**: 480 horas (20h/semana)

---

## 📊 CONTEXTO - DÓNDE ESTAMOS

### Estado Actual (17 Nov 2025)

```
✅ MVP Completado: 240 horas (4 semanas extra)
✅ Backend: 100% (50+ endpoints)
✅ Frontend Dashboard: 100% (8 páginas admin)
✅ Testing: 70% coverage
✅ DevOps: 3 workflows CI/CD
✅ Documentación: 5,000+ líneas
⏳ Producción: LISTO PARA LANZAR

Status: PHASE 1 COMPLETA - INICIANDO PHASE 2
```

### Decisión de Arquitectura para Phase 2

**Recomendación**: **70% Frontend + 30% Backend** (especialización flexible)

**Razón**:

- El MVP carece de frontend customer-facing completo
- Queremos maximizar la experiencia de usuario (conversión)
- El backend está bien estructurado y puede crecer gradualmente
- Frontend tendrá más complejidad: personalizaciones, UX, diseño

---

## 🎯 OBJETIVOS PHASE 2

### Objetivo Principal

Convertir el MVP en un **producto market-ready** con:

- ✅ Frontend customer-facing completo (shop, account, checkout)
- ✅ Experiencia mobile-first optimizada
- ✅ Características de crecimiento (wishlists, reviews, recomendaciones)
- ✅ Herramientas avanzadas para sellers (analytics, email, marketing)
- ✅ Escalabilidad: 10x usuarios sin degradación

### Métricas de Éxito

```
Performance:
- Lighthouse: 95+
- FCP: < 1.0s
- LCP: < 2.0s
- CLS: < 0.1

Funcionalidad:
- 25+ páginas frontend
- 40+ componentes reutilizables
- 75+ endpoints API
- 80%+ test coverage

Usuario:
- Checkout: < 3 minutos
- Búsqueda: < 500ms
- Mobile: 100% responsive
```

---

## 📅 DESGLOSE POR TRIMESTRE

### TRIMESTRE 1: Experiencia Cliente & Core Features (Semanas 1-8)

**Objetivo**: Completar todo el frontend customer-facing
**Horas**: 160h (20h/semana)
**Deliverables**: 10+ páginas frontend nuevas, 20+ componentes

#### Semana 1-2: Shop Frontend Completo (40h)

**Frontend (28h) | Backend (12h)**

##### Frontend - Shop UI

- [ ] Shop homepage (hero, featured products, categories)
- [ ] Product listing page (con filters, search, sorting)
- [ ] Product detail page (con galería, reviews, related products)
- [ ] Category pages (con infinite scroll)
- [ ] Search results page (con autocomplete)
- [ ] Breadcrumbs & navigation
- [ ] Responsive mobile menu

**Componentes nuevos**:

```typescript
- <ShopHero /> - Hero section with CTA
- <ProductCard /> - Product preview card
- <ProductGallery /> - Image carousel
- <FilterSidebar /> - Advanced filters
- <ProductReviews /> - Reviews section
- <RelatedProducts /> - Similar products carousel
- <SearchAutocomplete /> - Real-time search
```

**Tareas específicas**:

```
Shop/page.tsx (240 líneas)
├─ Hero section con CTA "Shop Now"
├─ Featured products (6-8 items)
├─ Categories grid
├─ Newsletter signup
└─ Footer completo

shop/products/[id]/page.tsx (300 líneas)
├─ Galería de imágenes (Vercel Blob)
├─ Product specs table
├─ Reviews section (paginated)
├─ Related products sidebar
├─ Add to cart button
└─ Size/color selectors

components/shop/ShopFilters.tsx (200 líneas)
├─ Price range slider
├─ Category checkboxes
├─ Rating filter
├─ Availability toggle
└─ Apply/reset buttons
```

**Backend - API Enhancements**

- [ ] GET /api/products/search (autocomplete)
- [ ] GET /api/products/:id/related (recomendaciones)
- [ ] GET /api/products/:id/reviews (reviews paginadas)
- [ ] POST /api/reviews (crear review)
- [ ] GET /api/categories/hierarchy (categorías anidadas)

**Base de datos**:

```prisma
// Índices necesarios
- Product(tenantId, published, category)
- Review(productId, rating, createdAt)
- Category(parentId, name)
```

**Estimado de PR**: 1,500 líneas frontend + 400 líneas backend

---

#### Semana 3-4: User Account & Profile (40h)

**Frontend (28h) | Backend (12h)**

##### Frontend - Account Pages

- [ ] Login page (si no existe, validar)
- [ ] Signup page (con email confirmation)
- [ ] Dashboard usuario (overview de órdenes)
- [ ] Account settings (perfil, email, password)
- [ ] Address management (agregar/editar/eliminar)
- [ ] Wishlist page
- [ ] Order history (con detalles)
- [ ] Return/refund management

**Componentes nuevos**:

```typescript
- <AccountLayout /> - Sidebar navigation
- <ProfileForm /> - Edit user profile
- <AddressManager /> - CRUD addresses
- <OrderCard /> - Order summary
- <WishlistItem /> - Wishlist product
- <ReviewForm /> - Submit product review
- <RefundRequest /> - Request return form
```

**Tareas específicas**:

```
app/(customer)/account/page.tsx (150 líneas)
├─ Recent orders (3-5 últimas)
├─ Wishlist preview (3-5 items)
├─ Quick actions (manage addresses, etc)
└─ Account health summary

app/(customer)/account/orders/page.tsx (200 líneas)
├─ Orders list con pagination
├─ Filter por status, fecha
├─ Order detail modal
└─ Download invoice button

app/(customer)/account/wishlist/page.tsx (180 líneas)
├─ Wishlist items grid
├─ Move to cart button
├─ Remove from wishlist
└─ Share wishlist link

components/account/AddressManager.tsx (250 líneas)
├─ List addresses
├─ Add new address modal
├─ Edit address modal
├─ Set default address
└─ Delete address (confirm dialog)
```

**Backend - API Endpoints**

- [ ] GET/POST /api/users/wishlist
- [ ] DELETE /api/users/wishlist/:id
- [ ] GET/POST /api/users/reviews
- [ ] GET /api/users/orders (con filters)
- [ ] POST /api/orders/:id/return
- [ ] GET /api/users/invoices/:id (PDF)

**Estimado de PR**: 1,200 líneas frontend + 350 líneas backend

---

#### Semana 5-6: Checkout & Payment Flow (40h)

**Frontend (32h) | Backend (8h)**

##### Frontend - Checkout UX

- [ ] Cart page (si no existe, optimizar)
- [ ] Checkout wizard (4 pasos)
  - Step 1: Shipping address
  - Step 2: Shipping method
  - Step 3: Payment method
  - Step 4: Order review
- [ ] Payment confirmation page
- [ ] Order success page
- [ ] Estimated delivery UI
- [ ] Promo code input

**Componentes nuevos**:

```typescript
- <CheckoutWizard /> - Multi-step form
- <AddressSelector /> - Select/add address
- <ShippingMethod /> - Shipping options
- <PaymentForm /> - Stripe Elements wrapper
- <OrderSummary /> - Order review
- <ConfirmationEmail /> - Email template
```

**Tareas específicas**:

```
app/(customer)/checkout/page.tsx (250 líneas)
├─ Wizard state management (Zustand)
├─ Step transitions
├─ Form validation (Zod)
├─ Error handling
└─ Auto-save to localStorage

checkout/AddressStep.tsx (200 líneas)
├─ Display saved addresses
├─ Add new address form
├─ Set as default option
└─ Phone number validation

checkout/PaymentStep.tsx (180 líneas)
├─ Stripe Elements integration
├─ Card input (hosted by Stripe)
├─ Billing address form
├─ Save card checkbox
└─ Security badges

checkout/ReviewStep.tsx (150 líneas)
├─ Order summary
├─ Product list con precios
├─ Shipping cost
├─ Tax calculation
├─ Total with coupon discount
```

**Backend - Optimizaciones**

- [ ] Mejorar POST /api/checkout (validación de stock)
- [ ] Agregar cálculo de tax por ubicación
- [ ] Mejorar cálculo de shipping (por peso/zona)
- [ ] Validar coupon antes de checkout

**Estimado de PR**: 1,000 líneas frontend + 250 líneas backend

---

#### Semana 7-8: Mobile Optimization & Responsive Design (40h)

**Frontend (35h) | Backend (5h)**

##### Objetivos Móviles

- [ ] Responsive design todas las páginas
- [ ] Touch-friendly buttons (48px min)
- [ ] Mobile menu + navigation
- [ ] Optimizar imágenes para mobile
- [ ] Lighthouse 95+ mobile
- [ ] Performance: FCP < 1.5s en 4G

**Tareas específicas**:

```
Auditoría completa:
├─ Viewport meta tags
├─ Font sizes (16px+ en inputs)
├─ Button sizes (48x48px)
├─ Margin/padding mobile
├─ Image responsive (<picture> o next/image)
├─ CSS media queries completas
└─ Touch states (hover → focus)

Performance mobile:
├─ Dynamic imports para components pesados
├─ Image optimization con next/image
├─ Code splitting por rutas
├─ Lazy load below-the-fold
├─ Service worker / PWA basics
└─ Minify CSS/JS

Testing mobile:
├─ Chrome DevTools mobile (iPhone 12, Pixel 5)
├─ Lighthouse audit (mobile)
├─ VT Debugger (visual regression)
├─ Touch testing (hover, swipe, long-press)
└─ Orientation changes
```

**Backend - Performance**

- [ ] Database query optimization (query analysis)
- [ ] Redis caching para productos hot
- [ ] API response compression (gzip)
- [ ] CDN headers optimizados

**Estimado de PR**: 800 líneas (refactoring existente) + 200 líneas backend

---

### TRIMESTRE 2: Seller Tools & Advanced Features (Semanas 9-16)

**Objetivo**: Herramientas pro para vendedores + features de retención
**Horas**: 160h (20h/semana)
**Deliverables**: 8+ páginas admin nuevas, marketing features

#### Semana 9-10: Advanced Analytics & Reporting (40h)

**Frontend (28h) | Backend (12h)**

##### Frontend - Dashboard Avanzado

- [ ] Revenue dashboard (gráficos revenue vs tiempo)
- [ ] Product performance (top sellers, flops)
- [ ] Customer analytics (lifetime value, retention)
- [ ] Orders analytics (status breakdown, AOV)
- [ ] Traffic analytics (Vercel Analytics)
- [ ] Custom date range picker
- [ ] Export reports (CSV, PDF)

**Componentes nuevos**:

```typescript
- <RevenueChart /> - Line chart (recharts)
- <ProductPerformance /> - Table with trends
- <CustomerMetrics /> - Cards con KPIs
- <DateRangePicker /> - Date selection
- <ExportButton /> - CSV/PDF export
- <TrendIndicator /> - Up/down arrows with %
```

**Tareas específicas**:

```
dashboard/analytics/revenue/page.tsx (200 líneas)
├─ Revenue by date (line chart)
├─ Compare periods
├─ Filter by product/category
├─ Cumulative revenue
└─ Forecast (simple trend)

dashboard/analytics/customers/page.tsx (180 líneas)
├─ Customer count
├─ Repeat customer %
├─ Lifetime value
├─ Churn rate
├─ Top customers list
└─ Cohort analysis (básico)

dashboard/analytics/reports/page.tsx (150 líneas)
├─ Predefined reports (monthly, quarterly)
├─ Custom report builder
├─ Schedule email reports
├─ Download history
└─ Share report links
```

**Backend - Analytics Engine**

- [ ] GET /api/analytics/revenue (con date range)
- [ ] GET /api/analytics/products (con trending)
- [ ] GET /api/analytics/customers (con metrics)
- [ ] GET /api/analytics/orders (con breakdown)
- [ ] POST /api/analytics/reports (generate & email)
- [ ] Agregar columnas a tables para analytics

**Database queries optimizadas**:

```sql
-- Revenue por fecha (con índices)
CREATE INDEX idx_order_tenantid_createdat ON orders(tenantId, createdAt);

-- Product sales ranking
CREATE INDEX idx_orderitem_productid_quantity ON order_items(productId, quantity);

-- Customer metrics
CREATE INDEX idx_customer_tenantid_createdat ON users(tenantId, createdAt);
```

**Estimado de PR**: 1,000 líneas frontend + 450 líneas backend

---

#### Semana 11-12: Email Marketing & Campaigns (40h)

**Frontend (24h) | Backend (16h)**

##### Funcionalidades

- [ ] Email template builder (drag & drop básico)
- [ ] Campaign management (crear, schedule, send)
- [ ] Email automation (welcome, abandoned cart, post-purchase)
- [ ] Subscriber management
- [ ] Email analytics (open rate, click rate)
- [ ] A/B testing de subject lines

**Componentes nuevos**:

```typescript
- <TemplateBuilder /> - Email template editor
- <CampaignWizard /> - Campaign creation
- <AutomationRules /> - Trigger-based emails
- <EmailAnalytics /> - Open/click rates
- <SubscriberList /> - Manage emails
```

**Tareas específicas**:

```
dashboard/marketing/campaigns/page.tsx (200 líneas)
├─ List campaigns
├─ Create campaign button
├─ Draft/scheduled/sent tabs
├─ Analytics per campaign
└─ Duplicate/edit/delete actions

dashboard/marketing/campaigns/[id]/editor/page.tsx (250 líneas)
├─ Template selector (predefined or custom)
├─ Drag & drop editor (blocksui o similar)
├─ Preview desktop/mobile
├─ Subject line A/B tester
└─ Send schedule picker

dashboard/marketing/automation/page.tsx (180 líneas)
├─ List automations
├─ Create automation modal
├─ Trigger rules (event-based)
├─ Email template selector
├─ Active/inactive toggle
└─ Performance metrics
```

**Backend - Email Service**

- [ ] POST /api/marketing/campaigns (crear)
- [ ] PATCH /api/marketing/campaigns/:id (editar)
- [ ] POST /api/marketing/campaigns/:id/send (enviar)
- [ ] GET /api/marketing/campaigns/:id/analytics
- [ ] POST /api/marketing/automations (crear automation)
- [ ] Webhook para eventos (order placed, cart abandoned, etc)
- [ ] Email queue processing (Bull queue)
- [ ] Unsubscribe link handling

**Integraciones**:

- Resend (ya integrado, mejorar)
- Mailgun o SendGrid (alternativa)
- Email verification
- Unsubscribe handling

**Estimado de PR**: 800 líneas frontend + 600 líneas backend

---

#### Semana 13-14: SEO & Content Management (40h)

**Frontend (30h) | Backend (10h)**

##### Funcionalidades

- [ ] Dynamic meta tags (title, description, og:image)
- [ ] Sitemap.xml generation
- [ ] robots.txt
- [ ] Canonical tags
- [ ] JSON-LD structured data (products, org)
- [ ] Rich snippets (reviews, ratings)
- [ ] Breadcrumbs schema
- [ ] Open Graph tags
- [ ] Analytics integration (GA4, Vercel)

**Tareas específicas**:

```
lib/seo/metadata.ts (150 líneas)
├─ Helper para generar metadata
├─ OG image generation (dynamic)
├─ Canonical URL builder
├─ JSON-LD schemas
└─ Twitter card tags

app/(shop)/shop/products/[id]/page.tsx
├─ Metadata export con generateMetadata()
├─ Dynamic og:image (con product image)
├─ Canonical tag
├─ JSON-LD Product schema
└─ Structured review data

app/sitemap.ts (100 líneas)
├─ Generate sitemap.xml
├─ Include products, categories
├─ Correct lastmod dates
└─ Prioritize importante pages

public/robots.txt
├─ Allow/disallow rules
├─ Sitemap URL
└─ Crawl delay

components/shared/Analytics.tsx
├─ Google Analytics 4 integration
├─ PageView tracking
├─ Custom events (product view, add to cart, purchase)
└─ User ID tracking (if logged in)
```

**Backend - SEO APIs**

- [ ] GET /api/seo/sitemap (JSON)
- [ ] Generar sitemap.xml automáticamente
- [ ] Actualizar robots.txt por tenant
- [ ] Schema validation

**Estimado de PR**: 600 líneas frontend + 250 líneas backend

---

#### Semana 15-16: Reviews & Social Proof (40h)

**Frontend (30h) | Backend (10h)**

##### Funcionalidades

- [ ] Product reviews (CRUD)
- [ ] Star rating system (1-5)
- [ ] Review moderation (seller approval)
- [ ] Helpful votes (upvote/downvote)
- [ ] Verified purchase badge
- [ ] Review photos/videos
- [ ] Review analytics (average rating, breakdown)
- [ ] Customer testimonials section

**Componentes nuevos**:

```typescript
- <ReviewForm /> - Submit review
- <ReviewCard /> - Display review
- <RatingStars /> - Interactive star rating
- <ReviewGallery /> - Photos from reviews
- <RatingBreakdown /> - Stats by star
- <HelpfulVote /> - Helpful? button
- <ReviewsSection /> - Paginated reviews
```

**Tareas específicas**:

```
components/shop/ReviewsSection.tsx (250 líneas)
├─ Display reviews (paginated)
├─ Filter by rating
├─ Sort by helpful/recent
├─ Review card component
├─ Helpful vote buttons
└─ Load more / pagination

components/shop/ReviewForm.tsx (200 líneas)
├─ Star rating picker
├─ Title input
├─ Comment textarea
├─ Photo upload (Vercel Blob)
├─ Submit button
└─ Verification: "I bought this product"

dashboard/products/[id]/reviews/page.tsx (180 líneas)
├─ Reviews list para seller
├─ Approve/reject review
├─ Delete review
├─ Reply to review
├─ Rating analytics
└─ Review photos gallery

dashboard/products/analytics/[id]/ratings/page.tsx
├─ Average rating
├─ Rating distribution (bar chart)
├─ Reviews per month (trend)
├─ Top helpful reviews
└─ Compare with category avg
```

**Backend - Reviews API**

- [ ] POST /api/products/:id/reviews (crear)
- [ ] GET /api/products/:id/reviews (listar con filtros)
- [ ] PATCH /api/reviews/:id (seller puede responder)
- [ ] DELETE /api/reviews/:id
- [ ] POST /api/reviews/:id/helpful (vote)
- [ ] GET /api/products/:id/reviews/stats (analytics)

**Estimado de PR**: 900 líneas frontend + 350 líneas backend

---

### TRIMESTRE 3: Scaling & Platform Features (Semanas 17-24)

**Objetivo**: Preparar para escala (10x usuarios) + features premium
**Horas**: 160h (20h/semana)

#### Semana 17-18: Inventory Management (40h)

**Frontend (25h) | Backend (15h)**

##### Funcionalidades

- [ ] Product variants (talla, color, etc) - MEJORAR si existe
- [ ] Stock tracking por variant
- [ ] Low stock alerts
- [ ] Reorder points
- [ ] Stock history/audit log
- [ ] Barcode/SKU management
- [ ] Inventory transfers (entre warehouses futuros)
- [ ] Stock forecast

**Tareas específicas**:

```
dashboard/inventory/page.tsx (200 líneas)
├─ Products con low stock indicator
├─ Bulk edit stock
├─ Add to reorder list
├─ View history
└─ Generate purchase order

dashboard/inventory/variants/[productId]/page.tsx (180 líneas)
├─ Manage variants (talla, color)
├─ Stock por variant
├─ Price por variant
├─ Images por variant
└─ Reorder points per variant

dashboard/inventory/alerts/page.tsx (150 líneas)
├─ Low stock items
├─ Out of stock items
├─ Overstock items
├─ Restock recommendations
└─ Create purchase order

components/dashboard/InventoryTable.tsx (200 líneas)
├─ Sortable columns
├─ Filter by status
├─ Bulk actions (edit stock, reorder)
├─ Stock trend sparklines
└─ Alert badges
```

**Backend - Inventory API**

- [ ] POST /api/products/:id/variants (crear variant)
- [ ] PATCH /api/variants/:id (editar)
- [ ] DELETE /api/variants/:id
- [ ] PUT /api/inventory/:id (actualizar stock)
- [ ] GET /api/inventory/low-stock
- [ ] POST /api/inventory/audit-log
- [ ] GET /api/inventory/forecast (recomendaciones)

**Estimado de PR**: 900 líneas frontend + 450 líneas backend

---

#### Semana 19-20: Advanced Search & Recommendations (40h)

**Frontend (22h) | Backend (18h)**

##### Funcionalidades

- [ ] Full-text search (PostgreSQL tsVector)
- [ ] Faceted search (precio, rating, disponibilidad)
- [ ] Search suggestions/autocomplete (Redis)
- [ ] Recently viewed products
- [ ] "Customers also bought" (collaborative filtering)
- [ ] "Recommended for you" (personalized)
- [ ] Search analytics (trending searches, no-results queries)
- [ ] Smart filters (size charts, fit guides)

**Componentes nuevos**:

```typescript
- <AdvancedSearch /> - Search with facets
- <SearchSuggestions /> - Autocomplete dropdown
- <ProductRecommendations /> - Recommendation carousel
- <FacetFilter /> - Price slider, checkboxes
- <SearchAnalytics /> - Trending searches
```

**Tareas específicas**:

```
components/shop/SearchBar.tsx (200 líneas)
├─ Real-time suggestions (debounced)
├─ Recent searches
├─ Popular searches
├─ Trending searches
└─ Category suggestions

app/shop/search/page.tsx (250 líneas)
├─ Search results grid
├─ Faceted filters (left sidebar)
├─ Sort options (price, rating, new)
├─ No results state
├─ Did you mean suggestions
└─ View mode toggle (grid/list)

components/shop/RecommendationCarousel.tsx (180 líneas)
├─ "You may also like" section
├─ Based on viewed products
├─ Carousel with arrows
├─ Add to cart quick action
└─ Rating stars

dashboard/analytics/search/page.tsx (150 líneas)
├─ Trending searches
├─ No-results searches
├─ Search analytics
├─ Popular terms
└─ Content gaps
```

**Backend - Search Engine**

- [ ] Full-text search con PostgreSQL tsvector
- [ ] Elasticsearch integration (futuro)
- [ ] GET /api/products/search/suggestions
- [ ] GET /api/products/search (con facets)
- [ ] GET /api/products/:id/recommendations
- [ ] POST /api/search/analytics (track searches)
- [ ] Redis cache para hot searches
- [ ] Syonym handling (Nike = sneakers)

**Database**:

```sql
-- Full-text search index
CREATE INDEX idx_product_search_tsvector ON products USING gin(
  to_tsvector('spanish', name || ' ' || COALESCE(description, ''))
);

-- Recent searches tracking
CREATE TABLE search_queries (
  id UUID PRIMARY KEY,
  tenantId UUID NOT NULL,
  query VARCHAR(255),
  resultCount INT,
  createdAt TIMESTAMP,
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);
CREATE INDEX idx_search_tenant_date ON search_queries(tenantId, createdAt);
```

**Estimado de PR**: 700 líneas frontend + 500 líneas backend

---

#### Semana 21-22: Payment & Financial Features (40h)

**Frontend (20h) | Backend (20h)**

##### Funcionalidades

- [ ] Multiple payment methods (Stripe, PayPal, local payment gateways)
- [ ] Installment payments (pagar en 3/6 cuotas)
- [ ] Saved payment methods (tokenización segura)
- [ ] Refund management UI
- [ ] Invoice generation (PDF)
- [ ] Tax calculation (por ubicación)
- [ ] Multi-currency support (USD, MXN, etc)
- [ ] Payment analytics

**Tareas específicas**:

```
checkout/PaymentMethods.tsx (200 líneas)
├─ List saved payment methods
├─ Add new payment method (Stripe)
├─ Delete saved method
├─ Set as default
└─ PayPal button integration

checkout/Installments.tsx (150 líneas)
├─ Show available installment options
├─ Calculate monthly amount
├─ Financing terms display
└─ Select installment plan

dashboard/finances/refunds/page.tsx (200 líneas)
├─ Pending refunds list
├─ Process refund button
├─ Refund status tracking
├─ Refund history
└─ Export refund report

lib/payment/stripe-extended.ts (300 líneas)
├─ Installment plan calculation
├─ Multi-currency handling
├─ Tax calculation per region
├─ Webhook improvements
└─ Reconciliation helpers
```

**Backend - Payment API**

- [ ] Mejorar POST /api/checkout (multi-currency, installments)
- [ ] POST /api/payments/installment-plans
- [ ] POST /api/refunds (procesar reembolso)
- [ ] GET /api/finances/balance
- [ ] GET /api/finances/transactions
- [ ] Stripe Connect integration (futura - payout a sellers)
- [ ] Tax rate API (TaxJar integration)

**Estimado de PR**: 700 líneas frontend + 600 líneas backend

---

#### Semana 23-24: Performance & Security Hardening (40h)

**Frontend (25h) | Backend (15h)**

##### Objetivos

- [ ] Lighthouse 98+ (todas las páginas)
- [ ] Core Web Vitals green (LCP, FID, CLS)
- [ ] Security audit (OWASP Top 10)
- [ ] Penetration testing simulado
- [ ] Load testing final (100+ concurrentes)
- [ ] Database query optimization
- [ ] Caching strategy (HTTP, Redis, CDN)
- [ ] Error handling mejorado

**Tareas específicas**:

```
Performance:
├─ Code splitting optimization (dynamic imports)
├─ Image optimization (next/image settings)
├─ Font loading (font-display: swap)
├─ CSS-in-JS → static CSS (Tailwind)
├─ Remove unused dependencies
├─ Minify assets
├─ Brotli compression
├─ HTTP/2 push hints
└─ Service Worker (offline support)

Security:
├─ CSRF tokens en forms
├─ Rate limiting (API)
├─ Input validation (Zod everywhere)
├─ SQL injection prevention (Prisma)
├─ XSS prevention (sanitize)
├─ CORS headers
├─ Content Security Policy (CSP)
├─ Secure cookies (SameSite, HttpOnly)
├─ HSTS headers
├─ Penetration test (simulated)
└─ Dependency scanning

Testing:
├─ Load test k6 (100 concurrent users)
├─ API stress test (1000 RPS)
├─ Database stress test
├─ Memory leak testing
├─ Integration tests (user flows)
└─ E2E tests (critical paths)
```

**Backend Optimizations**:

```typescript
// Query optimization
- Add missing indexes
- Review slow queries
- Implement query caching
- Optimize N+1 queries
- Database connection pooling

// Caching strategy
- HTTP caching headers
- Redis for hot data
- CDN for static assets
- Stale-while-revalidate
```

**Estimado de PR**: 500 líneas (refactoring) + 300 líneas backend

---

## 📊 MATRIZ DE TAREAS - SEMANA A SEMANA

| Semana | Tema                   | Frontend | Backend  | Horas    | Componentes | Endpoints |
| ------ | ---------------------- | -------- | -------- | -------- | ----------- | --------- |
| 1-2    | Shop Frontend          | 28h      | 12h      | 40h      | 7           | 5         |
| 3-4    | User Account           | 28h      | 12h      | 40h      | 6           | 6         |
| 5-6    | Checkout Flow          | 32h      | 8h       | 40h      | 6           | 1         |
| 7-8    | Mobile & Performance   | 35h      | 5h       | 40h      | 0           | 0         |
| 9-10   | Advanced Analytics     | 28h      | 12h      | 40h      | 5           | 4         |
| 11-12  | Email Marketing        | 24h      | 16h      | 40h      | 5           | 7         |
| 13-14  | SEO & Content          | 30h      | 10h      | 40h      | 1           | 2         |
| 15-16  | Reviews & Social Proof | 30h      | 10h      | 40h      | 6           | 6         |
| 17-18  | Inventory Management   | 25h      | 15h      | 40h      | 3           | 7         |
| 19-20  | Advanced Search        | 22h      | 18h      | 40h      | 4           | 7         |
| 21-22  | Payment & Finances     | 20h      | 20h      | 40h      | 4           | 6         |
| 23-24  | Performance & Security | 25h      | 15h      | 40h      | 0           | 0         |
|        | **TOTAL**              | **327h** | **153h** | **480h** | **47**      | **51**    |

---

## 🏗️ Arquitectura de Componentes Phase 2

```
components/
├── shop/
│   ├── ShopHero.tsx
│   ├── ProductCard.tsx
│   ├── ProductGallery.tsx
│   ├── FilterSidebar.tsx
│   ├── ProductReviews.tsx
│   ├── RelatedProducts.tsx
│   ├── SearchAutocomplete.tsx
│   ├── SearchBar.tsx
│   ├── ReviewForm.tsx
│   ├── ReviewsSection.tsx
│   └── RecommendationCarousel.tsx
│
├── checkout/
│   ├── CheckoutWizard.tsx
│   ├── AddressSelector.tsx
│   ├── AddressStep.tsx
│   ├── ShippingMethod.tsx
│   ├── PaymentForm.tsx
│   ├── PaymentMethods.tsx
│   ├── Installments.tsx
│   ├── OrderSummary.tsx
│   └── ReviewStep.tsx
│
├── account/
│   ├── AccountLayout.tsx
│   ├── ProfileForm.tsx
│   ├── AddressManager.tsx
│   ├── OrderCard.tsx
│   ├── WishlistItem.tsx
│   └── RefundRequest.tsx
│
├── analytics/
│   ├── RevenueChart.tsx
│   ├── ProductPerformance.tsx
│   ├── CustomerMetrics.tsx
│   ├── DateRangePicker.tsx
│   ├── ExportButton.tsx
│   └── TrendIndicator.tsx
│
├── marketing/
│   ├── TemplateBuilder.tsx
│   ├── CampaignWizard.tsx
│   ├── AutomationRules.tsx
│   └── EmailAnalytics.tsx
│
└── dashboard/
    ├── InventoryTable.tsx
    └── InventoryAlerts.tsx
```

---

## 📁 Estructura de Rutas Phase 2

```
app/
├── (shop)/
│   ├── shop/
│   │   ├── page.tsx [NEW]
│   │   ├── search/page.tsx [NEW]
│   │   └── products/[id]/page.tsx [NEW]
│   └── account/ [NEW]
│       ├── page.tsx
│       ├── orders/page.tsx
│       ├── wishlist/page.tsx
│       └── settings/page.tsx
│
├── (customer)/
│   └── checkout/ [NEW]
│       ├── page.tsx
│       ├── AddressStep.tsx
│       ├── ShippingStep.tsx
│       ├── PaymentStep.tsx
│       └── ReviewStep.tsx
│
├── (dashboard)/
│   ├── analytics/ [MEJORAR]
│   │   ├── revenue/page.tsx [NEW]
│   │   ├── customers/page.tsx [NEW]
│   │   ├── products/page.tsx
│   │   ├── reports/page.tsx [NEW]
│   │   └── search/page.tsx [NEW]
│   │
│   ├── marketing/ [NEW]
│   │   ├── campaigns/page.tsx
│   │   ├── campaigns/[id]/editor/page.tsx
│   │   ├── automation/page.tsx
│   │   └── subscribers/page.tsx
│   │
│   ├── inventory/ [NEW]
│   │   ├── page.tsx
│   │   ├── variants/[productId]/page.tsx
│   │   ├── alerts/page.tsx
│   │   └── history/page.tsx
│   │
│   └── finances/ [NEW]
│       ├── balance/page.tsx
│       ├── transactions/page.tsx
│       ├── refunds/page.tsx
│       └── reports/page.tsx
│
└── api/
    ├── products/
    │   ├── search/ [NEW]
    │   └── [id]/
    │       ├── reviews/ [NEW]
    │       └── recommendations/ [NEW]
    │
    ├── marketing/ [NEW]
    │   ├── campaigns/
    │   ├── automations/
    │   └── subscribers/
    │
    ├── inventory/ [NEW]
    │   ├── low-stock/
    │   └── audit-log/
    │
    ├── payments/ [MEJORAR]
    │   ├── installments/ [NEW]
    │   └── methods/ [NEW]
    │
    └── users/
        ├── wishlist/ [NEW]
        ├── reviews/ [NEW]
        └── [id]/
            └── invoices/ [NEW]
```

---

## 🎯 Criterios de Aceptación por Semana

### Semana 1-2: Shop Frontend

- [ ] Shop homepage con hero, featured, categories
- [ ] Product listing con filters y search
- [ ] Product detail page con galería y reviews
- [ ] Componentes: ProductCard, FilterSidebar, ProductGallery (7 total)
- [ ] API: GET /api/products/search, GET /api/products/:id/related, GET /api/categories/hierarchy
- [ ] Responsive en mobile (Lighthouse 90+)
- [ ] Build limpio (npm run build)
- [ ] PR aceptable

**Definition of Done**:

```
[ ] Todos los componentes creados
[ ] Todas las páginas funcionando
[ ] Responsive en mobile (test en DevTools)
[ ] Sin errores TypeScript
[ ] API endpoints funcionando
[ ] PR con descripción clara
[ ] Code review aprobado
[ ] Tests incluidos (si aplica)
```

_Repetir este patrón para cada semana_

---

## 📈 Tracking & Milestones

### Key Milestones

```
Fin Semana 2: Clientes pueden navegar productos
Fin Semana 4: Clientes pueden tener cuenta y guardar preferencias
Fin Semana 8: MVP mobile-optimized completo
Fin Semana 12: Herramientas de marketing para sellers
Fin Semana 16: Comunidad (reviews, recomendaciones)
Fin Semana 20: Búsqueda inteligente funcionando
Fin Semana 24: Plataforma lista para escala (10x usuarios)
```

### Weekly Sync Meetings

```
Lunes 10am: Sprint planning + architecture discussion
Miércoles 2pm: Technical blockers review
Viernes 4pm: Code review + demo
```

### PR Standards

```
Cada semana:
- 1 PR por componente/feature principal
- Mínimo 200 líneas changed
- Code review antes de merge
- Tests incluidos
- Build passing
```

---

## 🚀 Recomendación Final para el Arquitecto

### Decisión: 70% Frontend + 30% Backend

**Por qué esta distribución**:

1. **Frontend (327 horas)**:
   - MVP carece de frontend customer-facing completo
   - Los clientes solo ven admin dashboard, no la tienda
   - UX es crítica para conversión (checkout, product discovery)
   - Más complejidad visual & interactiva
   - Responsive design requiere mucho trabajo

2. **Backend (153 horas)**:
   - Ya está bien estructurado (50+ endpoints)
   - Features nuevas son incrementales (analytics, email, search)
   - Menos cambios arquitectónicos necesarios
   - Integración con third-parties (Stripe, Resend, etc)

### Recomendación de Especialización

**Flexible** - No especialización rígida:

- Semanas 1-2: 100% Frontend (shop) + apoyo backend
- Semanas 3-6: 70% Frontend + 30% Backend
- Semanas 9-12: 60% Frontend + 40% Backend (más backend-heavy)
- Semanas 13-24: 50-50 según necesidad

### Skills Requeridas

```
Frontend:
✅ React/Next.js (ya tiene)
✅ TypeScript (ya tiene)
✅ Tailwind CSS (ya tiene)
✅ Estado management (Zustand/React Context)
✅ Form handling (React Hook Form, Zod)
✅ Charting (recharts, chart.js)
✅ E-commerce UX (design thinking)

Backend:
✅ Next.js API Routes (ya tiene)
✅ Prisma ORM (ya tiene)
✅ Database optimization (aprender)
✅ Email integration (conoce Resend)
✅ Payment processing (conoce Stripe)
✅ Caching strategies (Redis basics)
✅ Analytics pipelines (nueva skill)
```

---

## 📋 Checklist para Iniciar Phase 2

Antes de comenzar semana 1:

```
Infraestructura:
[ ] Rama develop lista para nuevas features
[ ] GitHub Projects configurado (24 semanas de tareas)
[ ] PR template actualizado
[ ] CI/CD validando build
[ ] Staging environment funcionando

Documentación:
[ ] Este roadmap leído y entendido
[ ] CLAUDE.md actualizado con Phase 2 context
[ ] Database schema revisado
[ ] API contracts definidos

Preparación:
[ ] Vercel deployment configurado
[ ] Monitoring (Sentry) funcionando
[ ] Analytics básico configurado
[ ] Backup strategy validada
[ ] Secrets management (env vars) seguro
```

---

## 🎓 Conclusión

**Phase 2 es un roadmap ambicioso pero alcanzable**:

- 24 semanas bien estructuradas
- 480 horas totales (20h/semana)
- 47 nuevos componentes
- 51 nuevos endpoints
- 12 módulos principales
- Resultado: Plataforma lista para escala

**Success mide**: Poder soportar 10x usuarios actuales sin degradación de performance.

---

**Documento creado**: 17 de Noviembre, 2025
**Versión**: 2.0.0 (Post-MVP Phase 2)
**Status**: ✅ Listo para implementación
**Next**: Iniciar Semana 1 de Phase 2
