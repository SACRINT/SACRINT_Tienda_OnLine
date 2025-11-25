# 📋 INSTRUCCIONES PARA LA NUEVA SESIÓN IA

**Fecha**: 20 de Noviembre, 2025
**Estado Actual**: Main branch con 36 errores de TypeScript
**Producción**: Desplegada pero con errores de tipo

---

## 🚨 SITUACIÓN CRÍTICA

El PR #12 (Sprint 6) fue mergeado a main y desplegado en Vercel. Sin embargo, **hay 36 errores de compilación de TypeScript** que no fueron detectados o ignorados durante el merge.

### El Problema

```
✅ Producción funciona (app corre)
❌ Local no compila (npx tsc --noEmit falla)
⚠️ Código tipo-inseguro en producción
🔴 No se puede hacer build localmente
```

---

## 📊 RESUMEN DE LOS 36 ERRORES

Los errores están agrupados en 7 categorías principales:

### 1️⃣ CRÍTICOS - Deben arreglarse YA (8 errores)

- **Campo incorrecto en Mercado Pago**: `paymentIntentId` debe ser `paymentId`
  - Archivos: `src/app/api/checkout/mercadopago/route.ts` línea 228
  - Archivo: `src/app/api/webhooks/mercadopago/route.ts` línea 109

- **Tipo Decimal vs Number en exportes**: Las funciones esperan `number` pero Prisma devuelve `Decimal`
  - Archivo: `src/app/api/export/orders/route.ts` línea 73
  - Archivo: `src/app/api/export/products/route.ts` línea 72

- **Valores de enum inválidos**: Status que no existen en el schema
  - `"PAID"` no existe en OrderStatus (revisar en Prisma schema)
  - `"ACTIVE"` y `"EXPIRED"` no existen en ReservationStatus

### 2️⃣ ALTOS - Rompen funcionalidad (7 errores)

- **Motor de recomendaciones**: Campo `price` no existe (debe ser `basePrice`)
  - Archivo: `src/lib/recommendations/engine.ts` múltiples líneas

- **Gestor de inventario**: Problemas con status de reserva y tabla faltante
  - Archivo: `src/lib/inventory/manager.ts`

### 3️⃣ MEDIOS - Pruebas y seguridad de tipos (14 errores)

- **Archivo de pruebas**: Campos faltantes y valores enum incorrectos
  - Archivo: `__tests__/security/tenant-isolation.test.ts`

---

## 🛠️ CÓMO ARREGLARLO (Paso a Paso)

### PASO 1: Revisar el Schema

```bash
# Lee: prisma/schema.prisma
# Busca los enum valores correctos para:
# - enum OrderStatus { ... }
# - enum ReservationStatus { ... }
# - enum PaymentMethod { ... }
```

### PASO 2: Arreglesar los Errores CRÍTICOS

**Paso 2.1**: Campo Mercado Pago

```typescript
// ARCHIVO: src/app/api/checkout/mercadopago/route.ts:228
// CAMBIAR DE:
await db.order.update({
  where: { id: orderId },
  data: {
    paymentIntentId: preference.id, // ❌ MALO
  },
});

// CAMBIAR A:
await db.order.update({
  where: { id: orderId },
  data: {
    paymentId: preference.id, // ✅ CORRECTO
  },
});
```

**Paso 2.2**: Convertir Decimal a Number en exportes

```typescript
// ARCHIVO: src/app/api/export/orders/route.ts:73
// AGREGAR CONVERSIÓN ANTES DE PASAR A LA FUNCIÓN:
const ordersForExport = orders.map((order) => ({
  ...order,
  subtotal: Number(order.subtotal),
  shippingCost: Number(order.shippingCost),
  tax: Number(order.tax),
  discount: Number(order.discount),
  total: Number(order.total),
}));
const csvContent = exportOrdersToCSV(ordersForExport);
```

**Paso 2.3**: Reemplazar `price` con `basePrice`

```typescript
// ARCHIVO: src/lib/recommendations/engine.ts
// Reemplazar TODAS las instancias de:
// - product.price  → product.basePrice
// - { price: ... } → { basePrice: ... }
// - where: { price: ... } → where: { basePrice: ... }
```

### PASO 3: Verificar Progreso

```bash
# Después de cada arreglo, ejecutar:
npx tsc --noEmit

# Deberías ver que bajan los errores de 36 → más bajo
```

### PASO 4: Arreglesar Valores Enum

```typescript
// Una vez sepas los valores correctos del schema,
// reemplazalos en:
// - src/app/api/webhooks/mercadopago/route.ts (líneas 97, 107, 117, 159, 187)
// - src/lib/recommendations/engine.ts (líneas 55, 277, 376)
// - __tests__/security/tenant-isolation.test.ts (líneas 195, 285)

// Ejemplo:
// CAMBIAR: status: "PAID"
// CAMBIAR A: status: "COMPLETED"  // (o el valor correcto del enum)
```

---

## 📝 CHECKLIST DE TAREAS

Para marcar como completadas:

```
ERRORES CRÍTICOS (8 errores)
[ ] 1. paymentIntentId → paymentId en mercadopago/route.ts:228
[ ] 2. paymentIntentId → paymentId en webhooks/mercadopago/route.ts:109
[ ] 3. Convertir Decimal a Number en export/orders/route.ts:73
[ ] 4. Convertir Decimal a Number en export/products/route.ts:72
[ ] 5. Revisar OrderStatus enum en Prisma
[ ] 6. Revisar ReservationStatus enum en Prisma
[ ] 7. Arreglesar status values en webhooks/mercadopago/route.ts
[ ] 8. Arreglesar status values en recommendations/engine.ts

ALTOS (7 errores)
[ ] 9. Reemplazar price → basePrice en recommendations/engine.ts
[ ] 10. Verificar table inventoryMovement existe en Prisma
[ ] 11. Arreglesar inventory/manager.ts

MEDIOS (14 errores)
[ ] 12. Agregar campos faltantes en tests (weight, length, width, height)
[ ] 13. Arreglesar enums en tests (CARD → CREDIT_CARD)
[ ] 14. Agregar userId a Address en tests
[ ] 15. Arreglesar type mismatch en src/page.tsx:130

VERIFICACIÓN FINAL
[ ] 16. Ejecutar: npx tsc --noEmit (debe mostrar 0 errores)
[ ] 17. Ejecutar: npm run build (debe compilar exitosamente)
[ ] 18. Ejecutar: npm run test (deben pasar todas las pruebas)
[ ] 19. Hacer commit con todos los cambios
[ ] 20. Hacer push a main
```

---

## 📍 ARCHIVOS IMPORTANTES

### Documentos de Referencia (LEE ESTOS PRIMERO)

```
1. HANDOFF-NEW-SESSION.md
   ↳ Lista detallada de los 36 errores con explicaciones

2. SYNCHRONIZATION-SUMMARY.md
   ↳ Qué pasó durante la sincronización
   ↳ Por qué Vercel desplegó con errores
   ↳ Lecciones aprendidas
```

### Archivos a Modificar

```
CRÍTICOS:
├─ src/app/api/checkout/mercadopago/route.ts (línea 228)
├─ src/app/api/webhooks/mercadopago/route.ts (línea 109, 97, 107, 117, 159, 187)
├─ src/app/api/export/orders/route.ts (línea 73)
└─ src/app/api/export/products/route.ts (línea 72)

ALTOS:
├─ src/lib/recommendations/engine.ts (múltiples líneas)
└─ src/lib/inventory/manager.ts (líneas 256, 280, 286, 412, 432)

MEDIOS:
├─ __tests__/security/tenant-isolation.test.ts (líneas 67, 164, 195, 202, 256, 285, 292)
└─ src/page.tsx (línea 130)

REFERENCE:
└─ prisma/schema.prisma (para verificar enums correctos)
```

---

## ⚡ RÁPIDA GUÍA DE ERRORES

| #   | Archivo                         | Línea  | Error                | Fix               |
| --- | ------------------------------- | ------ | -------------------- | ----------------- |
| 1   | mercadopago/route.ts            | 228    | `paymentIntentId` ❌ | `paymentId` ✅    |
| 2   | webhooks/mercadopago            | 109    | `paymentIntentId` ❌ | `paymentId` ✅    |
| 3   | export/orders                   | 73     | Decimal ❌           | Number() ✅       |
| 4   | export/products                 | 72     | Decimal ❌           | Number() ✅       |
| 5-8 | webhooks/mercadopago            | Varios | Enum ❌              | Valor correcto ✅ |
| 9+  | recommendations/engine          | Varios | `price` ❌           | `basePrice` ✅    |
| ... | (más en HANDOFF-NEW-SESSION.md) |        |                      |                   |

---

## 🔍 VERIFICACIÓN PASO A PASO

Después de cada fix, ejecuta:

```bash
# Ver todos los errores:
npx tsc --noEmit 2>&1 | grep "error TS"

# Contar errores:
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

Expected output:

```
Iniciando: 36 errores
Después fix mercadopago: 32 errores
Después fix export: 30 errores
Después fix enum: 24 errores
Después fix recommendations: 10 errores
Final: 0 errores ✅
```

---

## 🎯 OBJETIVO FINAL

```
✅ Alcanzar 0 errores de TypeScript
✅ npm run build debe pasar exitosamente
✅ Código tipo-seguro en producción
✅ Preparado para Sprint 7
```

---

## 📞 SI TIENES DUDAS

1. **Lee primero**: HANDOFF-NEW-SESSION.md (error detailed por error)
2. **Entiende**: SYNCHRONIZATION-SUMMARY.md (contexto de qué pasó)
3. **Revisa**: prisma/schema.prisma (para enum values correctos)
4. **Ejecuta**: Los comandos de verificación para confirmar progress

---

## ⏱️ TIEMPO ESTIMADO

- Errores Críticos: **30-45 minutos**
- Errores Altos: **30-45 minutos**
- Errores Medios: **30-60 minutos**
- Verificación y Testing: **15-30 minutos**

**Total**: 2-3 horas para completar todos los fixes

---

**Estado**: ✅ Listo para nueva sesión
**Prioridad**: 🔴 ALTA - Solucionar ANTES de Sprint 7
**Dificultad**: 🟢 BAJA - Solo type-checking, no lógica

---

_Último actualizado: 20 de Noviembre, 2025_
_Creado por: Sesión anterior de IA_
_Para: Nueva sesión de IA_
