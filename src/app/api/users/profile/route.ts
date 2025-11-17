// User Profile API
// GET /api/users/profile - Get current user's profile
// PATCH /api/users/profile - Update current user's profile

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getUserById, updateUser } from '@/lib/db/users'
import { z } from 'zod'

// Validation schema for profile updates
const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  image: z.string().url('Invalid image URL').optional().nullable(),
})

/**
 * GET /api/users/profile
 * Returns the current user's profile information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
        { status: 401 }
      )
    }

    const { tenantId, id: userId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Get user profile
    const user = await getUserById(tenantId, userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          logo: user.tenant.logo,
        } : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error('[PROFILE] GET error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/profile
 * Updates the current user's profile information
 * Users can only update their own profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You must be logged in' },
        { status: 401 }
      )
    }

    const { tenantId, id: userId } = session.user

    if (!tenantId) {
      return NextResponse.json(
        { error: 'User has no tenant assigned' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = UpdateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          issues: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, phone, image } = validation.data

    // Update user profile
    const updatedUser = await updateUser(tenantId, userId, {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(image !== undefined && { image }),
    })

    console.log(`[PROFILE] Updated profile for user ${userId}`)

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        image: updatedUser.image,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error) {
    console.error('[PROFILE] PATCH error:', error)

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('does not belong to tenant')) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
