// Inventory Reservation Confirmation API
// POST /api/inventory/confirm - Confirm reservation and deduct stock

import { NextRequest, NextResponse } from 'next/server'
import { confirmInventoryReservation } from '@/lib/db/inventory'
import { ConfirmReservationSchema } from '@/lib/security/schemas/review-schemas'
import { db } from '@/lib/db/client'

/**
 * POST /api/inventory/confirm
 * Confirms an inventory reservation and deducts stock
 * Called after successful payment confirmation
 * Uses database transaction for atomicity
 *
 * Body:
 * - reservationId: UUID
 *
 * Flow:
 * 1. Order created → 2. Reserve inventory → 3. Payment confirmed → 4. CONFIRM RESERVATION (this endpoint)
 *
 * IMPORTANT: This endpoint does NOT require authentication because it's called
 * by internal systems (payment webhooks, checkout flow) that already have the reservationId.
 * The reservationId itself is proof of authorization.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = ConfirmReservationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { reservationId } = validation.data

    // Get reservation to extract tenantId (needed for tenant isolation)
    const reservation = await db.inventoryReservation.findUnique({
      where: { id: reservationId },
      include: {
        order: {
          select: { tenantId: true }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    const tenantId = reservation.order.tenantId

    // Confirm the reservation (deducts stock in transaction)
    try {
      await confirmInventoryReservation(tenantId, reservationId)

      console.log(
        `[INVENTORY] Confirmed reservation ${reservationId} - stock deducted`
      )

      return NextResponse.json({
        success: true,
        message: 'Inventory reservation confirmed and stock deducted',
        reservationId,
      })
    } catch (error) {
      // Handle known errors
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            {
              error: 'Reservation not found',
              message: error.message,
            },
            { status: 404 }
          )
        }

        if (error.message.includes('already')) {
          return NextResponse.json(
            {
              error: 'Conflict - Reservation already processed',
              message: error.message,
            },
            { status: 409 }
          )
        }
      }

      throw error
    }
  } catch (error) {
    console.error('[INVENTORY] Confirm reservation error:', error)

    // Handle database transaction failures
    if (error instanceof Error && error.message.includes('Transaction')) {
      return NextResponse.json(
        {
          error: 'Stock deduction failed - transaction rolled back',
          message:
            'The inventory reservation could not be confirmed. The stock has not been modified.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
