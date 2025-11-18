/**
 * Notification Preferences API
 * GET - Get user preferences
 * PUT - Update preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const preferencesSchema = z.object({
  emailOrderConfirmation: z.boolean().optional(),
  emailOrderShipped: z.boolean().optional(),
  emailOrderDelivered: z.boolean().optional(),
  emailOrderCancelled: z.boolean().optional(),
  emailRefundProcessed: z.boolean().optional(),
  emailNewReview: z.boolean().optional(),
  emailProductRestocked: z.boolean().optional(),
  emailPromotions: z.boolean().optional(),
  emailNewsletters: z.boolean().optional(),
  inAppOrderUpdates: z.boolean().optional(),
  inAppNewReviews: z.boolean().optional(),
  inAppPromotions: z.boolean().optional(),
  inAppProductRestocked: z.boolean().optional(),
  pushOrderUpdates: z.boolean().optional(),
  pushPromotions: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await db.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await db.notificationPreference.create({
        data: { userId: session.user.id },
      })
    }

    return NextResponse.json(preferences)
  } catch (error: any) {
    console.error('[Notification Preferences API] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = preferencesSchema.parse(body)

    const preferences = await db.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        ...data,
      },
    })

    return NextResponse.json(preferences)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 })
    }
    console.error('[Notification Preferences API] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
