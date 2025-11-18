// GET /api/products/:id
// GET, PUT, PATCH, DELETE operations for individual product

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

import { db } from '@/lib/db'
import { z } from 'zod'

// GET single product
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId required' },
        { status: 400 }
      )
    }

    const product = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH for quick updates (used by QuickEdit component)
const QuickUpdateSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validation = QuickUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, ...updates } = validation.data

    // Validate tenant access
    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify product exists and belongs to tenant
    const existing = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update product
    const updated = await db.product.update({
      where: { id: params.id },
      data: updates,
    })

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log('[Product API] Product updated (quick edit)', {
      tenantId,
      productId: params.id,
      userId: session.user.id,
      updates,
    })

    return NextResponse.json({
      success: true,
      product: updated,
    })
  } catch (error) {
    console.error('Patch product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT for full updates
const UpdateProductSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']),
  categoryId: z.string().uuid().optional(),
  sku: z.string().optional(),
  images: z.array(z.string().url()).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validation = UpdateProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, images, ...data } = validation.data

    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify product exists and belongs to tenant
    const existing = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update product
    const updated = await db.product.update({
      where: { id: params.id },
      data,
    })

    // Update images if provided
    if (images) {
      // Delete old images
      await db.productImage.deleteMany({
        where: { productId: params.id },
      })

      // Create new images
      await db.productImage.createMany({
        data: images.map((url, index) => ({
          productId: params.id,
          url,
          altText: `${data.name} - Image ${index + 1}`,
          order: index,
        })),
      })
    }

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log('[Product API] Product updated (full update)', {
      tenantId,
      productId: params.id,
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      product: updated,
    })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STORE_OWNER' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId required' },
        { status: 400 }
      )
    }

    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify product exists and belongs to tenant
    const existing = await db.product.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Mark as unpublished (soft delete via published flag)
    const deleted = await db.product.update({
      where: { id: params.id },
      data: {
        published: false,
      },
    })

    // TODO: Log activity - implement with dedicated activity log model if needed
    console.log('[Product API] Product deleted', {
      tenantId,
      productId: params.id,
      userId: session.user.id,
      productName: existing.name,
    })

    return NextResponse.json({
      success: true,
      product: deleted,
    })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
