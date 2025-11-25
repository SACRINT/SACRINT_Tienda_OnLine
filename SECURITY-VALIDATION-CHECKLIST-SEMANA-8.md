# Security Validation Checklist - Semana 8

## Validación Completa de Seguridad Pre-Producción

**Fecha**: 25 Noviembre 2025
**Responsable**: Security & Backend Team
**Objetivo**: Validar que NO hay vulnerabilidades antes de ir a producción
**ETA**: 3 horas (auditoría + fixes si es necesario)
**Prioridad**: 🔴 CRÍTICA

---

## 🔐 SECCIÓN 1: SECURITY HEADERS

### 1.1 X-Frame-Options

**Propósito**: Prevenir clickjacking attacks

**Verificación**:

```bash
# En DevTools → Network → Selecciona cualquier response
# Busca header: "X-Frame-Options: DENY"

# O desde terminal:
curl -i https://localhost:3000 | grep -i x-frame-options
```

**Debe mostrar**: `X-Frame-Options: DENY`

**Si falta**, agregar en `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ];
}
```

**Resultado**: ☐ Presente ☐ Falta (FIX REQUERIDO)

---

### 1.2 X-Content-Type-Options

**Propósito**: Prevenir MIME sniffing attacks

**Verificación**:

```bash
curl -i https://localhost:3000 | grep -i x-content-type-options
```

**Debe mostrar**: `X-Content-Type-Options: nosniff`

**Resultado**: ☐ Presente ☐ Falta (FIX REQUERIDO)

---

### 1.3 Strict-Transport-Security (HSTS)

**Propósito**: Forzar HTTPS

**Verificación**:

```bash
curl -i https://localhost:3000 | grep -i strict-transport-security
```

**Debe mostrar**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`

**En Desarrollo** (localhost):

- HSTS se puede omitir porque es HTTP local

**En Producción** (https://domain.com):

- Es OBLIGATORIO

**Resultado**: ☐ Presente (Prod) ☐ OK para Dev ☐ Falta (FIX REQUERIDO)

---

### 1.4 Content-Security-Policy (CSP)

**Propósito**: Prevenir XSS attacks

**Verificación**:

```bash
curl -i https://localhost:3000 | grep -i content-security-policy
```

**Debería incluir**:

- `default-src 'self'` - Solo recursos del mismo origen
- `script-src 'self'` - Solo scripts propios
- `style-src 'self' 'unsafe-inline'` - CSS (inline para primeros estilos)
- `img-src 'self' data: https:` - Imágenes
- `font-src 'self'` - Fonts
- `connect-src 'self' https://api.stripe.com https://api.resend.com` - APIs externas

**Ejemplo completo**:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.stripe.com https://api.resend.com;
```

**Resultado**: ☐ Bien configurado ☐ Requiere ajuste ☐ Falta (FIX REQUERIDO)

---

### 1.5 X-XSS-Protection

**Propósito**: Protección adicional contra XSS en navegadores antiguos

**Verificación**:

```bash
curl -i https://localhost:3000 | grep -i x-xss-protection
```

**Debe mostrar**: `X-XSS-Protection: 1; mode=block`

**Resultado**: ☐ Presente ☐ Falta (es opcional pero recomendado)

---

## 🔑 SECCIÓN 2: AUTENTICACIÓN

### 2.1 NextAuth Session Validation

**Propósito**: Validar que las sesiones son seguras

**Pasos**:

1. Accede a una página protegida (ej: `/dashboard`)
2. DevTools → Application → Cookies
3. Verifica que exista cookie `next-auth.session-token` o `next-auth-callback-url`
4. Propiedades requeridas:
   - ✓ `HttpOnly` (no accesible desde JavaScript)
   - ✓ `Secure` (solo HTTPS)
   - ✓ `SameSite=Lax` o `SameSite=Strict`
   - ✓ Expiry < 24 horas

**Ejemplo correcto**:

```
Name: next-auth.session-token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain: localhost
Path: /
Expires: [menos de 24 horas]
HttpOnly: ✓
Secure: ✓ (en HTTPS)
SameSite: Lax
```

**Resultado**: ☐ Bien configurado ☐ Requiere ajuste ☐ Falta (FIX REQUERIDO)

---

### 2.2 CSRF Token en Forms

**Propósito**: Prevenir Cross-Site Request Forgery

**Verificación**:

1. Abre una página con formulario (ej: checkout)
2. DevTools → Network → Filtra por XHR/Fetch
3. Completa formulario y envía
4. En la request, verifica header `X-CSRF-Token` o similar en body
5. El token debe ser **único por sesión**

**O revisa el código**:

```bash
# Busca en checkout/page.tsx
grep -r "csrf\|CSRF" src/
```

**Resultado**: ☐ Presente ☐ Requiere implementación ☐ Falta (FIX REQUERIDO)

---

### 2.3 JWT Expiry

**Propósito**: Tokens deben expirar rápidamente

**Verificación**:

1. Abre DevTools → Storage → Cookies
2. Busca tokens JWT (comienzan con `ey`)
3. Decodifica en https://jwt.io
4. Verifica campo `exp` (expiration timestamp)
5. Debe ser < 24 horas desde `iat` (issued at)

**O revisa la configuración**:

```typescript
// En /src/lib/auth/auth.config.ts
export const authConfig = {
  session: {
    maxAge: 86400, // 24 horas en segundos
  },
  jwt: {
    maxAge: 86400,
  },
};
```

**Resultado**: ☐ < 24 horas ☐ >= 24 horas (SECURITY ISSUE) ☐ No usa JWT

---

### 2.4 Refresh Token Rotation

**Propósito**: Prevenir token theft

**Verificación**:

1. En la sesión, debe haber rotation de refresh tokens
2. Cada vez que se usa un refresh token, se debe generar uno nuevo

**Código esperado en** `/src/lib/auth/server.ts`:

```typescript
async function refreshAccessToken(token) {
  // Generar nuevo access token
  // Generar nuevo refresh token
  // Invalidar el antiguo
  return { accessToken, refreshToken };
}
```

**Resultado**: ☐ Implementado ☐ Requiere implementación ☐ No aplica

---

### 2.5 Logout Clears Session

**Propósito**: Sesión debe ser eliminada al hacer logout

**Verificación**:

1. Accede a una página protegida
2. Nota que estás logueado
3. Haz logout (ej: en profile menu)
4. Intenta acceder a página protegida nuevamente
5. Debe redirigir a login

**O verifica en DevTools**:

```bash
# Antes de logout
document.cookie  # Debe tener next-auth cookies

# Después de logout
document.cookie  # Debe estar vacío
```

**Resultado**: ☐ Funciona ☐ No funciona (BUG)

---

## 🗄️ SECCIÓN 3: DATABASE SECURITY

### 3.1 Passwords Hashed with bcrypt

**Propósito**: Nunca almacenar passwords en texto plano

**Verificación**:

1. Accede a la BD (Neon dashboard)
2. Busca tabla `User`
3. Selecciona columna `password`
4. Verifica que todos los valores comienzan con `$2a$` o `$2b$` (bcrypt format)
5. Ejemplo: `$2b$12$abcdefghijklmnopqrstuvwxyz...`

**O revisa el código**:

```typescript
// Debe estar en /src/lib/auth/actions.ts o similar
import bcrypt from "bcrypt";

export async function signup(email, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  // guardar hashedPassword en BD, NO password original
}
```

**Resultado**: ☐ Todos hashed ☐ Algunos en texto plano (CRITICAL SECURITY ISSUE)

---

### 3.2 Sensitive Data Encrypted

**Propósito**: No almacenar datos sensibles sin encripción

**Verificación**:

1. Accede a BD
2. Busca si hay campos con datos sensibles:
   - ❌ Números de tarjeta completos
   - ❌ SSN (Social Security Number)
   - ❌ Tokens API sin encripción
3. Estos datos NO deben estar en texto plano

**¿Dónde SÍ se pueden tener**:

- ✅ Últimos 4 dígitos de tarjeta (para referencia)
- ✅ Stripe Payment Intent ID
- ✅ Stripe Customer ID

**¿Dónde NO deben estar**:

- ❌ Número de tarjeta completo (Stripe maneja)
- ❌ CVV/CVC (Stripe maneja)
- ❌ Información personal delicada sin encripción

**Resultado**: ☐ Cumple ☐ Datos sensibles encontrados (FIX REQUERIDO)

---

### 3.3 RBAC en Todas las APIs

**Propósito**: Validar que usuarios solo acceden a sus datos

**Verificación**:

1. Abre la API `/api/orders` como usuario A
2. Intenta acceder a órdenes de usuario B
3. Debe retornar 403 Forbidden o datos vacíos

**Código esperado en todas las APIs**:

```typescript
// /src/app/api/orders/route.ts
export async function GET(req: Request) {
  const session = await getServerSession(); // ← Validar sesión
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;

  const orders = await db.order.findMany({
    where: {
      userId: userId, // ← OBLIGATORIO: filtrar por usuario actual
      tenantId: session.user.tenantId, // ← Aislamiento multi-tenant
    },
  });

  return Response.json(orders);
}
```

**Checklist por endpoint**:

- [ ] GET /api/products - sin auth (público)
- [ ] GET /api/orders - con auth, filtrado por usuario
- [ ] POST /api/orders - con auth, valida usuario
- [ ] PUT /api/orders/[id] - con auth, valida owner
- [ ] DELETE /api/orders/[id] - con auth, valida owner
- [ ] GET /api/admin/\* - con auth, valida SUPER_ADMIN

**Resultado**: ☐ Todas validadas ☐ Algunas faltan (SECURITY ISSUE)

---

### 3.4 Multi-tenant Isolation 100%

**Propósito**: Datos de Tenant A nunca deben ser visibles por Tenant B

**Verificación**:

```bash
# En cualquier query crítica, busca 'tenantId'
grep -r "where.*tenantId" src/lib/db/
grep -r "where.*tenantId" src/app/api/
```

**Todas las queries deben incluir**:

```typescript
where: {
  tenantId: currentUserTenantId, // ← SIEMPRE presente
  ...otherFilters
}
```

**Resultado**: ☐ 100% aislado ☐ Datos pueden mezclarse (CRITICAL ISSUE)

---

## 🔗 SECCIÓN 4: API SECURITY

### 4.1 Todas las Requests Requieren Auth

**Propósito**: Excepto rutas públicas, todas deben validar sesión

**Excepciones permitidas**:

- GET /api/health (health check)
- GET /api/products (catálogo público)
- POST /api/auth/signup (registro)
- POST /api/auth/login (login)
- POST /api/webhooks/stripe (Stripe webhook - validado por signature)

**Todas las demás deben tener**:

```typescript
const session = await getServerSession();
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

**Verificación**:

```bash
# Sin auth, debe retornar 401
curl -X GET https://localhost:3000/api/orders
# Response: {"error": "Unauthorized"} o similar

# Con auth, debe funcionar
curl -H "Authorization: Bearer token" https://localhost:3000/api/orders
# Response: órdenes del usuario
```

**Resultado**: ☐ Todas protegidas ☐ Algunas expuestas (FIX REQUERIDO)

---

### 4.2 Rate Limiting en Endpoints Críticos

**Propósito**: Prevenir brute force attacks

**Endpoints que deben tener rate limiting**:

- POST /api/auth/signup (5 requests / min por IP)
- POST /api/auth/login (10 requests / min por IP)
- POST /api/checkout/session (3 requests / min por usuario)
- GET /api/search (30 requests / min por IP)

**Implementación con Redis/Upstash** (TIER 3 - opcional por ahora):

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // ... resto del código
}
```

**Resultado (para Semana 8)**: ☐ Implementado ☐ Pendiente para Semana 9 (TIER 3)

---

### 4.3 Input Validation con Zod en Todas las APIs

**Propósito**: Rechazar datos inválidos en el servidor

**Verificación**:

```bash
grep -r "zodResolver\|z.object" src/app/api/
```

**Ejemplo correcto**:

```typescript
import { z } from "zod";

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().min(1).max(1000),
    }),
  ),
  addressId: z.string().uuid(),
});

export async function POST(req: Request) {
  const body = await req.json();

  // ← Validación SERVER SIDE
  const validatedData = CreateOrderSchema.parse(body);

  if (!validatedData) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  // ... procesar
}
```

**Resultado**: ☐ Todas validadas ☐ Algunas faltan (FIX REQUERIDO)

---

### 4.4 SQL Injection Prevention (Prisma Prepared Statements)

**Propósito**: Prevenir SQL injection

**Verificación**:

```bash
# Buscar raw SQL queries (peligroso)
grep -r "\$queryRaw\|queryRaw\|Prisma\.sql" src/
```

**Correcto - Usar Prisma ORM**:

```typescript
// ✅ Seguro: Prisma escape automáticamente
const user = await db.user.findUnique({
  where: { email: userInput },
});

// ❌ PELIGROSO: raw SQL
const user = db.$queryRaw(`SELECT * FROM User WHERE email = '${userInput}'`);
```

**Resultado**: ☐ Solo usa Prisma ORM ☐ Encontrados raw queries (CRITICAL ISSUE)

---

### 4.5 XSS Prevention en Respuestas

**Propósito**: Escapar HTML en respuestas

**Verificación**:

1. En Step 1 del checkout, ingresa: `<script>alert('xss')</script>` en "Nombre"
2. Avanza a Step 4
3. Verifica que el nombre aparece escapado, NO ejecuta script

**Resultado correcto**:

```
Nombre mostrado: <script>alert('xss')</script>
Console: (sin errores)
Script: (no se ejecuta)
```

**Resultado**: ☐ XSS prevenido ☐ Script se ejecuta (CRITICAL ISSUE)

---

## 💳 SECCIÓN 5: STRIPE INTEGRATION

### 5.1 Webhook Signature Validation

**Propósito**: Validar que webhooks vienen de Stripe

**Verificación** (en `/src/app/api/webhooks/stripe/route.ts`):

```typescript
import { stripe } from "@/lib/payments/stripe";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    // ← OBLIGATORIO: validar signature
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Solo procesar después de validar
  if (event.type === "checkout.session.completed") {
    // ...
  }
}
```

**Resultado**: ☐ Implementado ☐ Falta (FIX REQUERIDO)

---

### 5.2 PCI DSS Compliance

**Propósito**: Cumplir estándares de tarjetas de crédito

**Checklist**:

- ☐ Nunca almacenar número de tarjeta completo
- ☐ Nunca almacenar CVV/CVC
- ☐ HTTPS en todas las transacciones
- ☐ Usar Stripe Hosted Page o Stripe Elements
- ☐ No loguear datos de tarjeta

**Validación**:

```bash
# Buscar en logs
grep -r "4242\|card\|cvv\|cvc" src/ --include="*.log"
# Debe estar vacío
```

**Resultado**: ☐ Cumple ☐ Datos sensibles expuestos (CRITICAL ISSUE)

---

### 5.3 No Logs de Tarjetas

**Propósito**: Asegurar que números de tarjeta no aparecen en logs

**Verificación**:

```bash
# Buscar en todo el código
grep -r "console.log.*card\|console.log.*payment\|logger.*card" src/
# Debe estar vacío o debe loguear solo últimos 4 dígitos

# Ejemplo correcto:
console.log(`Payment processed for card ending in ${last4Digits}`)
```

**Resultado**: ☐ Logs limpios ☐ Datos sensibles encontrados (CRITICAL ISSUE)

---

### 5.4 Webhook Retry Handling

**Propósito**: Stripe puede reintentar webhooks

**Verificación**:

```typescript
// En webhook handler, debe ser idempotent
export async function POST(req: Request) {
  const event = parseWebhook(req);

  // Buscar si ya procesamos este webhook
  const existingEvent = await db.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent) {
    // Ya lo procesamos, retornar 200 sin procesar de nuevo
    return Response.json({ received: true });
  }

  // Procesar y guardar
  await db.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      // ... guardar y procesar
    },
  });

  return Response.json({ received: true });
}
```

**Resultado**: ☐ Implementado ☐ Puede duplicar órdenes (BUG)

---

## ✅ CHECKLIST FINAL DE SEGURIDAD

```
SECURITY HEADERS:
[ ] X-Frame-Options: DENY
[ ] X-Content-Type-Options: nosniff
[ ] Strict-Transport-Security (en producción)
[ ] Content-Security-Policy correcta
[ ] X-XSS-Protection: 1; mode=block

AUTENTICACIÓN:
[ ] NextAuth session validation
[ ] CSRF token en forms
[ ] JWT expiry < 24 horas
[ ] Refresh token rotation
[ ] Logout limpia sesión

DATABASE:
[ ] Passwords con bcrypt
[ ] Datos sensibles encriptados
[ ] RBAC en todas APIs
[ ] Multi-tenant isolation 100%

APIS:
[ ] Todas requieren auth (excepto públicas)
[ ] Rate limiting en endpoints críticos
[ ] Input validation Zod en servidor
[ ] SQL injection prevention (Prisma ORM)
[ ] XSS prevention en respuestas

STRIPE:
[ ] Webhook signature validation
[ ] PCI DSS compliance
[ ] No logs de tarjetas
[ ] Webhook retry handling idempotent

CUMPLIMIENTO GENERAL:
[ ] 0 vulnerabilidades críticas
[ ] 0 datos sensibles expuestos
[ ] 0 ataques XSS posibles
[ ] 0 SQL injection posible
[ ] RBAC funcional en todas APIs
```

---

## 🚨 SI SE ENCUENTRAN VULNERABILIDADES

### Críticas (Bloquean producción):

1. ⛔ Datos sensibles (tarjetas, passwords) en texto plano
2. ⛔ Falta RBAC (un usuario accede datos de otro)
3. ⛔ XSS sin prevención
4. ⛔ SQL injection posible
5. ⛔ Webhook signature sin validar

### Altas (Requieren fix antes de launch):

1. ⚠️ Falta rate limiting
2. ⚠️ Falta security headers
3. ⚠️ JWT sin expiry
4. ⚠️ Logout no limpia sesión

### Medias (Pueden hacerse post-launch):

1. ℹ️ Logging mejorado
2. ℹ️ Monitoreo con Sentry
3. ℹ️ Metricas de seguridad

---

## 👤 SIGNOFF DE SEGURIDAD

**Auditado por**: ******\_\_\_\_******
**Fecha**: ******\_\_\_\_******
**Vulnerabilidades Críticas Encontradas**: ☐ Sí ☐ No
**Estado**: ☐ APROBADO PARA PRODUCCIÓN ☐ REQUIERE FIXES ☐ BLOQUEADO

**Detalles si falta** (crear issues):

```
[Listar vulnerabilidades encontradas]
```

**Firma**: ******\_\_\_\_******

---

**IMPORTANTE**: Esta auditoría es MANDATORIA antes de cualquier deployment a producción. Si se encuentran vulnerabilidades críticas, NO proceder con launch hasta que estén resueltas.
