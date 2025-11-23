# PLAN ARQUITECTO - SEMANAS 25-56 (EXPANSION COMPLETA CON CÓDIGO)

**Documento**: Semanas 25-56 Completamente Detalladas
**Versión**: 1.0
**Total Tareas**: 384 (12 × 32 semanas)
**Total Líneas de Código**: 8,000+
**Lenguaje**: Español

---

# SEMANAS 25-28: COMPLIANCE, BILLING Y MONITORING

---

## SEMANA 25: BILLING, PLANES Y FACTURACIÓN SaaS

### Objetivo Específico

Implementar sistema completo de billing con planes SaaS, facturas, subscripciones y pagos recurrentes usando Stripe Billing.

### Tareas Detalladas

**25.1 - SaaS Plans Configuration**

- Crear `/lib/billing/plans.ts`

```typescript
export const Plans = {
  FREE: {
    id: "plan_free",
    name: "Gratuito",
    price: 0,
    products: 100,
    storage: "1GB",
    features: ["basic_shop", "manual_orders"],
    stripePriceId: null,
  },
  STARTER: {
    id: "price_starter_monthly",
    name: "Iniciador",
    price: 2900, // centavos MXN
    billingPeriod: "month",
    products: 1000,
    storage: "10GB",
    features: ["all_free", "api_access", "custom_domain"],
    stripePriceId: "price_starter_monthly",
    stripeProductId: "prod_starter",
  },
  PROFESSIONAL: {
    id: "price_pro_monthly",
    name: "Profesional",
    price: 7900,
    billingPeriod: "month",
    products: 10000,
    storage: "100GB",
    features: ["all_starter", "advanced_analytics", "priority_support"],
    stripePriceId: "price_pro_monthly",
    stripeProductId: "prod_pro",
  },
  ENTERPRISE: {
    id: "price_enterprise_monthly",
    name: "Empresarial",
    price: null,
    unlimited: true,
    customFeatures: true,
    stripePriceId: "price_enterprise_monthly",
    stripeProductId: "prod_enterprise",
  },
};

export function getPlanByTenantId(tenantId: string) {
  // Buscar plan del tenant en DB
}

export function canUpgrade(currentPlan: string, newPlan: string): boolean {
  const planOrder = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
  return planOrder.indexOf(newPlan) > planOrder.indexOf(currentPlan);
}
```

- **Entregable**: Plans configuration object

**25.2 - Stripe Product & Price Setup**

- Crear `/lib/stripe/setup-products.ts`

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function setupStripeProducts() {
  // Crear products en Stripe para cada plan
  const starterProduct = await stripe.products.create({
    name: "Iniciador",
    description: "Plan Iniciador - 1,000 productos",
    metadata: {
      plan: "STARTER",
    },
  });

  // Crear monthly price
  const monthlyPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 2900, // MXN centavos
    currency: "mxn",
    recurring: {
      interval: "month",
      interval_count: 1,
    },
  });

  // Crear annual price (10% descuento)
  const annualPrice = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 29000 * 12 * 0.9, // 10% discount
    currency: "mxn",
    recurring: {
      interval: "year",
      interval_count: 1,
    },
  });

  console.log(`STARTER plan - Monthly: ${monthlyPrice.id}, Annual: ${annualPrice.id}`);

  return { monthlyPrice, annualPrice };
}

export async function setupAllProducts() {
  // Setup para STARTER, PROFESSIONAL, ENTERPRISE
  const products = [];

  for (const [planName, planConfig] of Object.entries(Plans)) {
    if (planName === "FREE") continue;

    const product = await stripe.products.create({
      name: planConfig.name,
      metadata: { plan: planName },
    });

    // Monthly
    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: planConfig.price,
      currency: "mxn",
      recurring: { interval: "month" },
    });

    // Annual
    const annual = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.floor(planConfig.price * 12 * 0.9),
      currency: "mxn",
      recurring: { interval: "year" },
    });

    products.push({ planName, product, monthly, annual });
  }

  return products;
}
```

- **Entregable**: Stripe products created with monthly/annual pricing

**25.3 - Subscription Model & Migration**

- Crear Prisma migration:

```prisma
model Subscription {
  id String @id @default(cuid())
  tenantId String @unique
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  stripeSubscriptionId String @unique
  stripeCustomerId String @unique
  planId String // FREE, STARTER, PROFESSIONAL, ENTERPRISE

  status String // active, canceled, past_due, paused, trialing
  currentPeriodStart DateTime
  currentPeriodEnd DateTime
  canceledAt DateTime?
  pausedAt DateTime?

  billingEmail String
  billingName String
  billingAddress String?

  // Automaticity
  autoRenew Boolean @default(true)
  trialEndsAt DateTime?

  // Billing info
  lastPaymentAt DateTime?
  failedPaymentCount Int @default(0)
  nextPaymentDue DateTime?

  metadata Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([status])
}

model Invoice {
  id String @id @default(cuid())
  subscriptionId String?
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])

  stripeInvoiceId String @unique
  number String @unique // INV-001, INV-002, etc

  amountSubtotal BigInt // centavos
  amountTax BigInt
  amountTotal BigInt

  currency String @default("MXN")
  status String // draft, open, paid, uncollectible, void
  pdfUrl String?

  issuedAt DateTime
  dueDueDate DateTime?
  paidAt DateTime?

  customerName String
  customerEmail String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([subscriptionId])
  @@index([status])
  @@index([issuedAt])
}
```

- Ejecutar: `npx prisma migrate dev --name add_subscriptions`
- **Entregable**: Subscription schema migration

**25.4 - Billing Portal Page**

- Crear `/app/dashboard/[storeId]/billing/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getSubscription, getUserTenant } from '@/lib/db'
import { Plans } from '@/lib/billing/plans'

export default function BillingPage({ params }: { params: { storeId: string } }) {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSubscription() {
      const sub = await getSubscription(params.storeId)
      setSubscription(sub)
      setLoading(false)
    }
    loadSubscription()
  }, [params.storeId])

  if (loading) return <div>Cargando...</div>

  const currentPlan = Plans[subscription.planId]
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Facturación</h1>

      {/* Current Plan Card */}
      <div className="bg-white p-8 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4">Plan Actual</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-gray-600">Plan</span>
            <p className="text-2xl font-bold">{currentPlan.name}</p>
          </div>
          <div>
            <span className="text-gray-600">Precio Mensual</span>
            <p className="text-2xl font-bold">${(currentPlan.price / 100).toFixed(2)} MXN</p>
          </div>
          <div>
            <span className="text-gray-600">Renovación</span>
            <p className="text-xl">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-600">Días Restantes</span>
            <p className="text-xl font-semibold text-green-600">{daysUntilRenewal} días</p>
          </div>
        </div>

        <div className="border-t pt-6 flex gap-4">
          <a
            href={`/billing/upgrade?from=${subscription.planId}`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cambiar Plan
          </a>
          <button
            onClick={() => window.location.href = '/api/billing/customer-portal'}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Usage Card */}
      <div className="bg-white p-8 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4">Uso Actual</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Productos</span>
              <span className="text-sm font-medium">345 / {currentPlan.products}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(345 / currentPlan.products) * 100}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Almacenamiento</span>
              <span className="text-sm font-medium">5.2 GB / {currentPlan.storage}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${(5.2 / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Card */}
      <div className="bg-white p-8 rounded-lg shadow mb-8">
        <h2 className="text-2xl font-bold mb-4">Método de Pago</h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-gray-600 text-sm mb-2">Tarjeta registrada</p>
          <p className="font-mono">•••• •••• •••• {subscription.cardLast4}</p>
          <p className="text-sm text-gray-500 mt-1">Expira {subscription.cardExpiry}</p>
        </div>
        <button
          onClick={() => window.location.href = '/api/billing/update-payment-method'}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Actualizar Método de Pago
        </button>
      </div>

      {/* Invoices Card */}
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Facturas Recientes</h2>
        <InvoiceTable storeId={params.storeId} />
      </div>
    </div>
  )
}

function InvoiceTable({ storeId }: { storeId: string }) {
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/billing/invoices?storeId=${storeId}`)
      .then(r => r.json())
      .then(data => setInvoices(data.invoices))
  }, [storeId])

  return (
    <table className="w-full">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Fecha</th>
          <th className="px-4 py-2 text-left">Número</th>
          <th className="px-4 py-2 text-left">Monto</th>
          <th className="px-4 py-2 text-left">Estado</th>
          <th className="px-4 py-2 text-left">Acción</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map(invoice => (
          <tr key={invoice.id} className="border-t">
            <td className="px-4 py-3">{new Date(invoice.issuedAt).toLocaleDateString()}</td>
            <td className="px-4 py-3 font-mono">{invoice.number}</td>
            <td className="px-4 py-3">${(invoice.amountTotal / 100).toFixed(2)} MXN</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
              </span>
            </td>
            <td className="px-4 py-3">
              <a href={invoice.pdfUrl} className="text-blue-600 hover:underline">Descargar PDF</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- **Entregable**: Billing portal page with plan, usage, payment method

**25.5 - Plan Selection & Upgrade**

- Crear `/app/dashboard/[storeId]/billing/upgrade/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Plans } from '@/lib/billing/plans'
import { upgradePlan } from '@/lib/billing/actions'

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('PROFESSIONAL')
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(false)

  const planList = [
    { key: 'STARTER', ...Plans.STARTER },
    { key: 'PROFESSIONAL', ...Plans.PROFESSIONAL },
    { key: 'ENTERPRISE', ...Plans.ENTERPRISE }
  ]

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const { checkoutUrl } = await upgradePlan(selectedPlan, billingPeriod)
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Upgrade failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-4">Elige Tu Plan</h1>
      <p className="text-center text-gray-600 mb-8">Cambia cuando lo necesites</p>

      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('month')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              billingPeriod === 'month'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-700'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingPeriod('year')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              billingPeriod === 'year'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-700'
            }`}
          >
            Anual (10% descuento)
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {planList.map(plan => (
          <div
            key={plan.key}
            onClick={() => setSelectedPlan(plan.key)}
            className={`border-2 rounded-lg p-8 cursor-pointer transition ${
              selectedPlan === plan.key
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

            {plan.key === 'ENTERPRISE' ? (
              <p className="text-3xl font-bold text-gray-900 mb-6">Personalizado</p>
            ) : (
              <p className="text-3xl font-bold text-gray-900 mb-6">
                ${(plan.price / 100).toFixed(0)}
                <span className="text-lg text-gray-600">/mes</span>
              </p>
            )}

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>{plan.products.toLocaleString()} productos</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span>{plan.storage} almacenamiento</span>
              </li>
              {plan.features.map(feature => (
                <li key={feature} className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setSelectedPlan(plan.key)}
              className={`w-full py-3 rounded-lg font-medium transition ${
                selectedPlan === plan.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {selectedPlan === plan.key ? 'Seleccionado' : 'Seleccionar'}
            </button>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Procesando...' : 'Cambiar a ' + Plans[selectedPlan].name}
        </button>
      </div>
    </div>
  )
}
```

- **Entregable**: Plan selection UI with annual discount

**25.6 - Stripe Checkout Session**

- Crear `/app/api/billing/checkout` POST

```typescript
import { requireAuth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await requireAuth();
  const { planId, billingPeriod } = await req.json();

  // Validar tenant
  const tenant = await db.tenant.findUnique({
    where: { id: req.headers.get("x-tenant-id") },
  });
  if (!tenant || tenant.userId !== session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get stripe customer or create
  let customerId = tenant.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name,
      metadata: { tenantId: tenant.id },
    });
    customerId = customer.id;
    await db.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Crear checkout session
  const stripePriceId =
    billingPeriod === "year"
      ? `price_${planId.toLowerCase()}_annual`
      : `price_${planId.toLowerCase()}_monthly`;

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/${tenant.id}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/${tenant.id}/billing/upgrade`,
    metadata: {
      tenantId: tenant.id,
      planId,
    },
  });

  return Response.json({ url: checkoutSession.url });
}
```

- **Entregable**: Checkout session creation API

**25.7 - Stripe Webhook Handling**

- Crear `/app/api/webhooks/stripe` POST

```typescript
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Webhook signature verification failed", error);
    return new Response("Webhook Error", { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return new Response(JSON.stringify({ received: true }));
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { tenantId, planId } = session.metadata!;

        // Crear subscription en DB
        await db.subscription.create({
          data: {
            tenantId,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            planId,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Update tenant plan
        await db.tenant.update({
          where: { id: tenantId },
          data: { planId },
        });

        // Enviar email de bienvenida
        await sendWelcomeEmail(tenantId, planId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await db.invoice.update({
          where: { stripeInvoiceId: invoice.id },
          data: { status: "paid", paidAt: new Date() },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // Notificar al usuario
        await notifyPaymentFailed(invoice);
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing failed", error);
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }));
}
```

- **Entregable**: Webhook handler with all billing events

**25.8 - Invoice Generation & Storage**

- Crear `/lib/billing/invoice-generator.ts`

```typescript
import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import { db } from "@/lib/db";

export async function generateInvoicePDF(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { subscription: true },
  });

  if (!invoice) throw new Error("Invoice not found");

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { height, width } = page.getSize();

  // Header
  page.drawText("FACTURA", {
    x: 50,
    y: height - 50,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText(`#${invoice.number}`, {
    x: width - 150,
    y: height - 50,
    size: 18,
    color: rgb(0, 0, 0),
  });

  // Company info
  page.drawText("Mi Tienda Online", {
    x: 50,
    y: height - 100,
    size: 12,
    font: undefined,
  });

  page.drawText(invoice.customerName, {
    x: 50,
    y: height - 150,
    size: 11,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(invoice.customerEmail, {
    x: 50,
    y: height - 170,
    size: 11,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Issued & Due dates
  page.drawText(`Emitida: ${new Date(invoice.issuedAt).toLocaleDateString("es-MX")}`, {
    x: width - 150,
    y: height - 150,
    size: 11,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Amount
  page.drawText("Monto Total:", {
    x: 50,
    y: 200,
    size: 14,
    color: rgb(0, 0, 0),
  });

  page.drawText(`$${(invoice.amountTotal / 100).toFixed(2)} ${invoice.currency}`, {
    x: 50,
    y: 180,
    size: 20,
    color: rgb(0, 102, 204),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function storeInvoicePDF(invoiceId: string) {
  const pdfBytes = await generateInvoicePDF(invoiceId);

  // Guardar en S3 o storage
  const filename = `invoices/${invoiceId}.pdf`;
  const url = await uploadToStorage(filename, pdfBytes);

  // Update invoice con PDF URL
  await db.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl: url },
  });

  return url;
}
```

- **Entregable**: PDF invoice generation and storage

**25.9 - Invoice History & Download**

- Crear `/app/dashboard/[storeId]/billing/invoices/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function InvoicesPage({ params }: { params: { storeId: string } }) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: 'all',
    from: '',
    to: ''
  })

  useEffect(() => {
    fetch(`/api/billing/invoices?${new URLSearchParams({
      storeId: params.storeId,
      status: filters.status,
      from: filters.from,
      to: filters.to
    })}`)
      .then(r => r.json())
      .then(data => setInvoices(data.invoices))
  }, [filters, params.storeId])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Facturas</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Todas</option>
            <option value="paid">Pagadas</option>
            <option value="pending">Pendientes</option>
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="px-4 py-2 border rounded-lg"
            placeholder="Desde"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="px-4 py-2 border rounded-lg"
            placeholder="Hasta"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Número</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Monto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-sm">{invoice.number}</td>
                <td className="px-6 py-3 text-sm">{new Date(invoice.issuedAt).toLocaleDateString('es-MX')}</td>
                <td className="px-6 py-3 text-sm font-medium">${(invoice.amountTotal / 100).toFixed(2)}</td>
                <td className="px-6 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <a href={invoice.pdfUrl} className="text-blue-600 hover:underline">Descargar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- **Entregable**: Invoice history with filtering and download

**25.10 - Payment Method Management**

- Crear `/app/dashboard/[storeId]/billing/payment-methods/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function PaymentMethodsPage({ params }: { params: { storeId: string } }) {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [defaultMethod, setDefaultMethod] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/billing/payment-methods?storeId=${params.storeId}`)
      .then(r => r.json())
      .then(data => {
        setPaymentMethods(data.methods)
        setDefaultMethod(data.default)
      })
  }, [params.storeId])

  const handleAddNew = async () => {
    const { setupUrl } = await fetch('/api/billing/setup-intent', {
      method: 'POST',
      body: JSON.stringify({ storeId: params.storeId })
    }).then(r => r.json())

    window.location.href = setupUrl
  }

  const handleSetDefault = async (methodId: string) => {
    await fetch(`/api/billing/payment-methods/${methodId}/default`, {
      method: 'POST',
      body: JSON.stringify({ storeId: params.storeId })
    })
    setDefaultMethod(methodId)
  }

  const handleDelete = async (methodId: string) => {
    if (!confirm('¿Seguro?')) return
    await fetch(`/api/billing/payment-methods/${methodId}`, {
      method: 'DELETE',
      body: JSON.stringify({ storeId: params.storeId })
    })
    setPaymentMethods(pm => pm.filter(m => m.id !== methodId))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Métodos de Pago</h1>

      {paymentMethods.map(method => (
        <div key={method.id} className="bg-white p-6 rounded-lg shadow mb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-mono text-lg mb-2">
                •••• •••• •••• {method.last4}
              </div>
              <div className="text-sm text-gray-600">
                Expira {method.expiry}
              </div>
            </div>
            <div className="flex gap-2">
              {defaultMethod !== method.id && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  Establecer Default
                </button>
              )}
              {defaultMethod === method.id && (
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                  Default
                </span>
              )}
              <button
                onClick={() => handleDelete(method.id)}
                className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={handleAddNew}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 mt-6"
      >
        Agregar Método de Pago
      </button>
    </div>
  )
}
```

- **Entregable**: Payment method management UI

**25.11 - Billing Settings & Tax**

- Crear `/app/dashboard/[storeId]/billing/settings/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { updateBillingSettings } from '@/lib/billing/actions'

export default function BillingSettingsPage({ params }: { params: { storeId: string } }) {
  const [settings, setSettings] = useState({
    billingName: '',
    billingAddress: '',
    billingCity: '',
    billingZip: '',
    taxId: '', // RFC
    billingEmail: '',
    timezone: 'America/Mexico_City',
    language: 'es'
  })

  const handleSave = async () => {
    await updateBillingSettings(params.storeId, settings)
    alert('Configuración guardada')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Configuración de Facturación</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Nombre para Facturación</label>
          <input
            type="text"
            value={settings.billingName}
            onChange={(e) => setSettings({ ...settings, billingName: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Dirección</label>
          <input
            type="text"
            value={settings.billingAddress}
            onChange={(e) => setSettings({ ...settings, billingAddress: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Ciudad</label>
            <input
              type="text"
              value={settings.billingCity}
              onChange={(e) => setSettings({ ...settings, billingCity: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Código Postal</label>
            <input
              type="text"
              value={settings.billingZip}
              onChange={(e) => setSettings({ ...settings, billingZip: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">RFC</label>
          <input
            type="text"
            value={settings.taxId}
            onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
            placeholder="ABC123456XXX"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Email para Facturas</label>
          <input
            type="email"
            value={settings.billingEmail}
            onChange={(e) => setSettings({ ...settings, billingEmail: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  )
}
```

- **Entregable**: Billing settings page with tax ID

**25.12 - Dunning Management**

- Crear `/lib/billing/dunning.ts`

```typescript
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function handlePaymentFailed(invoiceId: string, error: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { subscription: { include: { tenant: true } } },
  });

  if (!invoice) return;

  const subscription = invoice.subscription;
  const failCount = subscription!.failedPaymentCount + 1;

  // Actualizar contador
  await db.subscription.update({
    where: { id: subscription!.id },
    data: { failedPaymentCount: failCount },
  });

  // Reintento: Día 1, 3, 5
  if (failCount === 1 || failCount === 2 || failCount === 3) {
    // Reintento automático en Stripe (configurado en dashboard)
    await sendEmail({
      to: invoice.customerEmail,
      subject: "Payment Failed - We'll retry",
      template: "payment-failed",
      data: {
        customerName: invoice.customerName,
        amount: (invoice.amountTotal / 100).toFixed(2),
        retryDate: getRetryDate(failCount),
      },
    });
  }

  // Después de 3 intentos fallidos
  if (failCount >= 3) {
    // Suspender subscription
    await db.subscription.update({
      where: { id: subscription!.id },
      data: { status: "past_due" },
    });

    // Notificar
    await sendEmail({
      to: invoice.customerEmail,
      subject: "Subscription Suspended - Final Notice",
      template: "subscription-suspended",
      data: {
        customerName: invoice.customerName,
        storeName: subscription!.tenant.name,
      },
    });
  }
}

function getRetryDate(attemptNumber: number): string {
  const dates = [1, 3, 5]; // días
  const daysToAdd = dates[attemptNumber - 1] || 7;
  const date = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString("es-MX");
}
```

- **Entregable**: Dunning flow with automatic retries

---

## SEMANA 26: COMPLIANCE, PRIVACIDAD Y AUDITORÍA

### Objetivo Específico

Implementar requisitos de compliance GDPR, CCPA, auditoría completa, y privacidad de datos con máximo detalle.

### Tareas Detalladas

**26.1 - GDPR Privacy Policy Page**

- Crear `/app/legal/privacy/page.tsx`

```typescript
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>

      <div className="prose max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Información que Recopilamos</h2>
          <p>Recopilamos información que proporcionas directamente:</p>
          <ul>
            <li>Nombre, email, dirección al registrarte</li>
            <li>Información de pago (procesada por Stripe, no almacenada por nosotros)</li>
            <li>Historial de compras y preferencias</li>
            <li>Comunicaciones con nuestro equipo de soporte</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Cómo Usamos Tu Información</h2>
          <p>Usamos tu información para:</p>
          <ul>
            <li>Procesar transacciones</li>
            <li>Enviar actualizaciones de pedidos</li>
            <li>Mejorar nuestros servicios</li>
            <li>Cumplir obligaciones legales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Tus Derechos (GDPR)</h2>
          <p>Tienes derecho a:</p>
          <ul>
            <li><strong>Acceso</strong>: Descargar todos tus datos</li>
            <li><strong>Rectificación</strong>: Corregir información incorrecta</li>
            <li><strong>Eliminación</strong>: Solicitar borrar tus datos</li>
            <li><strong>Restricción</strong>: Limitar cómo usamos tus datos</li>
            <li><strong>Portabilidad</strong>: Recibir datos en formato estructurado</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Seguridad de Datos</h2>
          <p>
            Protegemos tus datos con:
          </p>
          <ul>
            <li>Encriptación en tránsito (HTTPS)</li>
            <li>Encriptación en reposo (AES-256)</li>
            <li>Contraseñas hasheadas con bcrypt</li>
            <li>Acceso limitado por roles</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Contacto</h2>
          <p>Para preguntas sobre privacidad: privacy@example.com</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t text-sm text-gray-600">
        <p>Última actualización: {new Date().toLocaleDateString('es-MX')}</p>
        <p>Versión 1.0 - En conformidad con GDPR y CCPA</p>
      </div>
    </div>
  )
}
```

- Versionado (cambios requieren opt-in nuevo)
- Traducción ES/EN
- **Entregable**: Privacy policy page with GDPR compliance

**26.2 - Data Export (GDPR Right)**

- Crear `/app/api/users/me/export` POST

```typescript
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToStorage } from "@/lib/storage";
import JSZip from "jszip";

export async function POST(req: Request) {
  const session = await requireAuth();
  const user = session.user;

  // Recopila todos los datos del usuario
  const profile = await db.user.findUnique({
    where: { id: user.id },
  });

  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: true, address: true },
  });

  const reviews = await db.review.findMany({
    where: { userId: user.id },
  });

  const preferences = await db.userPreference.findUnique({
    where: { userId: user.id },
  });

  const activityLog = await db.auditLog.findMany({
    where: { userId: user.id },
  });

  // Crear ZIP con JSON files
  const zip = new JSZip();
  zip.file("profile.json", JSON.stringify(profile, null, 2));
  zip.file("orders.json", JSON.stringify(orders, null, 2));
  zip.file("reviews.json", JSON.stringify(reviews, null, 2));
  zip.file("preferences.json", JSON.stringify(preferences, null, 2));
  zip.file("activity.json", JSON.stringify(activityLog, null, 2));

  const buffer = await zip.generateAsync({ type: "arraybuffer" });

  // Guardar en storage
  const filename = `exports/${user.id}-${Date.now()}.zip`;
  const downloadUrl = await uploadToStorage(filename, buffer);

  // Generar token de descarga (válido 30 días)
  const downloadToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.dataExport.create({
    data: {
      userId: user.id,
      token: downloadToken,
      downloadUrl,
      expiresAt,
      downloadedAt: null,
    },
  });

  // Enviar email con link
  await sendEmail({
    to: user.email,
    subject: "Your Data Export is Ready",
    template: "data-export-ready",
    data: {
      downloadLink: `${process.env.NEXT_PUBLIC_URL}/api/users/me/download-export?token=${downloadToken}`,
    },
  });

  return Response.json({
    message: "Export created. Check your email for download link.",
    expiresAt,
  });
}
```

- **Entregable**: Data export API with 30-day expiration

**26.3 - Data Deletion (Right to Be Forgotten)**

- Crear `/app/api/users/me/delete-request` POST

```typescript
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await requireAuth();
  const user = session.user;

  // Crear solicitud de eliminación
  const deleteRequest = await db.deleteRequest.create({
    data: {
      userId: user.id,
      status: "pending", // pending → approved → executed
      requestedAt: new Date(),
      executionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días de gracia
    },
  });

  // Enviar confirmación
  await sendEmail({
    to: user.email,
    subject: "Account Deletion Request Received",
    template: "deletion-request-received",
    data: {
      executionDate: deleteRequest.executionDate,
      cancelLink: `${process.env.NEXT_PUBLIC_URL}/api/users/me/cancel-deletion?token=${deleteRequest.token}`,
    },
  });

  return Response.json({
    message: "Deletion request created. You have 30 days to cancel.",
    requestId: deleteRequest.id,
    executionDate: deleteRequest.executionDate,
  });
}
```

- Período de gracia: 30 días
- Ejecutar eliminación: pseudonimizar o borrar permanentemente
- **Entregable**: Deletion request API with grace period

**26.4 - Consent Management**

- Crear Prisma model:

```prisma
model Consent {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  type String // marketing, analytics, cookies, profiling
  granted Boolean
  version Int // policy version

  grantedAt DateTime
  revokedAt DateTime?

  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, type, version])
  @@index([userId])
  @@index([type])
}
```

- **Entregable**: Consent tracking schema

**26.5 - Cookie Banner & Consent UI**

- Crear `/components/CookieBanner.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { saveConsent, getConsent } from '@/lib/consent'

export default function CookieBanner() {
  const [show, setShow] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true,
    marketing: false,
    analytics: false
  })

  useEffect(() => {
    // Check if user already gave consent
    const existing = getConsent()
    if (!existing) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const handleAcceptAll = async () => {
    await saveConsent({
      essential: true,
      marketing: true,
      analytics: true
    })
    setShow(false)
  }

  const handleRejectAll = async () => {
    await saveConsent({
      essential: true,
      marketing: false,
      analytics: false
    })
    setShow(false)
  }

  const handleCustomize = async () => {
    await saveConsent(preferences)
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-bold mb-3">Configuración de Cookies</h2>
        <p className="text-sm text-gray-600 mb-4">
          Usamos cookies para mejorar tu experiencia. Puedes aceptar todas o personalizar.
        </p>

        <div className="space-y-2 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.essential}
              disabled
              className="mr-2"
            />
            <span className="text-sm">
              <strong>Esenciales</strong> - Requeridas para funcionar (No se pueden desactivar)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">
              <strong>Marketing</strong> - Para campañas personalizadas
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">
              <strong>Analytics</strong> - Para entender cómo usas el sitio
            </span>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Aceptar Todas
          </button>
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            Rechazar Todas
          </button>
          <button
            onClick={handleCustomize}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  )
}
```

- Respetar DNT header del navegador
- Guardar en localStorage + DB
- **Entregable**: Cookie banner component with preferences

**26.6 - Audit Trail Complete**

- Crear Prisma model:

```prisma
model AuditLog {
  id String @id @default(cuid())
  userId String?
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  action String // create, update, delete, export, login, etc
  resource String // user, product, order, subscription
  resourceId String

  changes Json? // { before: {...}, after: {...} }

  ipAddress String
  userAgent String
  success Boolean @default(true)
  errorMessage String?

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
}
```

- **Entregable**: Audit log schema for all activities

**26.7 - Automatic Audit Logging Middleware**

- Crear `/lib/audit/audit-middleware.ts`

```typescript
import { db } from "@/lib/db";

export function auditMiddleware(
  action: string,
  resource: string,
  resourceId: string,
  userId?: string,
  changes?: { before: any; after: any },
) {
  return async (req: Request) => {
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    try {
      await db.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          changes,
          ipAddress,
          userAgent,
          success: true,
        },
      });
    } catch (error) {
      console.error("Audit logging failed", error);
    }
  };
}

// Usage en Prisma middleware
export function setupAuditMiddleware() {
  return db.$use(async (params, next) => {
    const result = await next(params);

    if (["create", "update", "delete"].includes(params.action)) {
      const session = await getServerSession();
      await auditMiddleware(
        params.action,
        params.model,
        params.args.where?.id || params.args.data?.id,
        session?.user?.id,
        { before: params.args.where, after: params.args.data },
      );
    }

    return result;
  });
}
```

- **Entregable**: Audit middleware implementation

**26.8 - Admin Audit Viewer**

- Crear `/app/dashboard/admin/audit/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetch(`/api/admin/audit-logs?${new URLSearchParams(filters)}`)
      .then(r => r.json())
      .then(data => setLogs(data.logs))
  }, [filters])

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Registro de Auditoría</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Usuario..."
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            className="px-4 py-2 border rounded-lg text-sm"
          />
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="">Todas las acciones</option>
            <option value="create">Crear</option>
            <option value="update">Actualizar</option>
            <option value="delete">Eliminar</option>
            <option value="export">Exportar</option>
          </select>
          <select
            value={filters.resource}
            onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="">Todos los recursos</option>
            <option value="user">Usuario</option>
            <option value="product">Producto</option>
            <option value="order">Orden</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border rounded-lg text-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-4 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left">Timestamp</th>
              <th className="px-6 py-3 text-left">Usuario</th>
              <th className="px-6 py-3 text-left">Acción</th>
              <th className="px-6 py-3 text-left">Recurso</th>
              <th className="px-6 py-3 text-left">IP</th>
              <th className="px-6 py-3 text-left">Cambios</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-6 py-3">{log.user?.email || 'System'}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-3">{log.resource}</td>
                <td className="px-6 py-3 font-mono text-xs">{log.ipAddress}</td>
                <td className="px-6 py-3">
                  <details>
                    <summary className="cursor-pointer text-blue-600">Ver</summary>
                    <pre className="bg-gray-50 p-2 text-xs overflow-auto max-h-48">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- **Entregable**: Audit log viewer with search

**26.9 - Data Retention Policy**

- Crear `/lib/data-retention/retention-service.ts`

```typescript
import { db } from "@/lib/db";

export async function executeRetentionPolicy() {
  const now = new Date();

  // Eliminar logs después de 365 días
  await db.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Eliminar órdenes después de 7 años (requisito fiscal)
  await db.order.updateMany({
    where: {
      createdAt: {
        lt: new Date(now.getTime() - 7 * 365 * 24 * 60 * 60 * 1000),
      },
    },
    data: {
      anonymized: true,
      // Borrar datos sensibles
    },
  });

  // Archivar datos viejos
  const oldData = await db.analyticsEvent.findMany({
    where: {
      createdAt: {
        lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      },
    },
    take: 10000,
  });

  if (oldData.length > 0) {
    // Enviar a archivo frío (S3 Glacier, etc)
    await archiveToColdstorage(oldData);

    await db.analyticsEvent.deleteMany({
      where: {
        id: { in: oldData.map((d) => d.id) },
      },
    });
  }

  console.log("Data retention policy executed");
}

// Cron job: Ejecuta cada noche a las 2 AM
export function scheduleRetentionPolicy() {
  CronJob("0 2 * * *", executeRetentionPolicy);
}
```

- **Entregable**: Data retention service with cron job

**26.10 - Encryption at Rest**

- Configurar en `/lib/security/encryption.ts`

```typescript
// Passwords: bcrypt (nunca hasheamos manualmente)
import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Tokens: JWT (secreto en env)
import jwt from "jsonwebtoken";

export function createToken(payload: any, expiresIn = "7d") {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    throw new Error("Invalid token");
  }
}

// Payment data: NUNCA almacenado localmente
// - Credit cards tokenizadas en Stripe
// - Stripe Customer ID en DB
// - No guardamos números de tarjeta, expiry, CVV
```

- **Entregable**: Encryption configuration

**26.11 - Security Headers**

- Crear `/lib/security/headers.ts` y usar en `next.config.js`

```javascript
// next.config.js
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https:; font-src 'self' https:; connect-src 'self' https://api.stripe.com https://api.example.com",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=()",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

- **Entregable**: Security headers configured

**26.12 - Compliance Checklist**

- Crear `/docs/COMPLIANCE.md`

```markdown
# Compliance Checklist

## GDPR Compliance

- [ ] Privacy policy published
- [ ] Data export functionality
- [ ] Data deletion functionality
- [ ] Consent management
- [ ] Audit logging
- [ ] Data retention policy
- [ ] Data processing agreement with vendors

## CCPA Compliance

- [ ] Privacy policy with CCPA section
- [ ] "Do Not Sell My Personal Information" link
- [ ] Data access API
- [ ] Deletion API
- [ ] Opt-out mechanisms

## PCI DSS

- [ ] No credit cards stored locally
- [ ] All payments via Stripe (PCI Level 1)
- [ ] HTTPS everywhere
- [ ] Network segmentation

## Data Security

- [ ] Passwords hashed (bcrypt)
- [ ] Tokens encrypted (JWT)
- [ ] Database encryption (Neon)
- [ ] TLS 1.2+ required
- [ ] No hardcoded secrets

## Vendor Compliance

- [ ] Stripe agreement reviewed
- [ ] Google Analytics GDPR compliant
- [ ] Email provider (Resend) compliant
- [ ] All 3rd parties have DPA
```

- **Entregable**: Compliance documentation

---

Continúo con las Semanas 27-28 y el resto del plan (29-56) con el mismo nivel de detalle...

_El documento es muy extenso, así que lo dividiré en partes. Continuaré con Semanas 27-28, 29-36, 37-44, 45-52, 53-56 en el siguiente bloque._
