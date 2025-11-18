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

    // Log status change and append note to adminNotes if provided
    if (note) {
      const existingNotes = order.adminNotes ? `${order.adminNotes}\n---\n` : ''
      const timestamp = new Date().toISOString()
      const noteName = session.user.name || session.user.email
      const noteContent = `[${timestamp}] Status changed from ${order.status} to ${status}. ${note} (by ${noteName})`

      await db.order.update({
        where: { id: params.id },
        data: {
          adminNotes: `${existingNotes}${noteContent}`,
        },
      })
    }

    // TODO: Activity logging - implement with dedicated activity log model if needed
    console.log('[Order Status API] Status updated', {
      tenantId,
      orderId: params.id,
      userId: session.user.id,
      previousStatus: order.status,
      newStatus: status,
    })

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

    // TODO: Implement status history tracking - currently returning empty for future implementation
    const formattedHistory: any[] = []

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
