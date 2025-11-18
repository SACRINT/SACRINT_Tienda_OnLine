// PATCH /api/orders/:id/status
// Update order status with audit trail

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateStatusSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().optional(),
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
    const validation = UpdateStatusSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, status, note } = validation.data

    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify order exists and belongs to tenant
    const order = await db.order.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status
    const updated = await db.order.update({
      where: { id: params.id },
      data: { status },
    })

    // Log status change in activity log
    await db.activityLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'ORDER_STATUS_UPDATE',
        entityType: 'ORDER',
        entityId: params.id,
        metadata: {
          previousStatus: order.status,
          newStatus: status,
          note,
        },
      },
    })

    // If note is provided, add it as an internal note
    if (note) {
      await db.orderNote.create({
        data: {
          orderId: params.id,
          userId: session.user.id,
          content: `Status changed from ${order.status} to ${status}. ${note}`,
          type: 'INTERNAL',
        },
      })
    }

    // TODO: Send email notification to customer based on status
    // TODO: Trigger webhook for status change

    return NextResponse.json({
      success: true,
      order: updated,
    })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/orders/:id/status
// Get status history for an order
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

    if (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get status history from activity logs
    const history = await db.activityLog.findMany({
      where: {
        tenantId,
        entityType: 'ORDER',
        entityId: params.id,
        action: 'ORDER_STATUS_UPDATE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedHistory = history.map((log: any) => ({
      id: log.id,
      status: log.metadata?.newStatus || 'UNKNOWN',
      note: log.metadata?.note,
      createdAt: log.createdAt,
      user: log.user,
    }))

    return NextResponse.json({
      history: formattedHistory,
    })
  } catch (error) {
    console.error('Get status history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
