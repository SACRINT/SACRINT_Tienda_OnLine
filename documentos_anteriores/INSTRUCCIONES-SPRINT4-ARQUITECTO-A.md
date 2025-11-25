# 📋 INSTRUCCIONES SPRINT 4 - ARQUITECTO A

## Backend: Reviews & Inventory Management

**Directora**: Sistema de instrucciones precisas
**Arquitecto**: A (Backend - Implementación independiente)
**Sprint**: 4 - Reviews & Inventory Management
**Duración**: 4-5 días
**Rama**: `claude/backend-sprint-4-reviews-inventory`

---

## 🎯 MISIÓN

Implementar dos sistemas completamente independientes:

1. **Sistema de Reseñas de Productos**
   - Usuarios pueden crear, leer, editar y eliminar reseñas
   - Rating de 1-5 estrellas
   - Máximo una reseña por usuario por producto
   - Cálculo de estadísticas (promedio, distribución)

2. **Sistema de Gestión de Inventario**
   - Reserva de stock durante checkout
   - Confirmación de reserva después de pago
   - Cancelación de reserva si falla el pago
   - Ajustes manuales de stock
   - Reportes de bajo stock
   - Historial de cambios

---

## 📊 REQUISITOS TÉCNICOS

### BASE DE DATOS (Prisma Schema)

**Modelo: Review**

```
Campos necesarios:
- id (string, @id, @default(cuid()))
- productId (string, @db.Uuid)
- userId (string, @db.Uuid)
- rating (integer, 1-5)
- title (string, max 100)
- comment (string, max 500)
- createdAt (datetime, @default(now()))
- updatedAt (datetime, @updatedAt)

Relaciones:
- product → Product @relation
- user → User @relation

Índices:
- productId + userId (unique compound)
```

**Modelo: InventoryReservation**

```
Campos necesarios:
- id (string, @id, @default(cuid()))
- orderId (string, @db.Uuid, @unique)
- status (enum: RESERVED, CONFIRMED, CANCELLED)
- reservedAt (datetime, @default(now()))
- confirmedAt (datetime, nullable)
- items → ReservationItem[] @relation (cascade delete)

Relaciones:
- order → Order @relation
```

**Modelo: ReservationItem**

```
Campos necesarios:
- id (string, @id, @default(cuid()))
- reservationId (string)
- productId (string, @db.Uuid)
- variantId (string, @db.Uuid, nullable)
- reservedQuantity (integer)

Relaciones:
- reservation → InventoryReservation @relation
- product → Product @relation
- variant → ProductVariant @relation (nullable)
```

**Modelo: InventoryLog**

```
Campos necesarios:
- id (string, @id, @default(cuid()))
- productId (string, @db.Uuid)
- adjustment (integer) - positive or negative
- reason (string enum: RECOUNT, RETURN, DAMAGE, PURCHASE, OTHER)
- previousStock (integer)
- newStock (integer)
- createdAt (datetime, @default(now()))

Relaciones:
- product → Product @relation
```

**Acción**: Modifica `prisma/schema.prisma` agregando estos 4 modelos.

---

## 📁 ARCHIVOS A CREAR

### 1️⃣ src/lib/db/reviews.ts

**Propósito**: Data Access Layer para reseñas

**Funciones necesarias**:

1. `createReview(data: { productId, userId, rating, title, comment })`
   - Validar rating 1-5
   - Verificar que usuario no haya reseñado antes
   - Retornar review con info del usuario
   - Incluir relación: user (id, name, image)

2. `getProductReviews(productId, page = 1, limit = 10)`
   - Retornar array de reviews + paginación
   - Ordenar por fecha descendente
   - Incluir: user.id, user.name, user.image
   - Retornar estructura: { reviews, pagination: { page, limit, total, pages } }

3. `getReviewStats(productId)`
   - Calcular promedio de rating
   - Contar total de reseñas
   - Distribuir ratings por estrellas (1-5)
   - Retornar: { averageRating, totalReviews, ratingDistribution }

4. `getReviewById(reviewId)`
   - Retornar una reseña con info del usuario

5. `updateReview(reviewId, userId, data: { rating?, title?, comment? })`
   - Validar que usuario es autor
   - Permitir actualizar solo campos permitidos
   - Retornar review actualizado

6. `deleteReview(reviewId, userId)`
   - Validar que usuario es autor
   - Eliminar la reseña

7. `hasUserReviewedProduct(productId, userId)`
   - Retornar boolean: ¿usuario ya reseñó este producto?

**Validaciones**:

- Todos los IDs son UUID válidos
- Rating siempre entre 1-5
- Title: 3-100 caracteres
- Comment: 10-500 caracteres
- Solo autor puede editar/eliminar su reseña

---

### 2️⃣ src/lib/db/inventory.ts

**Propósito**: Data Access Layer para inventario

**Funciones necesarias**:

1. `getProductStock(productId, variantId?)`
   - Si variantId: retornar stock del variant
   - Si no: retornar stock del producto
   - Retornar: { stock }

2. `reserveInventory(orderId, items: Array<{ productId, variantId?, quantity }>)`
   - Crear InventoryReservation con status RESERVED
   - Crear ReservationItems para cada item
   - Retornar: id de la reserva
   - CRÍTICO: No debe deducir stock real aún

3. `confirmInventoryReservation(reservationId)`
   - Usar transacción
   - Para cada item en la reserva:
     - Deducir cantidad del stock real (product o variant)
   - Actualizar reserva: status = CONFIRMED, confirmedAt = now
   - Si error en deducción: rollback automático

4. `cancelInventoryReservation(reservationId)`
   - Actualizar reserva: status = CANCELLED
   - CRÍTICO: NO deducir stock (solo marcar cancelada)

5. `adjustProductStock(productId, adjustment, reason)`
   - adjustment: positivo (aumentar) o negativo (disminuir)
   - reason: RECOUNT, RETURN, DAMAGE, PURCHASE, OTHER
   - Usar transacción:
     - Actualizar product.stock
     - Crear InventoryLog con antes/después
   - Retornar: producto actualizado

6. `getLowStockProducts(tenantId, threshold = 10)`
   - Retornar productos CON STOCK <= threshold
   - Incluir variantes con stock bajo
   - Ordenar por stock (menor primero)
   - Retornar: { id, name, sku, stock, variants[] }

7. `getInventoryHistory(productId, limit = 50)`
   - Retornar InventoryLog para ese producto
   - Ordenar por fecha descendente
   - Retornar últimos 50 registros

8. `getInventoryReport(tenantId)`
   - Resumen estadístico:
     - totalProducts
     - totalVariants
     - totalItemsInStock (suma de todos los stocks)
     - lowStockProducts (count donde stock < 10)
   - Incluir array de todos los productos con sus stocks
   - Retornar: { summary, products[] }

**Validaciones**:

- Stock nunca puede ser negativo
- Quantities siempre positivas
- Las transacciones son atómicas (todo o nada)
- Validar que InventoryReservation existe antes de confirmar/cancelar

---

### 3️⃣ src/lib/security/schemas/review-schemas.ts

**Propósito**: Validaciones Zod para reseñas e inventario

**Schemas necesarios**:

1. `CreateReviewSchema`
   - productId: UUID válido
   - rating: 1-5 (integer)
   - title: 3-100 caracteres
   - comment: 10-500 caracteres

2. `UpdateReviewSchema`
   - rating: 1-5 (opcional, integer)
   - title: 3-100 caracteres (opcional)
   - comment: 10-500 caracteres (opcional)
   - Validar que al menos uno está presente

3. `ReviewFilterSchema`
   - productId: UUID (opcional)
   - minRating: 1-5 (opcional)
   - page: número positivo (default 1)
   - limit: número positivo (default 10)

4. `AdjustInventorySchema`
   - productId: UUID válido
   - adjustment: integer (positivo o negativo)
   - reason: enum ['RECOUNT', 'RETURN', 'DAMAGE', 'PURCHASE', 'OTHER']

5. `ReservationItemSchema`
   - productId: UUID válido
   - variantId: UUID (opcional)
   - quantity: positivo integer

6. `ReserveInventorySchema`
   - orderId: UUID válido
   - items: array de ReservationItem (mínimo 1)

---

### 4️⃣ src/app/api/products/[id]/reviews/route.ts

**Propósito**: GET y POST para reseñas de producto

**GET /api/products/[id]/reviews**

- Query params: page?, limit?, minRating?
- Sin autenticación necesaria
- Validar que producto existe
- Retornar reviews con paginación
- Response: { reviews[], pagination, productId }

**POST /api/products/[id]/reviews**

- Requiere autenticación (session)
- Body: { rating, title, comment }
- Validar con CreateReviewSchema
- Validar que producto existe
- Validar que usuario no reseñó antes
- Crear review
- Return: 201 created, review completo

**Error handling**:

- 404 si producto no existe
- 409 si usuario ya reseñó
- 400 si validación falla
- 401 si no autenticado (POST)

---

### 5️⃣ src/app/api/reviews/[id]/route.ts

**Propósito**: PATCH y DELETE para editar/eliminar reseña

**PATCH /api/reviews/[id]**

- Requiere autenticación
- Body: { rating?, title?, comment? }
- Validar con UpdateReviewSchema
- Verificar que usuario es autor
- Actualizar review
- Return: 200, review actualizado

**DELETE /api/reviews/[id]**

- Requiere autenticación
- Verificar que usuario es autor
- Eliminar review
- Return: 200, { success: true }

**Error handling**:

- 404 si review no existe
- 403 si usuario no es autor
- 400 si validación falla
- 401 si no autenticado

---

### 6️⃣ src/app/api/inventory/route.ts

**Propósito**: GET y PATCH para gestionar inventario

**GET /api/inventory**

- Requiere autenticación
- Requiere STORE_OWNER role
- Query param: lowStock? (boolean)
- Si lowStock=true: retornar solo productos con stock bajo
- Si lowStock=false/ausente: retornar reporte completo
- Return: { summary, products[] } o { lowStockProducts, threshold }

**PATCH /api/inventory** (ajustar stock)

- Requiere autenticación
- Requiere STORE_OWNER role
- Body: { productId, adjustment, reason }
- Validar con AdjustInventorySchema
- Ejecutar ajuste
- Return: 200, producto actualizado

**Error handling**:

- 401 si no autenticado
- 403 si no es STORE_OWNER
- 404 si producto no existe
- 400 si validación falla

---

### 7️⃣ src/app/api/inventory/reserve/route.ts

**Propósito**: POST para reservar inventario

**POST /api/inventory/reserve**

- Requiere autenticación
- Body: { orderId, items: Array<{ productId, variantId?, quantity }> }
- Validar con ReserveInventorySchema
- Validar que todos los items existen
- Validar que hay stock suficiente para cada item
- Crear InventoryReservation
- Return: 201 created, { reservationId, items }

**Error handling**:

- 401 si no autenticado
- 404 si producto/order no existe
- 409 si stock insuficiente
- 400 si validación falla

---

### 8️⃣ src/app/api/inventory/confirm/route.ts

**Propósito**: POST para confirmar reserva (después de pago)

**POST /api/inventory/confirm**

- Body: { reservationId }
- Llamado después de pago exitoso
- Confirmar reserva (deducir stock real)
- Return: 200, { success: true }

**Error handling**:

- 404 si reserva no existe
- 409 si reserva ya fue confirmada/cancelada
- 500 si falla deducción de stock (rollback automático)

---

## 🔄 INTEGRACIÓN CON SISTEMA EXISTENTE

### Cambios en src/app/api/checkout/route.ts

Después de crear orden exitosamente, **antes de retornar clientSecret**:

```
1. Llamar a reserveInventory(orderId, items)
2. Guardar reservationId en memoria (o en la orden)
3. Si falla: rollback la orden
4. Si ok: continuar con Stripe
```

Después de confirmar pago (webhook):

```
1. Llamar a confirmInventoryReservation(reservationId)
2. Si falla: cancelar orden
3. Si ok: marcar orden como pagada
```

Si pago falla (webhook o timeout):

```
1. Llamar a cancelInventoryReservation(reservationId)
2. Marcar orden como fallida
```

---

## 🔐 SEGURIDAD REQUERIDA

### Multi-tenant Isolation

- ✅ `getLowStockProducts` debe filtrar por tenantId
- ✅ `getInventoryReport` debe filtrar por tenantId
- ✅ `adjustProductStock` debe verificar que productId pertenece al tenant

### RBAC

- ✅ POST /api/inventory/reserve: requiere usuario autenticado
- ✅ PATCH /api/inventory: requiere STORE_OWNER
- ✅ GET /api/inventory: requiere STORE_OWNER
- ✅ POST /api/products/[id]/reviews: requiere usuario
- ✅ PATCH /api/reviews/[id]: solo autor puede editar

### Validaciones

- ✅ Zod en TODOS los endpoints (no confiar en cliente)
- ✅ Validar tipos: UUIDs, números, enums
- ✅ Validar lógica: usuario es autor, stock disponible, etc.

---

## 📈 PRUEBAS SUGERIDAS (Manual)

### Review System

1. GET /api/products/[id]/reviews → lista vacía
2. POST /api/products/[id]/reviews → crear review exitoso
3. POST /api/products/[id]/reviews (mismo usuario) → error 409
4. GET /api/products/[id]/reviews → 1 review con stats
5. PATCH /api/reviews/[id] → actualizar como autor
6. PATCH /api/reviews/[id] (otro usuario) → error 403
7. DELETE /api/reviews/[id] → eliminar como autor
8. DELETE /api/reviews/[id] (otro usuario) → error 403

### Inventory System

1. GET /api/inventory (STORE_OWNER) → reporte completo
2. GET /api/inventory?lowStock=true → solo low stock
3. POST /api/inventory/reserve → reserva creada
4. POST /api/inventory/confirm → stock deducido
5. POST /api/inventory (PATCH) → ajuste manual de stock
6. GET /api/inventory → verificar nuevo stock

---

## ✅ CHECKLIST DE FINALIZACIÓN

Antes de hacer commit:

- [ ] Prisma schema tiene 4 modelos nuevos
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma migrate dev --name "add-reviews-inventory"` ejecutado
- [ ] 8 archivos .ts creados (6 DAL/API + 2 schemas)
- [ ] Todas las funciones implementadas
- [ ] Todas las validaciones implementadas
- [ ] RBAC checks en endpoints
- [ ] Multi-tenant checks en funciones sensibles
- [ ] Error handling completo (4xx, 5xx)
- [ ] `npm run build` PASA ✅
- [ ] `npm run lint` PASA ✅
- [ ] Código comentado (explicar lógica compleja)

---

## 🚀 PASOS FINALES

1. Crea rama: `git checkout -b claude/backend-sprint-4-reviews-inventory`
2. Implementa todo según especificaciones
3. Verifica compilación: `npm run build`
4. Commit: `git add . && git commit -m "feat: Implement Reviews & Inventory System - Sprint 4"`
5. Push: `git push origin claude/backend-sprint-4-reviews-inventory`
6. Notifica cuando termines para code review

---

**NOTAS IMPORTANTES**:

- ❌ NO copies código de internet sin entender
- ❌ NO hardcodees valores
- ✅ SÍ pregunta si no entiende algo
- ✅ SÍ comenta código complejo
- ✅ SÍ ejecuta npm run build antes de commit
