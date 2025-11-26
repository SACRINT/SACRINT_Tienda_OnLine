# PLAN DE ACCIÓN: Corrección de la rama del arquitecto

**Fecha**: 26 de Noviembre, 2025
**Objetivo**: Arreglar 2 errores críticos para que el código compile
**Tiempo estimado**: 1-2 horas

---

## 🎯 RESUMEN RÁPIDO

La rama del arquitecto tiene **2 errores críticos de Prisma** que bloquean la compilación:

| #   | Error                     | Ubicación                   | Severidad  | Fix                        |
| --- | ------------------------- | --------------------------- | ---------- | -------------------------- |
| 1   | `@@fulltext` incompatible | `prisma/schema.prisma:251`  | 🔴 CRÍTICO | Remover o cambiar sintaxis |
| 2   | Relación faltante         | `prisma/schema.prisma:1241` | 🔴 CRÍTICO | Agregar relación recíproca |

---

## 📍 ERROR #1: Full-Text Search Inválido

### Ubicación:

`prisma/schema.prisma` línea 251

### Código actual (INCORRECTO):

```prisma
model Product {
  id                    String    @id @default(cuid())
  // ... otros campos ...

  @@index([stock])
  @@fulltext([name, description]) // ← ERROR: No soportado en PostgreSQL
}
```

### Problema:

- `@@fulltext` es sintaxis de **MySQL 5.7.6+**
- Tu DB es **PostgreSQL** (Neon)
- PostgreSQL requiere una sintaxis diferente

### SOLUCIÓN - Opción A (Recomendado): Remover por ahora

```prisma
model Product {
  id                    String    @id @default(cuid())
  // ... otros campos ...

  @@index([stock])
  // @@fulltext([name, description]) ← COMENTAR POR AHORA
}
```

**Ventaja**: Código compila inmediatamente
**Desventaja**: Full-text search se implementa después (Week 11)

---

### SOLUCIÓN - Opción B: Usar sintaxis PostgreSQL correcta

Para PostgreSQL con Prisma, necesitas:

```prisma
model Product {
  id                    String    @id @default(cuid())
  name                  String    @db.VarChar(255)
  description           String?   @db.Text
  // ... otros campos ...

  @@index([stock])
  // Para full-text en PostgreSQL, se hace en migrations con SQL raw
  // @@fulltext no se usa aquí - se configura en la BD directamente
}
```

Luego en `prisma/migrations/[timestamp]_add_fulltext.sql`:

```sql
-- Agregar extension pg_trgm si no existe
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Crear índice full-text en PostgreSQL
CREATE INDEX product_fulltext_idx
  ON "Product" USING GIN ((name || ' ' || description) gin_trgm_ops);
```

**Ventaja**: Full-text search funciona correctamente
**Desventaja**: Más complejo, requiere SQL raw

---

## 📍 ERROR #2: Relación Faltante en ReturnRequest

### Ubicación:

`prisma/schema.prisma` línea 1241

### Código actual (INCORRECTO):

```prisma
model ReturnRequest {
  id                String   @id @default(cuid())
  // ... otros campos ...

  shippingLabelId   String?  @unique
  shippingLabel     ShippingLabel? @relation("ReturnShippingLabel", fields: [shippingLabelId], references: [id])
  // ↑ Campo relacional que apunta a ShippingLabel

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model ShippingLabel {
  id                String   @id @default(cuid())
  // ... otros campos ...
  // ↓ FALTA ESTA RELACIÓN RECÍPROCA

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Problema:

- `ReturnRequest` tiene relación `shippingLabel` a `ShippingLabel`
- `ShippingLabel` **NO TIENE** la relación recíproca `returnRequest`
- Prisma requiere **relaciones bidireccionales**

### SOLUCIÓN: Agregar relación recíproca en ShippingLabel

```prisma
model ShippingLabel {
  id                String   @id @default(cuid())
  // ... otros campos ...

  // ← AGREGAR ESTA LÍNEA
  returnRequest     ReturnRequest? @relation("ReturnShippingLabel")

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## 🔧 PASOS PARA CORREGIR

### Paso 1: Verificar ubicaciones exactas

```bash
cd "C:\03_Tienda digital"
# Ver línea 251 (fulltext)
sed -n '245,255p' prisma/schema.prisma

# Ver línea 1241 (relación)
sed -n '1235,1250p' prisma/schema.prisma
```

### Paso 2: Corregir Error #1 - Full-Text Search

**OPCIÓN A (Rápido)**: Comentar la línea

```bash
# Abrir el archivo en editor y comentar línea 251
# Cambiar:     @@fulltext([name, description])
# A:           # @@fulltext([name, description])
```

**OPCIÓN B (Completo)**: Implementar full-text PostgreSQL

```bash
# Crear archivo de migración
touch prisma/migrations/$(date +%s)_add_fulltext_postgres/migration.sql
```

### Paso 3: Corregir Error #2 - Relación Faltante

1. Abrir `prisma/schema.prisma`
2. Buscar modelo `ShippingLabel`
3. Agregar esta línea dentro del modelo:
   ```prisma
   returnRequest     ReturnRequest? @relation("ReturnShippingLabel")
   ```

### Paso 4: Validar que no hay otros errores

```bash
# Validar schema
npx prisma validate

# Si válida, generar cliente
npx prisma generate

# Si genera OK, intentar build
npm run build
```

---

## ✅ VALIDACIÓN FINAL

Después de hacer los cambios, ejecutar en este orden:

```bash
# 1. Validar Prisma schema
npx prisma validate
✓ Salida esperada: "Valid"

# 2. Generar Prisma client
npx prisma generate
✓ Salida esperada: "✓ Generated Prisma Client..."

# 3. Compilar el proyecto
npm run build
✓ Salida esperada: "✓ Compiled successfully"

# 4. Verificar tests (si aplican)
npm test
✓ Salida esperada: "Todos los tests pasan" (o N/A si no hay tests)
```

---

## 🎯 CRITERIOS DE ACEPTACIÓN

La rama estará **"Realmente Completada"** cuando:

- ✅ `npx prisma validate` pasa
- ✅ `npx prisma generate` completa sin errores
- ✅ `npm run build` genera "✓ Compiled successfully"
- ✅ `npm run lint` sin warnings críticos
- ✅ Código funcional (puede deployarse)

---

## 🚀 PRÓXIMOS PASOS (Después de arreglar)

1. **Merge a develop** (no a main aún)
2. **Ejecutar tests completos**
3. **Code review técnico**
4. **Testing manual de Weeks 13-28**
5. **Merge a main** (si todo pasa)

---

## ⚠️ NOTA IMPORTANTE

Estos 2 errores son **el síntoma, no la enfermedad**.

El problema fundamental es:

- ❌ El arquitecto no validó el código antes de commitear
- ❌ No se ejecutó `npm run build` al terminar
- ❌ No se verificó funcionalidad
- ❌ Se reportó como "completado" siendo "fallido"

**Después de arreglar estos errores**:

- Habrá probablemente ~250+ errores TypeScript
- El código puede tener lógica incompleta
- Los tests probablemente fallarán
- Se requiere validación funcional completa

---

## 📋 CHECKLIST DE CORRECCIÓN

```
CORRECCIÓN DE ERRORES PRISMA:
[ ] Error #1 (fulltext) identificado y localizado
[ ] Error #2 (relación) identificado y localizado
[ ] Soluciones aplicadas
[ ] prisma validate ejecutado
[ ] prisma generate exitoso
[ ] npm run build exitoso
[ ] Cambios committeados

VALIDACIÓN POSTERIOR:
[ ] npm run lint sin errores críticos
[ ] npm test ejecutados
[ ] Code review completado
[ ] Testing manual completado
[ ] Ready para merge a develop
[ ] Ready para merge a main
```

---

**Documento**: PLAN-ACCION-CORRECCION-RAMA-ARQUITECTO.md
**Generado**: 26 de Noviembre, 2025
**Responsable**: Auditoría técnica
**Clasificación**: INTERNAL
