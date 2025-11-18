// GET /api/reports/coupons
// Coupon usage and ROI reports

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'

import { getCouponReports } from '@/lib/analytics/queries'
import { subDays } from 'date-fns'

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!tenantId || (session.user.role === 'STORE_OWNER' && session.user.tenantId !== tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const start = startDate ? new Date(startDate) : subDays(new Date(), 29)
    const end = endDate ? new Date(endDate) : new Date()

    const data = await getCouponReports(tenantId, start, end)

    return NextResponse.json({
      data,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Coupon reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
