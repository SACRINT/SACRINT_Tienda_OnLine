# ⚡ SPRINT 6 - RESUMEN RÁPIDO DE ARREGLOS

**Para:** El Arquitecto que implementó Sprint 6
**De:** Sistema de Sincronización
**Fecha:** 20 de Noviembre, 2025
**Urgencia:** 🔴 CRÍTICO - Necesario para mergear a main

---

## 🎯 LA SITUACIÓN

Sprint 6 está 100% implementado pero **NO compila en build de producción**.

Tu rama: `claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5` ✅ Está lista
Build local: ❌ Falla con errores de tipos TypeScript

---

## 🔴 PROBLEMA PRINCIPAL

**Prisma usa `Decimal` para montos monetarios, pero el código espera `number`**

```
❌ FALLA: Type 'Decimal' is not assignable to type 'number'
```

Ejemplo del error:
```typescript
// En src/lib/monitoring/logger.ts
const orders = await db.order.findMany();
// orders[0].total es Decimal, pero se espera number
```

---

## ✅ SOLUCIÓN (3 PASOS)

### PASO 1: Checkout y build
```bash
git checkout claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5
npm install
npm run build  # Verifica qué falla
```

### PASO 2: Convierte Decimal a number
Dondequiera que retornes campos de `Order`:
```typescript
// ✅ CORRECTO
const orders = await db.order.findMany();
return orders.map(o => ({
  ...o,
  total: Number(o.total),        // ← Conversión
  subtotal: Number(o.subtotal),  // ← Conversión
  tax: Number(o.tax),            // ← Conversión
}));
```

### PASO 3: Verifica que compila
```bash
npm run build
# Debe decir: ✓ Compiled successfully
```

---

## 📍 ARCHIVOS PROBABLES CON ERRORES

1. `src/lib/monitoring/logger.ts` - Logging de órdenes
2. `src/lib/payment/mercadopago.ts` - Pagos
3. `src/app/api/checkout/mercadopago/route.ts` - Checkout endpoint
4. Cualquier archivo que use `db.order.*` con selecciones

---

## 🔍 BUSCA ERRORES CON

```bash
# Ver TODOS los errores
npm run build 2>&1 | grep "Type error"

# Buscar referencias a Order
grep -r "db.order\." src/ --include="*.ts"

# Buscar tipos que esperan number
grep -r "total: number\|subtotal: number" src/ --include="*.ts"
```

---

## ✅ VALIDACIÓN

Cuando esté listo:
```bash
npm run build          # ✓ Compiled successfully
npm run type-check     # Sin errores
npm run lint           # Sin errores
```

---

## 📋 TIMELINE

- **Ahora:** Comienza reparación
- **~1-2 horas:** Debería estar listo
- **Después:** Vercel deploya automáticamente a producción

---

## 🎯 CHECKLIST RÁPIDO

- [ ] `git checkout claude/onboarding-new-architect...`
- [ ] `npm install`
- [ ] `npm run build` (guardar errores)
- [ ] Arreglé todos los `Decimal` → `Number()`
- [ ] `npm run build` sin errores ✓
- [ ] `git push`
- [ ] ✅ LISTO

---

## ¿PREGUNTAS?

Lee `SPRINT-6-FIX-INSTRUCTIONS.md` para detalles completos y ejemplos.

**Let's ship it! 🚀**
