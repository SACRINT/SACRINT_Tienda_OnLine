// API Route - Dashboard Recent Orders
// GET /api/admin/dashboard/orders - Returns recent orders with details

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getRecentOrders } from '@/lib/db/dashboard'
import { RecentOrdersSchema } from '@/lib/security/schemas/dashboard-schemas'

/**
 * GET /api/admin/dashboard/orders
 * Returns recent orders with user and item details
 *
 * @query limit - Number of orders to return (default: 10, max: 100)
 * @requires Authentication
 * @requires STORE_OWNER or SUPER_ADMIN role
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant ID found' },
        { status: 401 }
      )
    }

    // Parse query parameter
    const limitParam = req.nextUrl.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 10

    // Validate input
    const validation = RecentOrdersSchema.safeParse({
      tenantId: session.user.tenantId,
      limit,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const orders = await getRecentOrders(
      validation.data.tenantId,
      validation.data.limit
    )

    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        limit: validation.data.limit,
        count: orders.length,
      },
    })
  } catch (error: any) {
    console.error('[DASHBOARD ORDERS] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recent orders' },
      { status: 500 }
    )
  }
}
