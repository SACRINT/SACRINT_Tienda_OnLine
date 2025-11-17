# 📋 INSTRUCCIONES PRECISAS - ARQUITECTO A - SPRINT 4
## Backend: Reviews & Inventory Management

**Fecha**: 16 de Noviembre, 2025
**Arquitecto**: A (Backend)
**Sprint**: 4 - Reviews & Inventory Management
**Duración estimada**: 4-5 días
**Status**: LISTO PARA COMENZAR

---

## 🎯 RESUMEN EJECUTIVO

Tu misión es implementar dos sistemas:
1. **Sistema de reseñas de productos** - Clientes pueden dejar reviews con rating
2. **Gestión de inventario** - Control de stock con reservas para órdenes

**Todos los archivos que necesitas crear/modificar ya están documentados aquí CON CÓDIGO EXACTO.**

---

## ⚡ PASO 0: PREPARACIÓN (5 MINUTOS)

### En tu navegador claude.ai/code:

```
1. Abre el proyecto: C:\03_Tienda digital
2. Abre la terminal integrada (Ctrl + `)
3. Verifica rama develop:
   git branch

   Deberías ver: * develop (con asterisco)

4. Si NO ves develop, hazlo:
   git checkout develop

5. Trae cambios recientes:
   git pull origin develop

6. Crea tu rama de trabajo:
   git checkout -b claude/backend-sprint-4-reviews-inventory

7. Verifica que estés en tu rama:
   git branch

   Deberías ver: * claude/backend-sprint-4-reviews-inventory
```

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### ✅ ARCHIVO 1: src/lib/db/reviews.ts
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
// Data Access Layer - Reviews
// Review management functions for products

import { db } from './client'
import { Prisma } from '@prisma/client'

/**
 * Create a new review for a product
 */
export async function createReview(data: {
  productId: string
  userId: string
  rating: number // 1-5
  title: string
  comment: string
}) {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  return db.review.create({
    data: {
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Get all reviews for a product with pagination
 */
export async function getProductReviews(
  productId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.review.count({
      where: { productId },
    }),
  ])

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get review statistics for a product
 */
export async function getReviewStats(productId: string) {
  const reviews = await db.review.findMany({
    where: { productId },
    select: { rating: true },
  })

  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    }
  }

  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  } as Record<number, number>

  let totalRating = 0
  reviews.forEach((r) => {
    totalRating += r.rating
    ratingDistribution[r.rating as keyof typeof ratingDistribution]++
  })

  return {
    averageRating: Math.round((totalRating / reviews.length) * 100) / 100,
    totalReviews: reviews.length,
    ratingDistribution,
  }
}

/**
 * Get single review by ID
 */
export async function getReviewById(reviewId: string) {
  return db.review.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Update review (only by author)
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  data: {
    rating?: number
    title?: string
    comment?: string
  }
) {
  // Verify user is author
  const review = await db.review.findUnique({
    where: { id: reviewId },
  })

  if (!review) {
    throw new Error('Review not found')
  }

  if (review.userId !== userId) {
    throw new Error('Unauthorized - only author can update review')
  }

  return db.review.update({
    where: { id: reviewId },
    data: {
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Delete review (only by author)
 */
export async function deleteReview(reviewId: string, userId: string) {
  // Verify user is author
  const review = await db.review.findUnique({
    where: { id: reviewId },
  })

  if (!review) {
    throw new Error('Review not found')
  }

  if (review.userId !== userId) {
    throw new Error('Unauthorized - only author can delete review')
  }

  return db.review.delete({
    where: { id: reviewId },
  })
}

/**
 * Check if user already reviewed this product
 */
export async function hasUserReviewedProduct(
  productId: string,
  userId: string
): Promise<boolean> {
  const review = await db.review.findFirst({
    where: {
      productId,
      userId,
    },
  })

  return !!review
}
```

---

### ✅ ARCHIVO 2: src/lib/db/inventory.ts
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
// Data Access Layer - Inventory Management
// Stock tracking and reservation for orders

import { db } from './client'

/**
 * Get current stock for a product/variant
 */
export async function getProductStock(
  productId: string,
  variantId?: string | null
) {
  if (variantId) {
    return db.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    })
  }

  return db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  })
}

/**
 * Reserve stock for an order (creates InventoryReservation)
 * Called during checkout - before payment
 * Returns reservation ID for tracking
 */
export async function reserveInventory(
  orderId: string,
  items: Array<{
    productId: string
    variantId?: string | null
    quantity: number
  }>
): Promise<string> {
  // Create reservation record
  const reservation = await db.inventoryReservation.create({
    data: {
      orderId,
      reservedAt: new Date(),
      status: 'RESERVED', // RESERVED, CONFIRMED, CANCELLED
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          reservedQuantity: item.quantity,
        })),
      },
    },
  })

  return reservation.id
}

/**
 * Confirm reservation (deduct from actual stock)
 * Called after successful payment
 */
export async function confirmInventoryReservation(
  reservationId: string
): Promise<void> {
  const reservation = await db.inventoryReservation.findUnique({
    where: { id: reservationId },
    include: { items: true },
  })

  if (!reservation) {
    throw new Error('Reservation not found')
  }

  // Update all items stock in transaction
  await db.$transaction(async (tx) => {
    for (const item of reservation.items) {
      if (item.variantId) {
        // Deduct from variant stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.reservedQuantity,
            },
          },
        })
      } else {
        // Deduct from product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.reservedQuantity,
            },
          },
        })
      }
    }

    // Mark reservation as confirmed
    await tx.inventoryReservation.update({
      where: { id: reservationId },
      data: { status: 'CONFIRMED' },
    })
  })
}

/**
 * Cancel reservation (release reserved stock)
 * Called if order is cancelled or payment fails
 */
export async function cancelInventoryReservation(
  reservationId: string
): Promise<void> {
  const reservation = await db.inventoryReservation.findUnique({
    where: { id: reservationId },
  })

  if (!reservation) {
    throw new Error('Reservation not found')
  }

  // Just mark as cancelled - stock remains in product
  await db.inventoryReservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELLED' },
  })
}

/**
 * Get products with low stock
 */
export async function getLowStockProducts(
  tenantId: string,
  threshold: number = 10
) {
  return db.product.findMany({
    where: {
      tenantId,
      stock: {
        lte: threshold,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      variants: {
        where: {
          stock: {
            lte: threshold,
          },
        },
        select: {
          id: true,
          stock: true,
          size: true,
          color: true,
        },
      },
    },
    orderBy: { stock: 'asc' },
  })
}

/**
 * Update product stock (manual adjustment by STORE_OWNER)
 */
export async function adjustProductStock(
  productId: string,
  adjustment: number, // negative = decrease, positive = increase
  reason: string // "RECOUNT", "RETURN", "DAMAGE", etc.
) {
  const product = await db.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  const newStock = Math.max(0, product.stock + adjustment)

  return db.$transaction(async (tx) => {
    // Update product stock
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    })

    // Log adjustment
    await tx.inventoryLog.create({
      data: {
        productId,
        adjustment,
        reason,
        previousStock: product.stock,
        newStock,
      },
    })

    return updatedProduct
  })
}

/**
 * Get inventory history for a product
 */
export async function getInventoryHistory(
  productId: string,
  limit: number = 50
) {
  return db.inventoryLog.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get inventory report for tenant dashboard
 */
export async function getInventoryReport(tenantId: string) {
  const products = await db.product.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      stock: true,
      basePrice: true,
      variants: {
        select: {
          id: true,
          stock: true,
        },
      },
    },
  })

  const totalItems = products.reduce((sum, p) => sum + p.stock, 0)
  const lowStockCount = products.filter((p) => p.stock < 10).length
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)

  return {
    summary: {
      totalProducts: products.length,
      totalVariants,
      totalItemsInStock: totalItems,
      lowStockProducts: lowStockCount,
    },
    products,
  }
}
```

---

### ✅ ARCHIVO 3: src/lib/security/schemas/review-schemas.ts
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
// Review and Inventory Validation Schemas
import { z } from 'zod'

// ============ REVIEW SCHEMAS ============

export const CreateReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.coerce
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must not exceed 500 characters'),
})

export const UpdateReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters')
    .optional(),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must not exceed 500 characters')
    .optional(),
})

export const ReviewFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
})

// ============ INVENTORY SCHEMAS ============

export const AdjustInventorySchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  adjustment: z.coerce.number().int('Adjustment must be an integer'),
  reason: z.enum(['RECOUNT', 'RETURN', 'DAMAGE', 'PURCHASE', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid reason' }),
  }),
})

export const ReservationItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  variantId: z.string().uuid('Invalid variant ID').optional().nullable(),
  quantity: z.coerce
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive'),
})

export const ReserveInventorySchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  items: z.array(ReservationItemSchema).min(1, 'At least one item required'),
})
```

---

### ✅ ARCHIVO 4: src/app/api/products/[id]/reviews/route.ts
**CREAR CARPETA PRIMERO**: src/app/api/products/[id]/reviews/
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
// GET /api/products/[id]/reviews - Get product reviews
// POST /api/products/[id]/reviews - Create review

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  getProductReviews,
  createReview,
  hasUserReviewedProduct,
} from '@/lib/db/reviews'
import { getProductById } from '@/lib/db/products'
import {
  CreateReviewSchema,
  ReviewFilterSchema,
} from '@/lib/security/schemas/review-schemas'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate product exists
    const product = await getProductById(params.id)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const validation = ReviewFilterSchema.safeParse({
      productId: params.id,
      minRating: searchParams.get('minRating'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit } = validation.data

    // Get reviews with pagination
    const result = await getProductReviews(params.id, page, limit)

    return NextResponse.json({
      reviews: result.reviews,
      pagination: result.pagination,
      productId: params.id,
    })
  } catch (error) {
    console.error('[REVIEWS] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate product exists
    const product = await getProductById(params.id)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()

    const validation = CreateReviewSchema.safeParse({
      productId: params.id,
      rating: body.rating,
      title: body.title,
      comment: body.comment,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await hasUserReviewedProduct(params.id, session.user.id)
    if (alreadyReviewed) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      )
    }

    // Create review
    const review = await createReview({
      productId: params.id,
      userId: session.user.id,
      rating: validation.data.rating,
      title: validation.data.title,
      comment: validation.data.comment,
    })

    console.log('[REVIEWS] Created review:', review.id, 'for product:', params.id)

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('[REVIEWS] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
```

---

### ✅ ARCHIVO 5: src/app/api/reviews/[id]/route.ts
**CREAR CARPETA PRIMERO**: src/app/api/reviews/
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
// PATCH /api/reviews/[id] - Update review
// DELETE /api/reviews/[id] - Delete review

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getReviewById, updateReview, deleteReview } from '@/lib/db/reviews'
import { UpdateReviewSchema } from '@/lib/security/schemas/review-schemas'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify review exists and user is author
    const review = await getReviewById(params.id)
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only author can update' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    const validation = UpdateReviewSchema.safeParse({
      rating: body.rating,
      title: body.title,
      comment: body.comment,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    // Update review
    const updated = await updateReview(params.id, session.user.id, validation.data)

    console.log('[REVIEWS] Updated review:', params.id)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[REVIEWS] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify review exists and user is author
    const review = await getReviewById(params.id)
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only author can delete' },
        { status: 403 }
      )
    }

    // Delete review
    await deleteReview(params.id, session.user.id)

    console.log('[REVIEWS] Deleted review:', params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[REVIEWS] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
```

---

### ✅ ARCHIVO 6: src/app/api/inventory/route.ts
**CREAR CARPETA PRIMERO**: src/app/api/inventory/
**CREAR NUEVO ARCHIVO**

Copia y pega EXACTAMENTE este código:

```typescript
// GET /api/inventory - Get inventory report
// PATCH /api/inventory/adjust - Adjust stock

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import {
  getInventoryReport,
  adjustProductStock,
  getLowStockProducts,
} from '@/lib/db/inventory'
import { AdjustInventorySchema } from '@/lib/security/schemas/review-schemas'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only STORE_OWNER can see inventory
    if (session.user.role !== UserRole.STORE_OWNER) {
      return NextResponse.json(
        { error: 'Forbidden - store owner only' },
        { status: 403 }
      )
    }

    // Get tenant ID from user
    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: 'No tenant assigned' },
        { status: 400 }
      )
    }

    // Check for low stock filter
    const includeLowStock = request.nextUrl.searchParams.get('lowStock') === 'true'

    if (includeLowStock) {
      const lowStockProducts = await getLowStockProducts(session.user.tenantId, 10)
      return NextResponse.json({
        lowStockProducts,
        threshold: 10,
      })
    }

    // Get full inventory report
    const report = await getInventoryReport(session.user.tenantId)

    return NextResponse.json(report)
  } catch (error) {
    console.error('[INVENTORY] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only STORE_OWNER can adjust inventory
    if (session.user.role !== UserRole.STORE_OWNER) {
      return NextResponse.json(
        { error: 'Forbidden - store owner only' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    const validation = AdjustInventorySchema.safeParse({
      productId: body.productId,
      adjustment: body.adjustment,
      reason: body.reason,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.error.issues },
        { status: 400 }
      )
    }

    // Adjust inventory
    const updated = await adjustProductStock(
      validation.data.productId,
      validation.data.adjustment,
      validation.data.reason
    )

    console.log(
      '[INVENTORY] Adjusted stock for product:',
      validation.data.productId,
      'by:',
      validation.data.adjustment
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[INVENTORY] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to adjust inventory' },
      { status: 500 }
    )
  }
}
```

---

## 🔄 PASO 1: CREAR ARCHIVOS EN claude.ai/code

**En tu editor de claude.ai/code:**

1. Crea la carpeta `src/lib/db/` (si no existe)
2. Crea archivo: `reviews.ts` - Copia EXACTAMENTE el código de ARCHIVO 1
3. Crea archivo: `inventory.ts` - Copia EXACTAMENTE el código de ARCHIVO 2
4. Crea archivo: `src/lib/security/schemas/review-schemas.ts` - Copia EXACTAMENTE el código de ARCHIVO 3
5. Crea carpeta: `src/app/api/products/[id]/reviews/`
6. Crea archivo: `src/app/api/products/[id]/reviews/route.ts` - Copia EXACTAMENTE el código de ARCHIVO 4
7. Crea carpeta: `src/app/api/reviews/`
8. Crea archivo: `src/app/api/reviews/[id]/route.ts` - Copia EXACTAMENTE el código de ARCHIVO 5
9. Crea carpeta: `src/app/api/inventory/`
10. Crea archivo: `src/app/api/inventory/route.ts` - Copia EXACTAMENTE el código de ARCHIVO 6

---

## ✅ PASO 2: VERIFICACIÓN

En la terminal de claude.ai/code:

```bash
# Compilar para ver si hay errores
npm run build

# Deberías ver: ✓ Compiled successfully
# SI VES ERRORES, NO HAGAS COMMIT. Avísame inmediatamente.
```

---

## 🎯 PASO 3: COMMIT Y PUSH

En la terminal de claude.ai/code:

```bash
# Ver qué archivos cambiaron
git status

# Deberías ver los 6 archivos nuevos como "untracked"

# Agregar todos los archivos
git add .

# Hacer commit con mensaje descriptivo
git commit -m "feat(backend): Implement Reviews & Inventory Management - Sprint 4

- Add review creation, listing, updating, deletion
- Add review statistics and ratings
- Add inventory reservation system
- Add stock adjustment and logging
- Add low stock alerts
- Add inventory reports for dashboard
- All with multi-tenant isolation and RBAC"

# Push a tu rama
git push origin claude/backend-sprint-4-reviews-inventory

# Resultado esperado:
# [new branch] claude/backend-sprint-4-reviews-inventory -> claude/backend-sprint-4-reviews-inventory
```

---

## 🚨 CHECKLIST FINAL

Antes de decir que terminaste:

- [ ] Creé EXACTAMENTE 6 archivos nuevos
- [ ] Copié el código EXACTAMENTE como está (sin cambios)
- [ ] Ejecuté `npm run build` y pasó ✅
- [ ] Ejecuté `git add . && git commit && git push`
- [ ] No hay errores en la compilación
- [ ] Mi rama está en remoto: `claude/backend-sprint-4-reviews-inventory`

---

## ⚠️ RESTRICCIONES CRÍTICAS

**NUNCA HAGAS:**
- ❌ No cambies nombres de funciones
- ❌ No agregues campos que no están documentados
- ❌ No hagas imports de otros DALs sin documentación
- ❌ No uses `findUnique` con campos no unique
- ❌ No dejes comentarios sin código funcional
- ❌ No commits sin pasar `npm run build`

---

## ❓ SI ALGO SALE MAL

Si ves errores en `npm run build`:

1. **NO hagas commit**
2. **Copia el error exacto**
3. **Avisa: "Error en ARCHIVO X, línea Y: [copia del error]"**
4. **NO intentes arreglarlo solo** - Avísame para que lo corrija

---

**Listo para comenzar Sprint 4? Adelante!** 🚀
