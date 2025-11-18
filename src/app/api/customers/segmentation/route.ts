// GET /api/customers/segmentation
// RFM Analysis and Customer Segmentation

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { subDays } from 'date-fns'

// RFM Segmentation Logic
function calculateRFMScore(recencyDays: number, frequency: number, monetary: number) {
  // Recency: Lower is better (more recent)
  let recencyScore = 1
  if (recencyDays <= 30) recencyScore = 5
  else if (recencyDays <= 60) recencyScore = 4
  else if (recencyDays <= 90) recencyScore = 3
  else if (recencyDays <= 180) recencyScore = 2

  // Frequency: Higher is better
  let frequencyScore = 1
  if (frequency >= 10) frequencyScore = 5
  else if (frequency >= 5) frequencyScore = 4
  else if (frequency >= 3) frequencyScore = 3
  else if (frequency >= 2) frequencyScore = 2

  // Monetary: Higher is better
  let monetaryScore = 1
  if (monetary >= 1000) monetaryScore = 5
  else if (monetary >= 500) monetaryScore = 4
  else if (monetary >= 200) monetaryScore = 3
  else if (monetary >= 100) monetaryScore = 2

  return {
    recency: recencyScore,
    frequency: frequencyScore,
    monetary: monetaryScore,
    total: recencyScore + frequencyScore + monetaryScore,
  }
}

function assignSegment(rfmScore: ReturnType<typeof calculateRFMScore>, recencyDays: number) {
  const { recency, frequency, monetary, total } = rfmScore

  // Champions: High RFM scores
  if (recency >= 4 && frequency >= 4 && monetary >= 4) {
    return 'champions'
  }

  // Loyal: High frequency and monetary, decent recency
  if (frequency >= 3 && monetary >= 3 && recency >= 2) {
    return 'loyal'
  }

  // Promising: Recent buyers with potential
  if (recency >= 4 && frequency <= 2) {
    return 'promising'
  }

  // New: Very recent first purchase
  if (recency === 5 && frequency === 1) {
    return 'new'
  }

  // At Risk: Used to buy, but not recently
  if (recency <= 2 && (frequency >= 3 || monetary >= 3)) {
    return 'at_risk'
  }

  // Lost: Haven't purchased in a long time
  if (recency === 1 && recencyDays > 180) {
    return 'lost'
  }

  // Default: Promising for lower scores but recent activity
  return 'promising'
}

export async function GET(req: NextRequest) {
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

    // Get all customers with their orders
    const users = await db.user.findMany({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {
            tenantId,
            status: { not: 'CANCELLED' },
          },
        },
      },
      include: {
        orders: {
          where: {
            tenantId,
            status: { not: 'CANCELLED' },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    const now = new Date()

    // Calculate RFM for each customer
    const customersWithRFM = users.map((user: any) => {
      const orders = user.orders
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum: number, order: any) => sum + order.total, 0)
      const lastOrder = orders[0]
      const lastOrderDate = lastOrder ? lastOrder.createdAt : null
      const recencyDays = lastOrderDate
        ? Math.floor((now.getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const rfmScore = calculateRFMScore(recencyDays, totalOrders, totalSpent / 100)
      const segment = assignSegment(rfmScore, recencyDays)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        totalOrders,
        totalSpent,
        lastOrderDate,
        createdAt: user.createdAt,
        rfmScore,
        segment,
      }
    })

    // Calculate summary
    const summary = {
      champions: customersWithRFM.filter((c: any) => c.segment === 'champions').length,
      loyal: customersWithRFM.filter((c: any) => c.segment === 'loyal').length,
      promising: customersWithRFM.filter((c: any) => c.segment === 'promising').length,
      new: customersWithRFM.filter((c: any) => c.segment === 'new').length,
      atRisk: customersWithRFM.filter((c: any) => c.segment === 'at_risk').length,
      lost: customersWithRFM.filter((c: any) => c.segment === 'lost').length,
    }

    // Sort by RFM total score descending
    customersWithRFM.sort((a: any, b: any) => b.rfmScore.total - a.rfmScore.total)

    return NextResponse.json({
      customers: customersWithRFM,
      summary,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Customer segmentation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
