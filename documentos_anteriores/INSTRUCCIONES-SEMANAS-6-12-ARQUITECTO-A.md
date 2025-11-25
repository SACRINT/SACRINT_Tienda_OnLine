# INSTRUCCIONES SEMANAS 6-12 - ARQUITECTO A

## Continuación de Desarrollo: Dashboard, DevOps, Launch

**Fecha**: Semana 6 del Desarrollo
**Horas Completadas**: ~60 horas (Semanas 1-5)
**Horas Restantes**: ~140 horas (Semanas 6-12)
**Estado**: ✅ On Track para Producción

---

## 📊 RESUMEN DE PROGRESO

### ✅ COMPLETADO (Semanas 1-5):

```
Semana 1-2: Security Fixes + Core Features ✅ (40h)
├─ Tenant Isolation refactor (36 funciones)
├─ API endpoints updates (11 endpoints)
├─ User Profiles (6 endpoints)
├─ Stripe Webhooks (3 handlers)
├─ Email Notifications (React Email templates)
└─ Tests & Documentation

Semana 3-4: Advanced Features ✅ (40h)
├─ Coupon System (13 DAL functions, 5 endpoints)
├─ Advanced Search (faceted, autocomplete, filtering)
├─ Image Upload (Vercel Blob Storage)
├─ Testing (35 test cases, 70% coverage)
└─ Documentation (API, Performance, Security guides)

Semana 5: Frontend Foundation ✅ (20h started)
├─ Dashboard Auth (NextAuth integration)
├─ Access Control (RBAC)
└─ Foundation established
```

**Total**: 60 horas de trabajo excelente
**Calidad**: Código limpio, tests, documentación completa
**Seguridad**: OWASP Top 10 protection implementado
**Próximo**: Semana 6

---

## 🎯 SEMANA 6: FRONTEND DASHBOARD UI

**Horas**: 40h
**Prioridad**: ALTA - Core para admin

### Tarea 6.1: Dashboard Layout Components (12h)

**Objetivo**: Crear estructura de dashboard completamente funcional

**Componentes a crear**:

```
src/components/dashboard/
├─ DashboardSidebar.tsx (10h)
│  ├─ Navigation links (home, products, orders, analytics)
│  ├─ Responsive mobile menu
│  ├─ User menu (profile, logout)
│  ├─ Active route highlighting
│  └─ Styling: Tailwind + shadcn/ui
│
├─ DashboardHeader.tsx (4h)
│  ├─ Store name/logo
│  ├─ Search bar
│  ├─ Notifications bell
│  └─ User profile dropdown
│
└─ DashboardLayout.tsx (8h)
   ├─ Wrapper for all dashboard pages
   ├─ RBAC check: redirect if not STORE_OWNER
   ├─ Sidebar + Header + Content area
   └─ Responsive design
```

**Endpoints usado**:

- `GET /api/users/me` - Current user info
- `GET /api/tenants/[id]` - Store info

**Testing**:

```
✓ Sidebar renders correctly
✓ Mobile menu toggle works
✓ RBAC blocks non-owners
✓ Links navigate correctly
✓ Responsive on mobile
```

### Tarea 6.2: Product Management Interface (14h)

**Objetivo**: Panel para que store owners gestionen productos

**Pages a crear**:

```
app/(dashboard)/products/
├─ page.tsx (Product List) (6h)
│  ├─ Table with columns:
│  │  ├─ Product name
│  │  ├─ SKU
│  │  ├─ Price
│  │  ├─ Stock
│  │  ├─ Status (active/inactive)
│  │  └─ Actions (edit, delete, view)
│  ├─ Pagination
│  ├─ Sorting (by price, name, date)
│  ├─ Filtering (category, status)
│  ├─ Search bar
│  └─ "Add Product" button
│
├─ [id]/page.tsx (Product Detail) (5h)
│  ├─ Edit form with fields:
│  │  ├─ Name, description
│  │  ├─ Price, cost
│  │  ├─ Category
│  │  ├─ Images upload
│  │  ├─ Variants
│  │  ├─ Stock/inventory
│  │  └─ SEO fields
│  ├─ Save button (PUT endpoint)
│  ├─ Delete button
│  └─ Preview link
│
├─ new/page.tsx (Create Product) (3h)
│  ├─ Same form as edit
│  ├─ Create button (POST endpoint)
│  └─ Redirect on success
│
└─ import/page.tsx (Bulk Import) (optional)
   ├─ CSV upload field
   ├─ Preview table
   └─ Import button
```

**Endpoints used**:

- `GET /api/products?tenantId=X` - List
- `POST /api/products` - Create
- `PUT /api/products/[id]` - Update
- `DELETE /api/products/[id]` - Delete
- `GET /api/categories` - For dropdown

**UI Components needed**:

```
├─ ProductTable.tsx
├─ ProductForm.tsx
├─ ImageUploader.tsx
├─ VariantManager.tsx
├─ PriceInput.tsx
└─ StockInput.tsx

(Use: shadcn/ui Input, Select, Button, Card, Dialog, etc.)
```

**Testing**:

```
✓ List loads products
✓ Can create new product
✓ Can edit product
✓ Can delete product
✓ Images upload correctly
✓ Form validation works
✓ Only sees own products (tenant isolation)
```

### Tarea 6.3: Order Management Interface (14h)

**Objetivo**: Panel para gestionar órdenes de clientes

**Pages a crear**:

```
app/(dashboard)/orders/
├─ page.tsx (Order List) (6h)
│  ├─ Table with columns:
│  │  ├─ Order ID
│  │  ├─ Customer name
│  │  ├─ Total amount
│  │  ├─ Status (pending, processing, shipped, delivered)
│  │  ├─ Date
│  │  └─ Actions (view, edit status, refund)
│  ├─ Pagination
│  ├─ Filter by status
│  ├─ Search by order ID or customer
│  └─ Date range filter
│
├─ [id]/page.tsx (Order Detail) (5h)
│  ├─ Order summary:
│  │  ├─ Customer info
│  │  ├─ Shipping address
│  │  ├─ Items list
│  │  ├─ Total breakdown
│  │  └─ Payment method
│  ├─ Status timeline
│  ├─ Change status dropdown
│  ├─ Print invoice button
│  ├─ Refund button (if applicable)
│  └─ Customer notes section
│
└─ refund/[orderId]/page.tsx (Refund) (3h)
   ├─ Refund amount input
   ├─ Reason dropdown
   ├─ Process button
   └─ Confirmation modal
```

**Endpoints used**:

- `GET /api/admin/orders` - List
- `GET /api/admin/orders/[id]` - Detail
- `PUT /api/admin/orders/[id]/status` - Update status
- `POST /api/admin/orders/[id]/refund` - Process refund
- `GET /api/orders/[id]` - Print invoice (PDF)

**UI Components needed**:

```
├─ OrderTable.tsx
├─ OrderDetail.tsx
├─ StatusTimeline.tsx
├─ RefundForm.tsx
└─ InvoicePrinter.tsx
```

**Testing**:

```
✓ List loads orders
✓ Can view order detail
✓ Can change order status
✓ Can process refund
✓ Only sees own orders (tenant isolation)
✓ Date filters work
✓ Search works
```

---

## 🎯 SEMANAS 7-8: ANALYTICS & ADVANCED ADMIN

**Horas**: 35h + 35h = 70h
**Prioridad**: ALTA - Revenue tracking

### Tarea 7.1: Analytics Dashboard (20h)

**Objetivo**: Dashboards con métricas de negocio

**Pages a crear**:

```
app/(dashboard)/analytics/
├─ page.tsx (Overview) (8h)
│  ├─ Cards showing:
│  │  ├─ Total Revenue (this month)
│  │  ├─ Orders count
│  │  ├─ New customers
│  │  └─ Avg order value
│  ├─ Charts:
│  │  ├─ Revenue chart (line, last 30 days)
│  │  ├─ Orders by status (pie)
│  │  └─ Top products (bar)
│  └─ Period selector (7d, 30d, 90d, 12m)
│
├─ sales/page.tsx (Sales Report) (6h)
│  ├─ Sales trends chart
│  ├─ Revenue breakdown by category
│  ├─ Period comparison (vs last month)
│  ├─ Export button (CSV, PDF)
│  └─ Filters: date range, category
│
└─ customers/page.tsx (Customer Analytics) (6h)
   ├─ New customers (this period)
   ├─ Repeat customers %
   ├─ Top customers by revenue
   ├─ Customer segmentation
   └─ Retention metrics
```

**Charts library**: Use `recharts` or `chart.js`

```
npm install recharts
```

**Endpoints used**:

- `GET /api/admin/dashboard/metrics` - KPIs
- `GET /api/admin/dashboard/sales?days=30` - Sales data
- `GET /api/admin/dashboard/products?limit=10` - Top products
- `GET /api/admin/dashboard/orders?limit=10` - Recent orders

**UI Components needed**:

```
├─ MetricsCard.tsx (displays single metric)
├─ BarChart.tsx
├─ LineChart.tsx
├─ PieChart.tsx
├─ PeriodSelector.tsx
└─ ExportButton.tsx
```

**Testing**:

```
✓ Metrics load correctly
✓ Charts render data
✓ Period selector works
✓ Export generates files
✓ Mobile responsive
```

### Tarea 7.2: Customer Management Interface (15h)

**Objetivo**: Gestionar clientes y ver su historial

**Pages a crear**:

```
app/(dashboard)/customers/
├─ page.tsx (Customer List) (7h)
│  ├─ Table with columns:
│  │  ├─ Name
│  │  ├─ Email
│  │  ├─ Phone
│  │  ├─ Total spent
│  │  ├─ Last purchase date
│  │  └─ Actions (view, email, suspend)
│  ├─ Pagination
│  ├─ Search by name/email
│  ├─ Filter by status
│  └─ Sort by spend, date
│
└─ [id]/page.tsx (Customer Detail) (8h)
   ├─ Customer info:
   │  ├─ Name, email, phone
   │  ├─ Registration date
   │  ├─ Total spent
   │  └─ Addresses on file
   ├─ Order history
   ├─ Reviews written
   ├─ Send email button
   ├─ Suspend/block button
   └─ Notes section (admin notes)
```

**Endpoints used**:

- `GET /api/admin/customers` - List
- `GET /api/admin/customers/[id]` - Detail
- `GET /api/admin/customers/[id]/orders` - Order history
- `POST /api/admin/customers/[id]/email` - Send email

**Testing**:

```
✓ Customer list loads
✓ Can view customer detail
✓ Order history shows
✓ Search works
✓ Can send emails
✓ Suspend works
```

### Tarea 8.3: Settings Page (10h)

**Objetivo**: Configuración de tienda

**Pages a crear**:

```
app/(dashboard)/settings/
├─ general/page.tsx (5h)
│  ├─ Store name
│  ├─ Store description
│  ├─ Logo upload
│  ├─ Primary color
│  ├─ Currency
│  └─ Save button
│
├─ payment/page.tsx (3h)
│  ├─ Stripe keys (display masked)
│  ├─ Test/Live mode toggle
│  └─ Webhook URL
│
└─ shipping/page.tsx (2h)
   ├─ Shipping zones
   ├─ Shipping rates
   └─ Flat rate option
```

**Endpoints used**:

- `GET /api/tenants/[id]` - Get current settings
- `PUT /api/tenants/[id]` - Update settings

---

## 🎯 SEMANAS 9-10: DEVOPS & DEPLOYMENT

**Horas**: 30h + 30h = 60h
**Prioridad**: CRÍTICA - Production ready

### Tarea 9.1: CI/CD Pipeline (8h)

**Objetivo**: Automated testing y deployment

**Create**: `.github/workflows/`

```
deploy.yml (5h)
├─ Trigger: Push to main
├─ Jobs:
│  ├─ Test (npm run test)
│  ├─ Lint (npm run lint)
│  ├─ Build (npm run build)
│  └─ Deploy to Vercel
└─ Only deploy if all pass

staging.yml (3h)
├─ Trigger: Push to develop
├─ Deploy to staging environment
└─ Run integration tests
```

**Example workflow**:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
```

### Tarea 9.2: Database Optimization & Backups (7h)

**Objetivo**: Production-ready database

**Create**: `docs/DATABASE-SETUP.md`

```
1. Index Creation (2h)
   ├─ Add index on products.tenantId
   ├─ Add index on orders.tenantId
   ├─ Add composite indexes for common queries
   └─ Run ANALYZE to update stats

2. Backup Strategy (3h)
   ├─ Automated nightly backups to AWS S3
   ├─ 30-day retention policy
   ├─ Test restore procedure
   └─ Document recovery steps

3. Migration Scripts (2h)
   ├─ Schema migration scripts
   ├─ Data migration if needed
   └─ Rollback procedures
```

**Prisma migration script**:

```bash
npx prisma migrate dev --name add_missing_indexes
npx prisma db push --skip-generate
```

### Tarea 9.3: Monitoring & Alerting (8h)

**Objetivo**: Production monitoring setup

**Setup Sentry** (error tracking):

```bash
npm install @sentry/nextjs
```

**Create**: `src/lib/monitoring/sentry.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    replaySessionSampleRate: 0.1,
    replayOnErrorSampleRate: 1.0,
  });
}
```

**Add to**:

- `pages/_app.tsx` - Initialize on app start
- API routes - Wrap handlers with Sentry
- Components - Capture React errors

**Setup logging**:

```
Create: src/lib/logging/logger.ts
├─ Structured logging with timestamps
├─ Log levels: debug, info, warn, error
├─ Send to Sentry on errors
└─ Database logging for audit trail
```

**Setup alerts** (using email):

```
Trigger alerts for:
├─ Error rate > 5%
├─ Response time > 2s (p95)
├─ Database down
├─ Payment processing errors
└─ Security alerts (failed logins, etc)
```

### Tarea 9.4: Security Hardening (7h)

**Objetivo**: Production security

**Checklist**:

```
1. Environment Variables (2h)
   ✓ .env.production with real values
   ✓ No secrets in code
   ✓ Use Vercel secrets dashboard
   ✓ Rotate keys quarterly

2. HTTPS & HSTS (1h)
   ✓ Enable HTTPS only
   ✓ HSTS header (1 year)
   ✓ Force HTTPS redirects

3. WAF & DDoS (2h)
   ✓ Cloudflare WAF rules
   ✓ DDoS protection enabled
   ✓ Rate limiting by IP

4. Database Security (2h)
   ✓ Strong database passwords
   ✓ Network isolation (allow only Vercel IPs)
   ✓ SSL connection required
   ✓ Encrypt sensitive fields

5. API Security (2h review already done - just verify)
   ✓ CORS configured
   ✓ CSRF protection
   ✓ Rate limiting active
   ✓ Input validation
```

### Tarea 10.1: Load Testing (8h)

**Objetivo**: Verify performance at scale

**Tool**: k6 or Artillery

```bash
npm install -g k6
```

**Create**: `tests/load/checkout-load-test.js`

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp-up
    { duration: "1m30s", target: 100 }, // Stay at 100
    { duration: "20s", target: 0 }, // Ramp-down
  ],
};

export default function () {
  // Test checkout endpoint
  let response = http.post(
    "https://your-site.com/api/checkout",
    JSON.stringify({
      items: [{ productId: "123", quantity: 1 }],
      paymentMethod: "stripe",
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  check(response, {
    "checkout is 200": (r) => r.status === 200,
    "checkout duration < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run test**:

```bash
k6 run tests/load/checkout-load-test.js
```

**Target metrics**:

- Response time: < 500ms (p99)
- Success rate: > 99%
- Concurrent users: 1000+

### Tarea 10.2: Documentation (7h)

**Objective**: Complete operational docs

**Create**:

```
docs/DEPLOYMENT-GUIDE.md (3h)
├─ Environment setup
├─ Database setup
├─ Deployment steps
├─ Rollback procedures
└─ Monitoring setup

docs/RUNBOOK.md (2h)
├─ Common issues and fixes
├─ Emergency contacts
├─ Escalation procedures
└─ Downtime procedures

docs/API-SECURITY.md (2h)
├─ API authentication
├─ Rate limiting rules
├─ CORS configuration
└─ Example API calls
```

---

## 🎯 SEMANAS 11-12: LAUNCH & SUPPORT

**Horas**: 20h + 20h = 40h
**Prioridad**: CRÍTICA - Go live

### Tarea 11.1: Pre-Launch Testing (8h)

**Objective**: Final quality assurance

**Checklist**:

```
□ Functional Testing
  ├─ All user flows work (login, browse, purchase)
  ├─ Admin flows work (create product, view orders)
  ├─ Payment processing works
  ├─ Email sending works
  └─ File uploads work

□ Performance Testing
  ├─ Lighthouse score > 90
  ├─ First Contentful Paint < 1.5s
  ├─ Largest Contentful Paint < 2.5s
  ├─ Cumulative Layout Shift < 0.1
  └─ Database queries optimized

□ Security Testing
  ├─ OWASP Top 10 scan passed
  ├─ No hardcoded secrets
  ├─ SSL certificate valid
  ├─ Headers implemented
  └─ Rate limiting working

□ Cross-Browser Testing
  ├─ Chrome
  ├─ Firefox
  ├─ Safari
  └─ Mobile browsers

□ Device Testing
  ├─ Desktop (1920x1080)
  ├─ Tablet (768x1024)
  └─ Mobile (375x667)
```

### Tarea 11.2: Launch Preparation (4h)

**Objective**: Ready for go-live

**Tasks**:

```
□ DNS switchover plan
  ├─ Current: Old system
  ├─ Cutover: Switch DNS to new app
  ├─ Timing: Outside business hours
  └─ Rollback: Keep old system running 24h

□ Data migration (if migrating from old system)
  ├─ Export from old system
  ├─ Transform data
  ├─ Load to new database
  ├─ Verify data integrity
  └─ Customer notification

□ Monitoring setup
  ├─ Sentry configured
  ├─ Logs being collected
  ├─ Alerts configured
  └─ Dashboard ready

□ Communication plan
  ├─ Customer email ready
  ├─ Status page setup
  ├─ Support team briefed
  └─ Executive summary prepared
```

### Tarea 12.1: Launch Day (2h)

**Objective**: Go live

**Procedure**:

```
T-1h: Final checks
  ├─ All systems green
  ├─ Team in Slack
  └─ Monitoring active

T-0: DNS switchover
  ├─ Update DNS records
  ├─ Verify traffic routing
  └─ Start monitoring

T+15min: Health check
  ├─ Verify homepage loads
  ├─ Test login
  ├─ Test checkout
  ├─ Check logs for errors
  └─ Monitor performance

T+1h: Declare success
  ├─ Notify team
  ├─ Update status page
  ├─ Send customer notification
  └─ Begin support monitoring
```

### Tarea 12.2: Post-Launch Support (8h per day for first week)

**Objective**: Monitor and support

**Daily tasks** (first week):

```
Every 4 hours:
├─ Check error rate (Sentry)
├─ Check performance (Lighthouse)
├─ Check uptime
└─ Verify all critical features work

Customer support:
├─ Monitor support channels
├─ Fix bugs immediately
├─ Communicate status
└─ Gather feedback

Monitoring:
├─ Watch for spikes
├─ Optimize slow queries
├─ Adjust rate limits if needed
└─ Monitor costs
```

---

## 📋 DAILY CADENCE (Semanas 6-12)

### Each Day:

```
09:00-09:15: Standup
  ├─ What I completed yesterday
  ├─ What I'm doing today
  └─ Any blockers

09:15-12:00: Development (3h)
12:00-13:00: Lunch break
13:00-17:00: Development (4h)
17:00-17:30: Commit + Status update
```

### Twice per Week:

```
Tuesday 14:00: Progress review (30 min)
Friday 16:00: Sprint review (1 hour)
```

### End of Sprint (Every 2 weeks):

```
Friday 15:00: Sprint planning (2 hours)
  ├─ Review completed tasks
  ├─ Plan next sprint
  └─ Adjust timeline if needed
```

---

## 🎯 SUCCESS METRICS

### Per Sprint:

```
Task Completion: 95%+ (minimum 85%)
Test Coverage: 80%+
ESLint Warnings: 0
TypeScript Errors: 0
Code Review: Approved
```

### Overall:

```
Security: ✓ OWASP Top 10 passed
Performance: ✓ Lighthouse > 90
Testing: ✓ 80%+ coverage
Documentation: ✓ Complete
Launch: ✓ Zero-downtime deployment
```

---

## 🚀 NEXT IMMEDIATE STEPS

**THIS WEEK**:

1. **Merge current work** (if not merged):

   ```bash
   git checkout develop
   git merge claude/backend-sprint-0-setup-015dEmHcuBzmf5REjbx5Fp9m
   git push origin develop
   ```

2. **Create Sprint 6 branch**:

   ```bash
   git checkout -b feature/sprint-6-dashboard-ui
   ```

3. **Start Tarea 6.1: Dashboard Layout** (12h)
   - Create DashboardSidebar.tsx
   - Create DashboardHeader.tsx
   - Create DashboardLayout.tsx
   - Test RBAC protection
   - Commit daily

4. **Daily standup** with director

---

## 📊 REMAINING TIMELINE

```
Week 6:   Dashboard UI (40h)           ← START HERE
Week 7:   Analytics + Customers (35h)
Week 8:   Settings + Polish (35h)
Week 9:   CI/CD + Database (30h)
Week 10:  Monitoring + Security (30h)
Week 11:  Testing + Launch prep (20h)
Week 12:  Launch + Support (20h)
─────────────────────────────────────
TOTAL:    220h remaining (~5.5 weeks)
```

**Target**: Production live by end of Week 12

---

**READY TO CONTINUE?**

Create your feature/sprint-6-dashboard-ui branch and begin!

You've got this! 💪🚀
