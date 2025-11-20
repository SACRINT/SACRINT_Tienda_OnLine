# 🔧 SPRINT 6 - Instrucciones de Reparación de Errores de Compilación

**Fecha:** 20 de Noviembre, 2025
**Estado:** ⚠️ REQUIERE REPARACIÓN ANTES DE MERGE A MAIN
**Rama:** `claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5`
**Objetivo:** Arreglar errores de TypeScript para que `npm run build` compile correctamente

---

## 📊 Resumen de Errores

Sprint 6 tiene **múltiples errores de compilación TypeScript** que evitan su integración a `main`. El código funciona en desarrollo pero falla en build producción debido a incompatibilidades de tipos.

**Total de Errores:** ~15-20 errores de tipos relacionados con:
1. Campo `paymentIntentId` no existe en Prisma (✅ YA ARREGLADO)
2. Tipo `Decimal` no compatible con `number`
3. Incompatibilidades de tipos Prisma en múltiples archivos

---

## 🚀 PASOS PARA REPARAR

### PASO 1: Sincronizar tu rama local

```bash
# Asegúrate de estar en la rama correcta
git checkout claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5

# Pull la versión más reciente
git pull origin claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5

# Instala las dependencias (necesarias para que TypeScript funcione)
npm install
```

### PASO 2: Ejecuta el build para ver TODOS los errores

```bash
npm run build 2>&1 | tee build-errors.log
```

Este comando guardará TODOS los errores en `build-errors.log` para que puedas verlos completos.

### PASO 3: Entiende el problema principal - Tipo `Decimal`

**Problema Raíz:**

Prisma usa `Decimal` (de `@prisma/client/runtime/library`) para campos monetarios en el schema:

```prisma
// En prisma/schema.prisma
model Order {
  total              Decimal  @db.Decimal(12, 2)
  subtotal           Decimal  @db.Decimal(12, 2)
  shippingCost       Decimal  @db.Decimal(10, 2)
  tax                Decimal  @db.Decimal(10, 2)
  discount           Decimal  @db.Decimal(10, 2)
  // ... más campos Decimal
}
```

Pero en el código TypeScript, se espera `number`:

```typescript
// Esto falla porque Decimal no es compatible con number
const orderData: {
  total: number;
  subtotal: number;
  // ...
} = await db.order.findMany();
```

---

## 🔧 SOLUCIONES ESPECÍFICAS

### SOLUCIÓN 1: Convertir Decimal a number

Para cualquier lugar donde uses campos Prisma que son `Decimal`, debes convertirlos a `number`:

```typescript
// ❌ INCORRECTO
const orders = await db.order.findMany({
  select: {
    id: true,
    total: true,  // Esto es Decimal, no number
  }
});

// ✅ CORRECTO
const orders = await db.order.findMany({
  select: {
    id: true,
    total: true,
  }
});

// Luego convertir al retornar:
return orders.map(order => ({
  ...order,
  total: Number(order.total),  // Convertir Decimal a number
}));
```

### SOLUCIÓN 2: Actualizar tipos en funciones

Si tienes funciones que retornan órdenes, actualiza el tipo de retorno:

```typescript
// ❌ ANTES
async function getOrders(tenantId: string): Promise<{
  total: number;
  status: string;
}[]> {
  const orders = await db.order.findMany({ where: { tenantId } });
  return orders;  // Error: Decimal no es number
}

// ✅ DESPUÉS
async function getOrders(tenantId: string): Promise<{
  total: number;
  status: string;
}[]> {
  const orders = await db.order.findMany({ where: { tenantId } });
  return orders.map(order => ({
    ...order,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    discount: Number(order.discount),
    shippingCost: Number(order.shippingCost),
  }));
}
```

### SOLUCIÓN 3: Usa Omit para excluir campos Decimal

Si una función espera un tipo específico pero Prisma devuelve Decimal, usa `Omit`:

```typescript
// ✅ CORRECTO
type OrderData = {
  orderNumber: string;
  createdAt: Date;
  total: number;
  status: string;
};

async function processOrders(): Promise<OrderData[]> {
  const orders = await db.order.findMany();

  return orders.map(order => ({
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    total: Number(order.total),
    status: order.status as string,
  }));
}
```

---

## 📍 ARCHIVOS CONOCIDOS CON ERRORES

Basado en el análisis, estos archivos probablemente tienen errores:

1. **`src/lib/monitoring/logger.ts`** - Logging de órdenes
   - Problema: Intenta retornar órdenes con tipos incorrectos
   - Fix: Convertir Decimal a number en las funciones de logging

2. **`src/lib/payment/mercadopago.ts`** - Integración de MercadoPago
   - Problema: Campos monetarios incompatibles
   - Fix: Convertir all Decimal fields a number

3. **`src/app/api/checkout/mercadopago/route.ts`** - Endpoint de checkout (✅ YA PARCIALMENTE ARREGLADO)
   - Ya arreglamos: `paymentIntentId` → `paymentId`
   - Revisar: Campos decimales en las respuestas

4. **Cualquier archivo que consulte `Order` en las selecciones:**
   - Busca por: `db.order.findMany`, `db.order.findUnique`
   - Si selecciona campos Decimal, convierte a number

---

## 🔍 CÓMO ENCONTRAR TODOS LOS ERRORES

### Método 1: Buscar por "Decimal"

```bash
# Encuentra todos los archivos que podrían tener problemas
grep -r "db.order\." src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

### Método 2: Buscar por tipos Order

```bash
# Encuentra tipos que esperan number pero obtienen Decimal
grep -r "total: number\|subtotal: number\|tax: number" src/ --include="*.ts"
```

### Método 3: Ver el output completo del build

```bash
npm run build 2>&1 | grep "Type error" | head -20
```

---

## ✅ VERIFICACIÓN

Después de arreglar los errores, verifica que:

```bash
# 1. El build debe compilar sin errores
npm run build

# 2. No debe haber warnings de TypeScript
npm run type-check

# 3. Linter debe pasar
npm run lint
```

Si ves: `✓ Compiled successfully` 🎉 ¡Listo para hacer PR!

---

## 📋 CHECKLIST DE REPARACIÓN

- [ ] He checkouteado la rama `claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5`
- [ ] He ejecutado `npm install` para instalar dependencias
- [ ] He ejecutado `npm run build` y guardé los errores
- [ ] He identificado todos los archivos con errores de tipo Decimal
- [ ] He agregado conversiones `Number(fieldName)` donde sea necesario
- [ ] He actualizado tipos de retorno de funciones para retornar `number` en lugar de `Decimal`
- [ ] He ejecutado `npm run build` y NO hay errores
- [ ] He ejecutado `npm run type-check` sin errores
- [ ] He ejecutado `npm run lint` sin errores
- [ ] He hecho push a la rama `claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5`
- [ ] He avisado que está listo para mergear

---

## 🆘 AYUDA ADICIONAL

Si necesitas ayuda durante la reparación:

1. **Muestra el error completo** - Copia la salida de `npm run build` en el error
2. **Contextualiza** - ¿Qué archivo está fallando? ¿Cuál es la función?
3. **Proporciona el tipo esperado vs actual** - Esto ayuda a identificar la solución

---

## 📞 CUANDO ESTÉ LISTO

Una vez que hayas arreglado TODOS los errores y `npm run build` compila correctamente:

1. Haz push a `claude/onboarding-new-architect-01XpNsxUERSNFE5bNXuFJok5`
2. Avisa que Sprint 6 está listo
3. Se hará PR a `develop` y luego a `main`
4. Vercel deployará automáticamente a producción

---

**Gracias por reparar Sprint 6. Tu trabajo es crítico para llevar el proyecto a producción.** 🚀
