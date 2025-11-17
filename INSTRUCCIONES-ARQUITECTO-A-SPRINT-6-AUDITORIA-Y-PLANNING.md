# INSTRUCCIONES PARA ARQUITECTO A - Sprint 6
## Auditoría de Seguridad + Planning Sprint 6

**Fecha**: 17 de Noviembre, 2025
**Rama de trabajo**: `develop`
**Tiempo estimado**: 4-5 horas
**Prioridad**: CRÍTICA

---

## 📋 RESUMEN EJECUTIVO

Debes ejecutar **3 tareas en orden secuencial**:

1. **AUDITORÍA DE SEGURIDAD COMPLETA** (2-2.5 horas)
   - Revisar TODOS los endpoints API
   - Verificar tenant isolation
   - Validar RBAC
   - Identificar vulnerabilidades

2. **GENERAR REPORTE DE AUDITORÍA** (30 min)
   - Documentar hallazgos
   - Clasificar por severidad
   - Proponer fixes si aplica

3. **PLANNING SPRINT 6** (1.5-2 horas)
   - Identificar features pendientes para producción
   - Crear especificaciones técnicas
   - Definir timeline

**NO avances a la siguiente tarea hasta completar la anterior.**

---

## 🔐 TAREA 1: AUDITORÍA DE SEGURIDAD COMPLETA

### Objetivo
Verificar que el código implementado cumpla con estándares de seguridad bancaria.

### Checklist de Auditoría

#### A) TENANT ISOLATION - CRÍTICO ✓/✗

Revisar TODOS estos archivos y confirmar que CADA query filtre por `tenantId`:

**Backend DAL files** (`src/lib/db/`):
```
□ users.ts - Todas las queries filtan por tenantId
□ tenant.ts - Tenant access validation en cada función
□ products.ts - Filtro tenantId en findMany, findUnique, update, delete
□ categories.ts - Filtro tenantId en todas las operaciones
□ cart.ts - Filtro tenantId en carrito
□ orders.ts - Filtro tenantId en órdenes
□ reviews.ts - Filtro tenantId en reseñas
□ inventory.ts - Filtro tenantId en inventario
```

**Patrón esperado** (OBLIGATORIO):
```typescript
// ✅ CORRECTO
const product = await db.product.findUnique({
  where: { id: productId, tenantId: currentUserTenantId }
})

const products = await db.product.findMany({
  where: { tenantId: currentUserTenantId, ...filters }
})

// ❌ INCORRECTO (VULNERABILIDAD)
const product = await db.product.findUnique({ where: { id: productId } })
const products = await db.product.findMany({ where: {...filters} })
```

**Instrucciones específicas:**
1. Abre cada archivo en `src/lib/db/`
2. Para cada función pública (`export async function`):
   - Verifica que la función acepte `tenantId` como parámetro
   - Verifica que TODAS las queries usen `where: { tenantId, ...otherFilters }`
   - Si NO está, es VULNERABILIDAD CRÍTICA - documenta
3. Revisa `src/lib/security/index.ts` para función `ensureTenantAccess()`
   - Confirma que se llama al inicio de cada endpoint

---

#### B) RBAC (Role-Based Access Control) - CRÍTICO ✓/✗

Revisar archivo: `src/lib/auth/auth.config.ts`

**Patrón esperado:**
```typescript
// En callbacks.session
const userRole = user.role // Debe ser SUPER_ADMIN | STORE_OWNER | CUSTOMER
// Debe estar en JWT y session

// En cada endpoint, antes de operación
const session = await auth()
if (session.user.role !== 'STORE_OWNER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Checklist RBAC:**

```
□ auth.config.ts define 3 roles: SUPER_ADMIN, STORE_OWNER, CUSTOMER
□ JWT callback incluye role en token
□ Session callback incluye role en sesión
□ Middleware valida autenticación antes de rutas protegidas
□ Cada endpoint protegido verifica rol requerido
```

**Verificar en TODOS estos endpoints:**

```
/api/admin/* - Debe requerir STORE_OWNER o SUPER_ADMIN
/api/products/* (POST/PUT/DELETE) - Debe requerir STORE_OWNER
/api/categories/* (POST/PUT/DELETE) - Debe requerir STORE_OWNER
/api/orders/* - GET requiere autenticación, PUT requiere STORE_OWNER
/api/checkout/* - Requiere CUSTOMER autenticado
/api/cart/* - Requiere CUSTOMER autenticado
/api/reviews/* - POST requiere CUSTOMER, DELETE requiere CUSTOMER o admin
/api/inventory/* - Requiere STORE_OWNER
/api/tenants/* (POST/PUT/DELETE) - Requiere SUPER_ADMIN
```

**Instrucciones específicas:**
1. Abre cada archivo en `src/app/api/`
2. Al inicio de cada función GET/POST/PUT/DELETE:
   ```typescript
   const session = await auth()
   if (!session?.user) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
   if (session.user.role !== 'REQUIRED_ROLE') {
     return NextResponse.json({error: 'Forbidden'}, {status: 403})
   }
   ```
3. Si NO está, documenta como VULNERABILIDAD

---

#### C) VALIDACIÓN ZOD - IMPORTANTE ✓/✗

**Patrón esperado:** Todos los POST/PUT requieren validación Zod ANTES de procesar

```typescript
// ✅ CORRECTO
const parsed = CreateProductSchema.parse(req.body)
const product = await createProduct(parsed)

// ❌ INCORRECTO
const product = await createProduct(req.body) // sin validar
```

**Checklist:**

```
□ /api/products/route.ts - POST valida CreateProductSchema
□ /api/products/[id]/route.ts - PUT valida UpdateProductSchema
□ /api/categories/route.ts - POST valida CreateCategorySchema
□ /api/categories/[id]/route.ts - PUT valida UpdateCategorySchema
□ /api/checkout/route.ts - POST valida CheckoutSchema
□ /api/orders/[id]/route.ts - PUT valida UpdateOrderSchema
□ /api/reviews/[id]/route.ts - PUT valida UpdateReviewSchema
□ /api/cart/route.ts - POST valida AddToCartSchema
□ /api/cart/items/[itemId]/route.ts - PUT valida UpdateCartItemSchema
```

**Instrucciones específicas:**
1. Para cada endpoint POST/PUT:
   - Verifica que use `Schema.parse(data)` antes de procesar
   - Si falla validación, debe retornar 400 con error message
   - Si NO valida, documenta como VULNERABILIDAD MEDIA

---

#### D) SECRETS MANAGEMENT - CRÍTICO ✓/✗

Buscar cualquier secret hardcodeado:

```bash
# Ejecuta estos comandos para buscar
grep -r "sk_test\|pk_test\|whsec_\|STRIPE\|NEXTAUTH_SECRET\|DATABASE_URL" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env" | grep -v ".env"
grep -r "password\|secret\|token\|api[_-]key" src/ --include="*.ts" -i | grep "=" | grep -v "process.env" | head -20
```

**Checklist:**
```
□ NO hay secrets hardcodeados en código
□ Todos usan process.env.VARIABLE_NAME
□ .env.production tiene solo PLACEHOLDERS (sk_test_placeholder, etc)
□ .env.local está en .gitignore
□ No hay API keys en comentarios
```

**Instrucciones específicas:**
1. Ejecuta los greps anteriores
2. Si encuentra algo, es VULNERABILIDAD CRÍTICA
3. Documenta ubicación exacta

---

#### E) SQL INJECTION & QUERY SAFETY - IMPORTANTE ✓/✗

Prisma usa prepared statements, pero verificar:

```typescript
// ✅ SEGURO - Prisma prepared statements
const product = await db.product.findMany({
  where: { name: { contains: userInput } }
})

// ❌ INSEGURO - String interpolation (NO debe existir)
const result = await db.$queryRaw`SELECT * FROM products WHERE name = '${userInput}'`
```

**Checklist:**
```
□ NO hay $queryRaw con interpolación
□ Si usa $queryRaw, es con prepared statements:
  db.$queryRaw`SELECT * FROM products WHERE id = ${id}`
□ Todos los filtros usan métodos Prisma (findMany, findUnique, etc)
```

**Instrucciones específicas:**
1. Busca todas las instancias de `$queryRaw` y `$executeRaw`:
   ```bash
   grep -r "\$queryRaw\|\$executeRaw" src/ --include="*.ts"
   ```
2. Si las encuentra, verifica que usen prepared statements (con `${}`)
3. Si usan template strings sin `${}`, es VULNERABILIDAD CRÍTICA

---

#### F) HEADERS DE SEGURIDAD - IMPORTANTE ✓/✗

Revisar `src/middleware.ts`:

```typescript
// ✅ ESPERADO
export const middleware = (request: NextRequest) => {
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  return response
}
```

**Checklist:**
```
□ X-Content-Type-Options: nosniff
□ X-Frame-Options: DENY
□ X-XSS-Protection: 1; mode=block
□ Referrer-Policy: strict-origin-when-cross-origin
□ Permissions-Policy configurado
```

---

#### G) RATE LIMITING - RECOMENDADO ✓/✗

Revisar si hay rate limiting en endpoints críticos:

```
□ /api/auth/signup - Rate limit
□ /api/checkout - Rate limit
□ /api/orders - Rate limit
```

**Nota:** No es CRÍTICO pero es recomendado. Documenta si falta.

---

### Formato para Documentar Hallazgos

Para CADA vulnerabilidad encontrada, documenta así:

```
[SEVERIDAD] [CATEGORÍA]: Descripción
├─ Archivo: src/lib/db/products.ts:45
├─ Línea: const products = await db.product.findMany()
├─ Problema: No filtra por tenantId
└─ Fix: where: { tenantId: currentTenantId, ...filters }
```

**Severidades:**
- 🔴 CRÍTICA: Seguridad bancaria comprometida
- 🟠 ALTA: Vulnerabilidad significativa
- 🟡 MEDIA: Riesgo moderado
- 🟢 BAJA: Mejora recomendada

---

## 📄 TAREA 2: GENERAR REPORTE DE AUDITORÍA

### Crear archivo: `AUDITORIA-SEGURIDAD-SPRINT-6.md`

**Estructura del reporte:**

```markdown
# AUDITORÍA DE SEGURIDAD - Sprint 6
**Fecha**: [HOY]
**Auditor**: Arquitecto A
**Estado**: ✅ COMPLETADO / ⚠️ CON HALLAZGOS

## Resumen Ejecutivo
- Total de endpoints auditados: [X]
- Vulnerabilidades encontradas: [X]
- Severidad máxima: [CRÍTICA/ALTA/MEDIA/BAJA/NINGUNA]
- Recomendación: [PRODUCCIÓN SEGURA / FIX REQUERIDO ANTES DE PRODUCCIÓN]

## 1. TENANT ISOLATION
**Estado**: ✅ SEGURO / ❌ VULNERABILIDADES

[Lista cada archivo y su estado]

## 2. RBAC
**Estado**: ✅ SEGURO / ❌ VULNERABILIDADES

[Lista cada endpoint y su estado]

## 3. VALIDACIÓN ZOD
**Estado**: ✅ SEGURO / ⚠️ INCOMPLETO

[Lista cada endpoint y su estado]

## 4. SECRETS MANAGEMENT
**Estado**: ✅ SEGURO / ❌ VULNERABILIDADES

[Lista hallazgos]

## 5. SQL INJECTION
**Estado**: ✅ SEGURO / ❌ VULNERABILIDADES

[Lista hallazgos]

## 6. HEADERS DE SEGURIDAD
**Estado**: ✅ SEGURO / ⚠️ INCOMPLETO

[Lista headers implementados]

## 7. RATE LIMITING
**Estado**: ⚠️ NO IMPLEMENTADO / ✅ IMPLEMENTADO

[Análisis]

## Hallazgos Detallados

### [CRÍTICA] Tenant Isolation en /api/products/route.ts:50
Descripción: [...]
Fix: [...]

### [ALTA] RBAC faltante en /api/orders/[id]/route.ts:20
Descripción: [...]
Fix: [...]

[... más hallazgos ...]

## Recomendaciones
1. [...]
2. [...]
3. [...]

## Próximos Pasos
- [ ] Fix críticas antes de producción
- [ ] Re-auditar fixes
- [ ] Implementar rate limiting (opcional para Sprint 6)
```

**Instrucciones:**
1. Completa este reporte basado en auditoría de Tarea 1
2. Si encuentras vulnerabilidades, propone fixes específicos
3. Si todo está bien, documenta como "PRODUCCIÓN SEGURA"
4. Sé claro y preciso - este documento puede usarse para compliance

---

## 🚀 TAREA 3: PLANNING SPRINT 6

### Objetivo
Identificar qué features falta para producción real y crear especificaciones.

### Análisis: ¿Qué está completado?

**Backend Implementado:**
- ✅ Sprint 1: Autenticación + Tenants
- ✅ Sprint 2: Productos + Categorías
- ✅ Sprint 3: Carrito + Checkout
- ✅ Sprint 4: Reviews + Inventario
- ✅ Sprint 5: Dashboard Analytics

**Frontend Implementado:**
- ✅ Sprint 1: Login/Signup + Dashboard
- ✅ Sprint 2: Product Listing + Details

**Lo que FALTA para MVP COMPLETO:**
- Cart UI (parcial)
- Checkout UI (parcial)
- Order Management UI
- Admin Dashboard UI
- Notifications
- Email transaccional

### Crear archivo: `SPRINT-6-SPECIFICATIONS.md`

**Estructura:**

```markdown
# SPRINT 6 SPECIFICATIONS
**Objetivo**: Completar MVP para producción
**Timeline**: [Propuesto]

## 1. ANÁLISIS DE FEATURES PENDIENTES

### Categoría: FRONTEND (Requerido para Architect B)
- [ ] Carrito - UI completamente funcional
- [ ] Checkout - Integración Stripe frontend
- [ ] Órdenes - Visualización y tracking
- [ ] Dashboard Admin - Gráficos y métricas
- [ ] Notificaciones - Toast/alerts

### Categoría: BACKEND CORE (Requerido para producción)
- [ ] Email transaccional - Confirmación, shipping
- [ ] Webhooks - Stripe payment confirmed
- [ ] Reporting - Exports PDF/CSV

### Categoría: INFRA (Requerido para producción)
- [ ] CORS - Configurar correctamente
- [ ] Rate Limiting - Endpoints críticos
- [ ] Logging - Auditoría de acciones

### Categoría: TESTING (Recomendado)
- [ ] Unit tests - Funciones críticas
- [ ] Integration tests - Flujos de compra
- [ ] E2E tests - Casos de usuario

## 2. BACKLOG POR PRIORIDAD

### BLOQUEA PRODUCCIÓN (Semana 1)
1. **Email Transaccional** (Backend)
   - Signup confirmation
   - Order confirmation
   - Shipping notification
   - Estimated effort: 4-6 horas

2. **Webhooks Stripe** (Backend)
   - Payment confirmed → Actualizar order
   - Refund → Actualizar inventario
   - Estimated effort: 3-4 horas

### CRÍTICO PARA MVP (Semana 1-2)
3. **Checkout UI Completo** (Frontend)
   - Stripe Elements integration
   - Order confirmation page
   - Estimated effort: 4-6 horas

4. **Order Management** (Backend + Frontend)
   - API endpoints ✓ (ya existe)
   - Order history UI
   - Order tracking UI
   - Estimated effort: 5-6 horas

### IMPORTANTE (Semana 2)
5. **Admin Dashboard UI** (Frontend)
   - Metrics visualization
   - Product management
   - Order management
   - Estimated effort: 8-10 horas

6. **Rate Limiting** (Backend)
   - Prevent abuse
   - Estimated effort: 2-3 horas

### NICE-TO-HAVE (Semana 3+)
7. **Advanced Analytics** (Backend)
8. **PDF Exports** (Backend)
9. **Testing** (Full stack)

## 3. ESTIMACIÓN DE ESFUERZO

**Arquitecto A (Backend)**: ~20 horas
- Email + Webhooks: 10 horas
- Rate Limiting: 3 horas
- Logging/Auditoría: 4 horas
- Testing: 3 horas

**Arquitecto B (Frontend)**: ~25-30 horas
- Checkout UI: 6 horas
- Order Management UI: 6 horas
- Admin Dashboard: 10 horas
- Notifications: 3 horas
- Testing: 4-5 horas

**Total Sprint 6**: 45-50 horas (~1 semana para 2 arquitectos)

## 4. DEPENDENCIAS

```
Email + Webhooks → Order confirmation ✓
Checkout UI → Requires backend checkout API ✓
Admin Dashboard → Requires dashboard metrics API ✓
Rate Limiting → Depends on auth middleware ✓
```

## 5. RIESGOS

- [ ] Stripe webhook testing (requiere ngrok/exposed endpoint)
- [ ] Email sending (Resend API limits)
- [ ] PDF generation (dependencias adicionales)

## 6. RECOMENDACIÓN FINAL

**Propuesta de Sprint 6:**
1. **Semana 1** (Arquitecto A): Email + Webhooks + Rate Limiting
2. **Semana 1** (Arquitecto B): Checkout UI + Order Management UI
3. **Semana 2**: Admin Dashboard + Testing
4. **Resultado**: MVP completo listo para producción

**Alternativa Acelerada** (si hay urgencia):
- Focusear solo en Email + Webhooks + Checkout UI
- Skipear Admin Dashboard en Sprint 6
- Poner admin en Sprint 7

```

**Instrucciones para esta tarea:**

1. **Revisa qué existe:**
   - `git log --oneline | grep -i "sprint\|email\|webhook"` para ver qué ya está
   - `ls -la src/app/api/` para ver endpoints existentes

2. **Identifica qué FALTA:**
   - ¿Hay email sending implementado? (Busca Resend)
   - ¿Hay webhooks Stripe? (Busca /webhooks)
   - ¿Hay rate limiting? (Busca rateLimit)

3. **Propón priorización:**
   - ¿Qué es BLOQUEANTE para producción?
   - ¿Qué puede esperar a Sprint 7?
   - ¿Cuántas horas en total?

4. **Crea el documento** `SPRINT-6-SPECIFICATIONS.md` en raíz

---

## 📝 ENTREGABLES FINALES

Después de completar las 3 tareas, debes entregar:

```
✅ TAREA 1: Auditoría completada (notas en consola + archivo)
✅ TAREA 2: AUDITORIA-SEGURIDAD-SPRINT-6.md
✅ TAREA 3: SPRINT-6-SPECIFICATIONS.md
✅ Git: Un commit final con ambos archivos
```

### Commit Final

```bash
git add AUDITORIA-SEGURIDAD-SPRINT-6.md SPRINT-6-SPECIFICATIONS.md
git commit -m "docs: Complete security audit and Sprint 6 planning

- Comprehensive security audit covering:
  * Tenant isolation verification (8 DAL files)
  * RBAC implementation across 10+ endpoints
  * Zod validation in all POST/PUT routes
  * Secrets management verification
  * SQL injection prevention checks
  * Security headers implementation
  * Rate limiting analysis

- Security assessment: [SAFE FOR PRODUCTION / FIXES REQUIRED]
- Vulnerabilities found: [X critical, Y high, Z medium]

- Sprint 6 specifications:
  * Identified [X] features for MVP completion
  * Estimated effort: [X] hours
  * Proposed timeline: [X] weeks
  * Priority backlog: 7 features categorized

🔐 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## ⏰ TIMELINE SUGERIDO

```
TAREA 1: Auditoría (2-2.5 horas)
  └─ 30 min: Tenant isolation
  └─ 30 min: RBAC
  └─ 20 min: Validación Zod
  └─ 15 min: Secrets
  └─ 15 min: SQL injection
  └─ 10 min: Headers

TAREA 2: Reporte (30 min)
  └─ Documentar hallazgos
  └─ Clasificar severidades

TAREA 3: Planning (1.5-2 horas)
  └─ Análisis de features
  └─ Backlog priorizado
  └─ Estimaciones

TOTAL: 4-5 horas
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Qué hago si encuentro una vulnerabilidad?**
R: Documenta exactamente: archivo, línea, descripción, fix propuesto. No la corrijas aún - primero genera el reporte completo.

**P: ¿Debo hacer commit de cada tarea?**
R: NO. Haz UN commit final cuando terminen las 3 tareas.

**P: ¿Y si toma más de 5 horas?**
R: Avisa a la directora. Si pasa más de 6 horas, probablemente hay problemas que requieren discussion.

**P: ¿Debo corregir vulnerabilidades?**
R: En Sprint 6 normal, sí. Pero primero termina la auditoría completa, luego puedes hacer fixes en una nueva rama.

---

**INICIO INMEDIATO**

Cambia a `develop`, asegúrate que esté updated, y comienza con TAREA 1.

```bash
cd /ruta/proyecto
git checkout develop
git pull origin develop
# COMIENZA AUDITORÍA
```

**Cuando termines, notifica a la directora con:**
- Los 2 archivos de reporte
- Status de hallazgos
- Recomendación final

---

**¡Adelante!** 🚀
